const User = require("../models/User");

// ==========================================
// GET CURRENT USER PROFILE
// GET /api/users/profile
// ==========================================
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};

// ==========================================
// UPDATE CURRENT USER PROFILE
// PUT /api/users/profile
// ==========================================
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const allowedFields = [
      "name",
      "phone",
      "dateOfBirth",
      "gender",
      "address",
      "emergencyContact",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        // Empty gender -> remove the value instead of failing enum validation
        if (field === "gender" && req.body[field] === "") {
          user[field] = undefined;
        } else {
          user[field] = req.body[field];
        }
      }
    });

    await user.save(); // runValidators is on by default for save()

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)[0]?.message || "Invalid profile data",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

module.exports = { getUserProfile, updateUserProfile };