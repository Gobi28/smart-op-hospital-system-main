require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/database");

const authRoutes = require("./routes/authRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const userRoutes = require("./routes/userRoutes");

// Connect to MongoDB Atlas
connectDB();

const app = express();

// ================================
// MIDDLEWARE
// ================================

app.use(cors());
app.use(express.json());

// ================================
// ROUTES
// ================================

// Health check / API root
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🚀 Smart OP Registration API is running",
  });
});

app.use("/api/auth", authRoutes);              // /api/auth/register, /api/auth/login
app.use("/api/appointments", appointmentRoutes); // /api/appointments...
app.use("/api/doctors", doctorRoutes);         // /api/doctors...
app.use("/api/users", userRoutes);             // /api/users/profile

// ================================
// 404 HANDLER
// ================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ================================
// GLOBAL ERROR HANDLER
// ================================

app.use((err, req, res, next) => {
  console.error("UNHANDLED ERROR:", err.message);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// ================================
// START SERVER
// ================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});