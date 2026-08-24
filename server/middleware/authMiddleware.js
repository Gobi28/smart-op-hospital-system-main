const jwt = require("jsonwebtoken");

/**
 * Verifies the "Authorization: Bearer <token>" header,
 * decodes the JWT and attaches { id, email, role } to req.user.
 */
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided. Authorization denied.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // { id, email, role }

    return next();
  } catch (error) {
    const message =
      error.name === "TokenExpiredError"
        ? "Your session has expired. Please log in again."
        : "Invalid token. Authorization denied.";

    return res.status(401).json({
      success: false,
      message,
    });
  }
};

/**
 * Role guard — must be used AFTER verifyToken.
 * Allows only admin users through.
 */
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    });
  }
  return next();
};

module.exports = { verifyToken, adminOnly };