const Doctor = require("../models/Doctor");

// Whitelisted fields accepted on create/update
const parseDoctorBody = (body) => {
  const data = {};

  const fields = [
    "name",
    "email",
    "phone",
    "specialization",
    "department",
    "experience",
    "qualification",
    "available",
    "consultationFee",
    "avatar",
  ];

  fields.forEach((field) => {
    if (body[field] !== undefined) {
      data[field] = body[field];
    }
  });

  if (body.availability && typeof body.availability === "object") {
    data.availability = {
      days: Array.isArray(body.availability.days)
        ? body.availability.days
        : undefined,
      startTime: body.availability.startTime,
      endTime: body.availability.endTime,
    };
  }

  return data;
};

// ==========================================
// CREATE DOCTOR (admin only — enforced in route)
// POST /api/doctors
// ==========================================
const createDoctor = async (req, res) => {
  try {
    const data = parseDoctorBody(req.body);

    if (!data.name || !data.email || !data.specialization || !data.department) {
      return res.status(400).json({
        success: false,
        message: "Name, email, specialization and department are required",
      });
    }

    const existingDoctor = await Doctor.findOne({
      email: String(data.email).toLowerCase(),
    });

    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: "A doctor with this email already exists",
      });
    }

    const doctor = await Doctor.create(data);

    return res.status(201).json({
      success: true,
      message: "Doctor created successfully",
      doctor,
    });
  } catch (error) {
    console.error("CREATE DOCTOR ERROR:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A doctor with this email already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)[0]?.message || "Invalid doctor data",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create doctor",
    });
  }
};

// ==========================================
// GET ALL DOCTORS
// GET /api/doctors?department=Cardiology&search=smith
// Supports optional server-side filtering
// ==========================================
const getDoctors = async (req, res) => {
  try {
    const { department, search } = req.query;

    const filter = {};

    if (department && department !== "All") {
      filter.department = department;
    }

    if (search && String(search).trim()) {
      const regex = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: regex }, { specialization: regex }];
    }

    const doctors = await Doctor.find(filter).sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: doctors.length,
      doctors,
    });
  } catch (error) {
    console.error("GET DOCTORS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch doctors",
    });
  }
};

// ==========================================
// GET SINGLE DOCTOR
// GET /api/doctors/:id
// ==========================================
const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    return res.status(200).json({
      success: true,
      doctor,
    });
  } catch (error) {
    console.error("GET DOCTOR ERROR:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor id",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch doctor",
    });
  }
};

// ==========================================
// UPDATE DOCTOR (admin only — enforced in route)
// PUT /api/doctors/:id
// ==========================================
const updateDoctor = async (req, res) => {
  try {
    const data = parseDoctorBody(req.body);

    const doctor = await Doctor.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Doctor updated successfully",
      doctor,
    });
  } catch (error) {
    console.error("UPDATE DOCTOR ERROR:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)[0]?.message || "Invalid doctor data",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update doctor",
    });
  }
};

// ==========================================
// DELETE DOCTOR (admin only — enforced in route)
// DELETE /api/doctors/:id
// ==========================================
const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Doctor deleted successfully",
    });
  } catch (error) {
    console.error("DELETE DOCTOR ERROR:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor id",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to delete doctor",
    });
  }
};

module.exports = {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
};