const express = require("express");

const { verifyToken, adminOnly } = require("../middleware/authMiddleware");
const {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
} = require("../controllers/doctorController");

const router = express.Router();

// Reads — any authenticated user
router.get("/", verifyToken, getDoctors);        // GET    /api/doctors
router.get("/:id", verifyToken, getDoctorById);  // GET    /api/doctors/:id

// Writes — admins only
router.post("/", verifyToken, adminOnly, createDoctor);     // POST   /api/doctors
router.put("/:id", verifyToken, adminOnly, updateDoctor);   // PUT    /api/doctors/:id
router.delete("/:id", verifyToken, adminOnly, deleteDoctor);// DELETE /api/doctors/:id

module.exports = router;