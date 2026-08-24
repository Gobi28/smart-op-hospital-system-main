const express = require("express");

const { verifyToken } = require("../middleware/authMiddleware");
const {
  createAppointment,
  getMyAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  cancelAppointment,
  deleteAppointment,
} = require("../controllers/appointmentController");

const router = express.Router();

// All appointment routes require a valid JWT
router.post("/", verifyToken, createAppointment);          // POST   /api/appointments
router.get("/my", verifyToken, getMyAppointments);         // GET    /api/appointments/my
router.get("/:id", verifyToken, getAppointmentById);       // GET    /api/appointments/:id
router.put("/:id/cancel", verifyToken, cancelAppointment); // PUT    /api/appointments/:id/cancel
router.put("/:id", verifyToken, updateAppointmentStatus);  // PUT    /api/appointments/:id
router.delete("/:id", verifyToken, deleteAppointment);     // DELETE /api/appointments/:id

module.exports = router;