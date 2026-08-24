const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Doctor = require("../models/Doctor");

// Fields we safely expose to the client (never the password)
const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  dateOfBirth: user.dateOfBirth,
  gender: user.gender,
  address: user.address,
  emergencyContact: user.emergencyContact,
  createdAt: user.createdAt,
});

// ==========================================
// REGISTER USER
// POST /api/auth/register
// ==========================================
const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // ---- Required fields ----
    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone and password are required",
      });
    }

    // ---- Email format ----
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // ---- Password strength ----
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // ---- Valid role ----
    const validRoles = ["patient", "doctor", "admin"];
    const selectedRole = validRoles.includes(role) ? role : "patient";

    // ---- Duplicate email check ----
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "This email is already registered. Please log in instead.",
      });
    }

    // ---- Hash password ----
    const hashedPassword = await bcrypt.hash(password, 10);

    // ---- Create user ----
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone.trim(),
      role: selectedRole,
    });

    /*
     * If someone registers as a doctor, also create their entry in the
     * Doctor collection so they appear in the Doctors directory.
     * Admins can later update specialization/experience etc.
     */
    if (selectedRole === "doctor") {
      try {
        await Doctor.create({
          name: user.name,
          email: user.email,
          phone: user.phone,
          specialization: "General Physician",
          department: "General Medicine",
          qualification: "",
          experience: 0,
          available: true,
        });
      } catch (doctorErr) {
        // Non-fatal: doctor profile may already exist
        console.error("DOCTOR PROFILE CREATION SKIPPED:", doctorErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Account created successfully. You can now log in.",
      user: publicUser(user),
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "This email is already registered. Please log in instead.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
    });
  }
};

// ==========================================
// LOGIN USER
// POST /api/auth/login
// ==========================================
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user (including password field)
    const user = await User.findOne({ email: String(email).toLowerCase() }).select(
      "+password"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
};

module.exports = { registerUser, loginUser };