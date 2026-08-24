const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");

// ---- Format validators ----
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:mm 24h

// Fields to include when populating the doctor document
const DOCTOR_FIELDS =
  "name email phone specialization department experience qualification available consultationFee avatar";

// ==========================================
// BOOK APPOINTMENT
// POST /api/appointments
// ==========================================
const createAppointment = async (req, res) => {
  try {
    const { doctor: doctorId, department, date, time, reason } = req.body;

    // ---------- Validate required fields ----------
    if (!doctorId) {
      return res.status(400).json({ success: false, message: "Please select a doctor" });
    }
    if (!department || !String(department).trim()) {
      return res.status(400).json({ success: false, message: "Department is required" });
    }
    if (!date || !DATE_REGEX.test(date)) {
      return res.status(400).json({
        success: false,
        message: "A valid appointment date (YYYY-MM-DD) is required",
      });
    }
    if (!time || !TIME_REGEX.test(time)) {
      return res.status(400).json({
        success: false,
        message: "A valid appointment time (HH:mm) is required",
      });
    }

    // ---------- Date must be a real date & not in the past ----------
    const appointmentDateTime = new Date(`${date}T${time}:00`);

    if (isNaN(appointmentDateTime.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment date or time",
      });
    }

    if (appointmentDateTime.getTime() <= Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Appointment must be booked for a future date and time",
      });
    }

    // ---------- Doctor must exist in the Doctor collection ----------
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Selected doctor was not found",
      });
    }

    // ---------- Conflict check 1: slot already taken for this doctor ----------
    const doctorConflict = await Appointment.findOne({
      doctor: doctorId,
      date,
      time,
      status: "Scheduled",
    });

    if (doctorConflict) {
      return res.status(409).json({
        success: false,
        message:
          "This time slot is already booked for the selected doctor. Please choose another slot.",
      });
    }

    // ---------- Conflict check 2: patient already booked at this date/time ----------
    const patientConflict = await Appointment.findOne({
      patient: req.user.id,
      date,
      time,
      status: "Scheduled",
    });

    if (patientConflict) {
      return res.status(409).json({
        success: false,
        message:
          "You already have an appointment scheduled at this date and time. Please choose another slot.",
      });
    }

    // ---------- Create ----------
    const appointment = await Appointment.create({
      patient: req.user.id,
      doctor: doctorId,
      department: String(department).trim(),
      date,
      time,
      reason: reason ? String(reason).trim() : "",
      status: "Scheduled",
    });

    // Populate doctor info for immediate display on the frontend
    await appointment.populate("doctor", DOCTOR_FIELDS);

    return res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      appointment,
    });
  } catch (error) {
    console.error("CREATE APPOINTMENT ERROR:", error);

    // Race-condition safety net from the unique index
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "This time slot has just been booked by someone else. Please choose another slot.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)[0]?.message || "Invalid appointment data",
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor reference",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to book appointment. Please try again.",
    });
  }
};

// ==========================================
// GET MY APPOINTMENTS
// GET /api/appointments/my
// Returns ONLY appointments belonging to the authenticated user
// ==========================================
const getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user.id })
      .populate("doctor", DOCTOR_FIELDS)
      .sort({ date: 1, time: 1 });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error("GET MY APPOINTMENTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your appointments",
    });
  }
};

// ==========================================
// GET SINGLE APPOINTMENT
// GET /api/appointments/:id
// Owner or admin only
// ==========================================
const getAppointmentById = async (req, res) => {
  try {
    const query = { _id: req.params.id };

    // Non-admins can only view their own appointments
    if (req.user.role !== "admin") {
      query.patient = req.user.id;
    }

    const appointment = await Appointment.findOne(query)
      .populate("doctor", DOCTOR_FIELDS)
      .populate("patient", "name email phone");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    return res.status(200).json({
      success: true,
      appointment,
    });
  } catch (error) {
    console.error("GET APPOINTMENT ERROR:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment id",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch appointment",
    });
  }
};

// ==========================================
// UPDATE APPOINTMENT STATUS
// PUT /api/appointments/:id
// - Admins can set any status
// - Patients can only cancel their OWN scheduled appointments
// ==========================================
const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !["Scheduled", "Completed", "Cancelled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Scheduled, Completed or Cancelled",
      });
    }

    const query = { _id: req.params.id };

    if (req.user.role !== "admin") {
      query.patient = req.user.id;
    }

    const appointment = await Appointment.findOne(query);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Patients may only cancel; completing/re-scheduling is staff work
    if (req.user.role !== "admin" && status !== "Cancelled") {
      return res.status(403).json({
        success: false,
        message: "You are only allowed to cancel your own appointments",
      });
    }

    if (appointment.status === "Cancelled" && status !== "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "A cancelled appointment cannot be re-opened. Please book a new one.",
      });
    }

    appointment.status = status;
    await appointment.save();
    await appointment.populate("doctor", DOCTOR_FIELDS);

    return res.status(200).json({
      success: true,
      message: `Appointment ${status.toLowerCase()} successfully`,
      appointment,
    });
  } catch (error) {
    console.error("UPDATE APPOINTMENT STATUS ERROR:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment id",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update appointment",
    });
  }
};

// ==========================================
// CANCEL APPOINTMENT
// PUT /api/appointments/:id/cancel
// Patient cancels their own appointment
// ==========================================
const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      patient: req.user.id,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (appointment.status !== "Scheduled") {
      return res.status(400).json({
        success: false,
        message: `Only scheduled appointments can be cancelled (current status: ${appointment.status})`,
      });
    }

    appointment.status = "Cancelled";
    await appointment.save();
    await appointment.populate("doctor", DOCTOR_FIELDS);

    return res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
      appointment,
    });
  } catch (error) {
    console.error("CANCEL APPOINTMENT ERROR:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment id",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to cancel appointment",
    });
  }
};

// ==========================================
// DELETE APPOINTMENT
// DELETE /api/appointments/:id
// Owner or admin — permanently removes the record
// ==========================================
const deleteAppointment = async (req, res) => {
  try {
    const query = { _id: req.params.id };

    if (req.user.role !== "admin") {
      query.patient = req.user.id;
    }

    const appointment = await Appointment.findOneAndDelete(query);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Appointment deleted successfully",
    });
  } catch (error) {
    console.error("DELETE APPOINTMENT ERROR:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment id",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to delete appointment",
    });
  }
};

module.exports = {
  createAppointment,
  getMyAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  cancelAppointment,
  deleteAppointment,
};