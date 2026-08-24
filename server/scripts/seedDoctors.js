/**
 * Seeds the Doctor collection with sample hospital doctors.
 * Safe to run multiple times — it upserts by email.
 *
 * Run with:  npm run seed   (from inside the server/ folder)
 */

require("dotenv").config();

const mongoose = require("mongoose");
const Doctor = require("../models/Doctor");

const doctors = [
  {
    name: "Dr. Ananya Sharma",
    email: "ananya.sharma@smartop.com",
    phone: "+91 98765 43210",
    specialization: "Cardiologist",
    department: "Cardiology",
    experience: 12,
    qualification: "MBBS, MD, DM (Cardiology)",
    available: true,
    consultationFee: 800,
    avatar: "",
    availability: {
      days: ["Monday", "Wednesday", "Friday"],
      startTime: "09:00",
      endTime: "13:00",
    },
  },
  {
    name: "Dr. Rajesh Kumar",
    email: "rajesh.kumar@smartop.com",
    phone: "+91 98765 43211",
    specialization: "Orthopedic Surgeon",
    department: "Orthopedics",
    experience: 15,
    qualification: "MBBS, MS (Orthopedics)",
    available: true,
    consultationFee: 700,
    availability: {
      days: ["Tuesday", "Thursday", "Saturday"],
      startTime: "10:00",
      endTime: "16:00",
    },
  },
  {
    name: "Dr. Priya Nair",
    email: "priya.nair@smartop.com",
    phone: "+91 98765 43212",
    specialization: "Dermatologist",
    department: "Dermatology",
    experience: 8,
    qualification: "MBBS, MD (Dermatology)",
    available: true,
    consultationFee: 600,
    availability: {
      days: ["Monday", "Tuesday", "Thursday"],
      startTime: "11:00",
      endTime: "17:00",
    },
  },
  {
    name: "Dr. Amit Verma",
    email: "amit.verma@smartop.com",
    phone: "+91 98765 43213",
    specialization: "Neurologist",
    department: "Neurology",
    experience: 14,
    qualification: "MBBS, MD, DM (Neurology)",
    available: true,
    consultationFee: 1000,
    availability: {
      days: ["Monday", "Wednesday", "Friday"],
      startTime: "10:00",
      endTime: "14:00",
    },
  },
  {
    name: "Dr. Sneha Patel",
    email: "sneha.patel@smartop.com",
    phone: "+91 98765 43214",
    specialization: "Pediatrician",
    department: "Pediatrics",
    experience: 10,
    qualification: "MBBS, MD (Pediatrics)",
    available: true,
    consultationFee: 500,
    availability: {
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      startTime: "09:00",
      endTime: "15:00",
    },
  },
  {
    name: "Dr. Vikram Singh",
    email: "vikram.singh@smartop.com",
    phone: "+91 98765 43215",
    specialization: "General Physician",
    department: "General Medicine",
    experience: 9,
    qualification: "MBBS, MD (General Medicine)",
    available: true,
    consultationFee: 400,
    availability: {
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      startTime: "09:00",
      endTime: "17:00",
    },
  },
  {
    name: "Dr. Meera Iyer",
    email: "meera.iyer@smartop.com",
    phone: "+91 98765 43216",
    specialization: "Gynecologist",
    department: "Gynecology",
    experience: 13,
    qualification: "MBBS, MS (OB-GYN)",
    available: true,
    consultationFee: 750,
    availability: {
      days: ["Tuesday", "Thursday", "Saturday"],
      startTime: "09:30",
      endTime: "14:30",
    },
  },
  {
    name: "Dr. Arjun Mehta",
    email: "arjun.mehta@smartop.com",
    phone: "+91 98765 43217",
    specialization: "ENT Specialist",
    department: "ENT",
    experience: 7,
    qualification: "MBBS, MS (ENT)",
    available: false,
    consultationFee: 550,
    availability: {
      days: ["Wednesday", "Friday"],
      startTime: "12:00",
      endTime: "18:00",
    },
  },
];

const seed = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI missing in server/.env");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    let inserted = 0;
    let updated = 0;

    for (const doc of doctors) {
      const result = await Doctor.findOneAndUpdate(
        { email: doc.email },
        { $set: doc },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      if (result.createdAt && result.createdAt.getTime() === result.updatedAt.getTime()) {
        inserted += 1;
      } else {
        updated += 1;
      }
    }

    console.log(`🌱 Seed complete — ${inserted} created, ${updated} existing updated.`);
    console.log(`👥 Total doctors in DB: ${await Doctor.countDocuments()}`);

    await mongoose.disconnect();
    console.log("👋 Disconnected. Done.");
    process.exit(0);
  } catch (error) {
    console.error("❌ SEED ERROR:", error.message);
    process.exit(1);
  }
};

seed();