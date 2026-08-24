const express = require("express");

const { verifyToken } = require("../middleware/authMiddleware");
const {
  getUserProfile,
  updateUserProfile,
} = require("../controllers/userController");

const router = express.Router();

// All profile routes require a valid JWT
router.get("/profile", verifyToken, getUserProfile);
router.put("/profile", verifyToken, updateUserProfile);

module.exports = router;