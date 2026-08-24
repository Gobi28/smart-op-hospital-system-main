const mongoose = require("mongoose");

const APPOINTMENT_STATUSES = ["Scheduled", "Completed", "Cancelled"];

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Patient is required"],
      index: true,
    },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: [true, "Doctor is required"],
      index: true,
    },

    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
    },

    // Stored as "YYYY-MM-DD" (avoids timezone issues)
    date: {
      type: String,
      required: [true, "Appointment date is required"],
    },

    // Stored as "HH:mm" 24-hour format e.g. "14:30"
    time: {
      type: String,
      required: [true, "Appointment time is required"],
    },

    reason: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: {
        values: APPOINTMENT_STATUSES,
        message: "Status must be Scheduled, Completed or Cancelled",
      },
      default: "Scheduled",
      index: true,
    },
  },
  {
    timestamps: true, // provides createdAt / updatedAt
  }
);

/*
 * Prevent double-booking of the same doctor + date + time slot.
 * Only applies to active (Scheduled) appointments, so cancelled/completed
 * slots can be re-booked.
 */
appointmentSchema.index(
  { doctor: 1, date: 1, time: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "Scheduled" },
    name: "unique_scheduled_doctor_slot",
  }
);

appointmentSchema.statics.STATUSES = APPOINTMENT_STATUSES;

module.exports = mongoose.model("Appointment", appointmentSchema);