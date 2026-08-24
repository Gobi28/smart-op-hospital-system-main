import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  CalendarPlus,
  Clock,
  MapPin,
  X,
  CheckCircle2,
  XCircle,
  Eye,
  Stethoscope,
} from "lucide-react";

import {
  getMyAppointments,
  getDoctors,
  bookAppointment,
  cancelAppointment,
  getErrorMessage,
} from "../services/api";

/* =========================
   CONSTANTS & HELPERS
========================= */

// Bookable time slots: 09:00 -> 17:30 every 30 minutes
const TIME_SLOTS = (() => {
  const slots = [];
  for (let h = 9; h <= 17; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  return slots;
})();

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

const slotToDate = (a) => new Date(`${a.date}T${a.time || "00:00"}:00`);

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (timeStr) => {
  if (!timeStr) return "-";
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
};

const FILTERS = ["All", "Upcoming", "Completed", "Cancelled"];

/* =========================
   COMPONENT
========================= */

function Appointments() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [doctorsLoading, setDoctorsLoading] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ---- booking modal state ----
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [form, setForm] = useState({
    department: "",
    doctor: "",
    date: "",
    time: "",
    reason: "",
  });
  const [formError, setFormError] = useState("");
  const [booking, setBooking] = useState(false);

  // ---- detail modal state ----
  const [detailAppointment, setDetailAppointment] = useState(null);

  // ---- cancel state ----
  const [cancellingId, setCancellingId] = useState(null);

  // ---- list filter tab ----
  const [filter, setFilter] = useState("All");

  /* ---------- data loading ---------- */

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await getMyAppointments();
      setAppointments(res.data.appointments || []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load your appointments."));
      setAppointments([]);
    }
  }, []);

  const fetchDoctors = useCallback(async () => {
    setDoctorsLoading(true);
    try {
      const res = await getDoctors();
      setDoctors(res.data.doctors || []);
    } catch (err) {
      console.error("DOCTORS ERROR:", getErrorMessage(err));
      setDoctors([]);
    } finally {
      setDoctorsLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError("");
      setSuccess("");

      await Promise.all([fetchAppointments(), fetchDoctors()]);

      // Deep links: /appointments?book=true or /appointments?doctor=<id>
      const preselectDoctor = searchParams.get("doctor");
      if (searchParams.get("book") === "true" || preselectDoctor) {
        openBookingModal(preselectDoctor || "");
      }

      setLoading(false);
      // Clean the URL so refresh doesn't re-open the modal
      if (searchParams.toString()) {
        setSearchParams({}, { replace: true });
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- derived data ---------- */

  const now = Date.now();

  const upcomingCount = appointments.filter(
    (a) => a.status === "Scheduled" && slotToDate(a).getTime() >= now
  ).length;
  const completedCount = appointments.filter((a) => a.status === "Completed").length;
  const cancelledCount = appointments.filter((a) => a.status === "Cancelled").length;

  const departments = [
    ...new Set(doctors.map((d) => d.department).filter(Boolean)),
  ].sort();

  const filteredDoctors = form.department
    ? doctors.filter((d) => d.department === form.department)
    : doctors;

  const visibleAppointments = (() => {
    switch (filter) {
      case "Upcoming":
        return appointments.filter(
          (a) => a.status === "Scheduled" && slotToDate(a).getTime() >= now
        );
      case "Completed":
        return appointments.filter((a) => a.status === "Completed");
      case "Cancelled":
        return appointments.filter((a) => a.status === "Cancelled");
      default:
        return appointments;
    }
  })();

  const selectedDoctor = doctors.find((d) => d._id === form.doctor);

  /* ---------- modal handlers ---------- */

  function openBookingModal(doctorId = "") {
    const preselected = doctors.find((d) => d._id === doctorId);

    setForm({
      department: preselected?.department || "",
      doctor: preselected?._id || "",
      date: "",
      time: "",
      reason: "",
    });
    setFormError("");
    setShowBookingModal(true);
  }

  const closeBookingModal = () => {
    if (booking) return;
    setShowBookingModal(false);
    setFormError("");
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormError("");

    setForm((prev) => {
      const next = { ...prev, [name]: value };

      // Changing department resets the doctor selection
      if (name === "department") {
        next.doctor = "";
      }

      return next;
    });
  };

  /* ---------- BOOK APPOINTMENT ---------- */

  const handleBook = async (e) => {
    e.preventDefault();
    setFormError("");

    // ---- client-side validation ----
    if (!form.doctor) return setFormError("Please select a doctor.");
    if (!form.department) return setFormError("Please select a department.");
    if (!form.date) return setFormError("Please choose a date.");
    if (!form.time) return setFormError("Please choose a time slot.");

    if (new Date(`${form.date}T${form.time}:00`).getTime() <= Date.now()) {
      return setFormError("Please choose a future date and time.");
    }

    setBooking(true);
    setError("");
    setSuccess("");

    try {
      const res = await bookAppointment({
        doctor: form.doctor,
        department: form.department,
        date: form.date,
        time: form.time,
        reason: form.reason.trim(),
      });

      // SUCCESS — close modal, show message, refresh the list immediately.
      setShowBookingModal(false);
      setSuccess(
        `✅ ${res.data.message || "Appointment booked successfully"} — ${
          res.data.appointment?.doctor?.name || ""
        } on ${formatDate(form.date)} at ${formatTime(form.time)}.`
      );

      setFilter("All");
      await fetchAppointments(); // newly created appointment appears instantly

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setFormError(getErrorMessage(err, "Failed to book appointment."));
    } finally {
      setBooking(false);
    }
  };

  /* ---------- CANCEL APPOINTMENT ---------- */

  const handleCancel = async (appointmentId) => {
    if (
      !window.confirm("Are you sure you want to cancel this appointment?")
    ) {
      return;
    }

    setCancellingId(appointmentId);
    setError("");
    setSuccess("");

    try {
      const res = await cancelAppointment(appointmentId);
      setSuccess(res.data.message || "Appointment cancelled successfully.");
      await fetchAppointments();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to cancel appointment."));
    } finally {
      setCancellingId(null);
    }
  };

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="page-container">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1>Appointments</h1>
          <p>Book and manage your hospital visits</p>
        </div>

        <button className="primary-btn" onClick={() => openBookingModal()}>
          <CalendarPlus size={17} />
          Book Appointment
        </button>
      </div>

      {/* SUCCESS / ERROR BANNERS */}
      {success && (
        <div className="alert alert-success" role="status">
          <CheckCircle2 size={18} />
          <span>{success}</span>
          <button className="alert-close" onClick={() => setSuccess("")}>
            <X size={15} />
          </button>
        </div>
      )}

      {error && (
        <div className="alert alert-error" role="alert">
          <XCircle size={18} />
          <span>{error}</span>
          <button className="alert-close" onClick={() => setError("")}>
            <X size={15} />
          </button>
        </div>
      )}

      {/* STATS */}
      <div className="stats-grid three">
        <div className="stat-card">
          <div className="stat-icon blue">
            <CalendarDays size={26} />
          </div>
          <div>
            <p>Upcoming</p>
            <h3>{loading ? "…" : upcomingCount}</h3>
            <span>Scheduled visits</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <CheckCircle2 size={26} />
          </div>
          <div>
            <p>Completed</p>
            <h3>{loading ? "…" : completedCount}</h3>
            <span>Finished visits</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <XCircle size={26} />
          </div>
          <div>
            <p>Cancelled</p>
            <h3>{loading ? "…" : cancelledCount}</h3>
            <span>Cancelled visits</span>
          </div>
        </div>
      </div>

      {/* LIST PANEL */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>My Appointments</h2>
            <p>All your appointments in one place</p>
          </div>

          {/* Filter tabs */}
          <div className="filter-tabs">
            {FILTERS.map((f) => (
              <button
                key={f}
                className={`filter-tab ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="spinner" />
            <h3>Loading appointments…</h3>
          </div>
        ) : visibleAppointments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <CalendarDays size={30} />
            </div>
            <h3>
              {filter === "All"
                ? "No appointments yet"
                : `No ${filter.toLowerCase()} appointments`}
            </h3>
            <p>
              {filter === "All"
                ? "Book your first appointment to get started."
                : "Try a different filter to see other appointments."}
            </p>
            {filter === "All" && (
              <button className="primary-btn" onClick={() => openBookingModal()}>
                Book Your First Appointment
              </button>
            )}
          </div>
        ) : (
          <div className="appointments-list">
            {visibleAppointments.map((a) => {
              const isScheduled = a.status === "Scheduled";

              return (
                <div className="appointment-card" key={a._id}>
                  <div className="doctor-avatar">
                    {(a.doctor?.name || "D").replace("Dr. ", "").charAt(0)}
                  </div>

                  <div className="appointment-info">
                    <h3>{a.doctor?.name || "Doctor"}</h3>
                    <p>
                      {a.doctor?.specialization || a.department}
                      {a.doctor?.department ? ` • ${a.doctor.department}` : ""}
                    </p>

                    <div className="appointment-details">
                      <span>
                        <CalendarDays size={14} /> {formatDate(a.date)}
                      </span>
                      <span>
                        <Clock size={14} /> {formatTime(a.time)}
                      </span>
                      {a.doctor?.consultationFee ? (
                        <span>₹{a.doctor.consultationFee}</span>
                      ) : null}
                    </div>

                    {a.reason && (
                      <p className="appointment-reason">
                        <strong>Reason:</strong> {a.reason}
                      </p>
                    )}
                  </div>

                  <div className="appointment-actions">
                    <span className={`status-badge ${a.status.toLowerCase()}`}>
                      {a.status}
                    </span>

                    <button
                      className="ghost-btn"
                      onClick={() => setDetailAppointment(a)}
                    >
                      <Eye size={15} /> Details
                    </button>

                    {isScheduled && (
                      <button
                        className="danger-btn"
                        onClick={() => handleCancel(a._id)}
                        disabled={cancellingId === a._id}
                      >
                        {cancellingId === a._id ? "Cancelling…" : "Cancel"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================
          BOOKING MODAL
      ========================= */}
      {showBookingModal && (
        <div className="modal-overlay" onClick={closeBookingModal}>
          <div
            className="appointment-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>Book Appointment</h2>
                <p>Schedule your visit with a specialist</p>
              </div>
              <button
                className="close-btn"
                onClick={closeBookingModal}
                disabled={booking}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {formError && (
              <div className="alert alert-error compact-alert">
                <XCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleBook}>
              <div className="form-row">
                {/* Department */}
                <div className="form-group">
                  <label htmlFor="department">Department *</label>
                  <select
                    id="department"
                    name="department"
                    value={form.department}
                    onChange={handleFormChange}
                    required
                    disabled={doctorsLoading}
                  >
                    <option value="">
                      {doctorsLoading ? "Loading…" : "Select Department"}
                    </option>
                    {departments.map((dep) => (
                      <option key={dep} value={dep}>
                        {dep}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Doctor */}
                <div className="form-group">
                  <label htmlFor="doctor">Doctor *</label>
                  <select
                    id="doctor"
                    name="doctor"
                    value={form.doctor}
                    onChange={handleFormChange}
                    required
                    disabled={doctorsLoading || !form.department}
                  >
                    <option value="">
                      {!form.department
                        ? "Select department first"
                        : doctorsLoading
                        ? "Loading…"
                        : filteredDoctors.length === 0
                        ? "No doctors in this department"
                        : "Select Doctor"}
                    </option>
                    {filteredDoctors.map((doc) => (
                      <option key={doc._id} value={doc._id}>
                        {doc.name} — {doc.specialization}
                        {doc.available ? "" : " (Unavailable)"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selected doctor summary */}
              {selectedDoctor && (
                <div className="selected-doctor">
                  <Stethoscope size={20} />
                  <div>
                    <strong>{selectedDoctor.name}</strong>
                    <p>
                      {selectedDoctor.specialization} •{" "}
                      {selectedDoctor.experience} yrs exp
                      {selectedDoctor.consultationFee
                        ? ` • ₹${selectedDoctor.consultationFee}`
                        : ""}
                    </p>
                  </div>
                </div>
              )}

              <div className="form-row">
                {/* Date */}
                <div className="form-group">
                  <label htmlFor="date">Date *</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={form.date}
                    onChange={handleFormChange}
                    min={todayStr()}
                    required
                  />
                </div>

                {/* Time */}
                <div className="form-group">
                  <label htmlFor="time">Time Slot *</label>
                  <select
                    id="time"
                    name="time"
                    value={form.time}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select Time</option>
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {formatTime(slot)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reason */}
              <div className="form-group">
                <label htmlFor="reason">Reason for Visit</label>
                <textarea
                  id="reason"
                  name="reason"
                  value={form.reason}
                  onChange={handleFormChange}
                  placeholder="Describe your symptoms or reason for consultation…"
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={closeBookingModal}
                  disabled={booking}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={booking}
                >
                  {booking ? (
                    <>
                      <span className="spinner small light" /> Booking…
                    </>
                  ) : (
                    <>
                      <CalendarPlus size={16} /> Confirm Booking
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================
          DETAILS MODAL
      ========================= */}
      {detailAppointment && (
        <div
          className="modal-overlay"
          onClick={() => setDetailAppointment(null)}
        >
          <div
            className="appointment-modal details-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>Appointment Details</h2>
                <p>Reference #{detailAppointment._id.slice(-8).toUpperCase()}</p>
              </div>
              <button
                className="close-btn"
                onClick={() => setDetailAppointment(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="details-grid">
              <div className="detail-item">
                <span>Doctor</span>
                <strong>{detailAppointment.doctor?.name || "-"}</strong>
              </div>
              <div className="detail-item">
                <span>Specialization</span>
                <strong>
                  {detailAppointment.doctor?.specialization || "-"}
                </strong>
              </div>
              <div className="detail-item">
                <span>Department</span>
                <strong>{detailAppointment.department}</strong>
              </div>
              <div className="detail-item">
                <span>Date</span>
                <strong>{formatDate(detailAppointment.date)}</strong>
              </div>
              <div className="detail-item">
                <span>Time</span>
                <strong>{formatTime(detailAppointment.time)}</strong>
              </div>
              <div className="detail-item">
                <span>Status</span>
                <span
                  className={`status-badge ${detailAppointment.status.toLowerCase()}`}
                >
                  {detailAppointment.status}
                </span>
              </div>
              <div className="detail-item">
                <span>Consultation Fee</span>
                <strong>
                  {detailAppointment.doctor?.consultationFee
                    ? `₹${detailAppointment.doctor.consultationFee}`
                    : "-"}
                </strong>
              </div>
              <div className="detail-item">
                <span>Doctor Contact</span>
                <strong>{detailAppointment.doctor?.phone || "-"}</strong>
              </div>
              <div className="detail-item full">
                <span>Reason for Visit</span>
                <strong>{detailAppointment.reason || "Not specified"}</strong>
              </div>
              <div className="detail-item full">
                <span>Booked On</span>
                <strong>
                  {new Date(detailAppointment.createdAt).toLocaleString(
                    "en-IN",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </strong>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="secondary-btn"
                onClick={() => setDetailAppointment(null)}
              >
                Close
              </button>

              {detailAppointment.status === "Scheduled" && (
                <button
                  className="danger-btn"
                  onClick={() => {
                    const id = detailAppointment._id;
                    setDetailAppointment(null);
                    handleCancel(id);
                  }}
                  disabled={cancellingId === detailAppointment._id}
                >
                  Cancel Appointment
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Appointments;