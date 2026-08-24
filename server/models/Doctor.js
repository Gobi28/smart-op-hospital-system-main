const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Doctor name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Doctor email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    specialization: {
      type: String,
      required: [true, "Specialization is required"],
      trim: true,
    },

    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
    },

    experience: {
      type: Number,
      default: 0,
      min: 0,
    },

    qualification: {
      type: String,
      trim: true,
      default: "",
    },

    // Quick on/off toggle shown as Available/Unavailable dot
    available: {
      type: Boolean,
      default: true,
    },

    // Weekly availability schedule
    availability: {
      days: {
        type: [String],
        default: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
        ],
      },
      startTime: {
        type: String,
        default: "09:00",
      },
      endTime: {
        type: String,
        default: "17:00",
      },
    },

    consultationFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Optional profile image URL. UI falls back to initials/avatar icon.
    avatar: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Doctor", doctorSchema);