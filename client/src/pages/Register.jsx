import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  UserRound,
  Mail,
  Phone,
  Lock,
  Users,
  UserPlus,
  Eye,
  EyeOff,
} from "lucide-react";

import { registerUser, getErrorMessage } from "../services/api";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "patient",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // ---- client-side validation ----
    if (!formData.name.trim()) return setError("Please enter your full name.");

    if (!/^\S+@\S+\.\S+$/.test(formData.email))
      return setError("Please enter a valid email address.");

    if (!/^[0-9+\-\s]{10,12}$/.test(formData.phone))
      return setError("Please enter a valid phone number.");

    if (formData.password.length < 6)
      return setError("Password must be at least 6 characters.");

    if (formData.password !== formData.confirmPassword)
      return setError("Passwords do not match.");

    setLoading(true);

    try {
      await registerUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: formData.role,
      });

      setSuccess("Account created successfully! Redirecting to login…");

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1500);
    } catch (err) {
      setError(getErrorMessage(err, "Registration failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card wide">
        <div className="auth-logo">🏥</div>

        <h1 className="auth-title">Smart OP</h1>
        <p className="auth-subtitle">Hospital Management System</p>

        <h2 className="auth-heading">Create Account</h2>
        <p className="auth-description">Register to access Smart OP</p>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success" role="status">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <div className="input-icon-wrap">
              <UserRound size={17} />
              <input
                id="name"
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-icon-wrap">
              <Mail size={17} />
              <input
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <div className="input-icon-wrap">
              <Phone size={17} />
              <input
                id="phone"
                type="tel"
                name="phone"
                placeholder="Enter 10-digit phone number"
                value={formData.phone}
                onChange={handleChange}
                maxLength="12"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-icon-wrap">
                <Lock size={17} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-icon-wrap">
                <Lock size={17} />
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="role">Account Type</label>
            <div className="input-icon-wrap">
              <Users size={17} />
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="primary-btn auth-btn"
            disabled={loading || success}
          >
            {loading ? (
              <>
                <span className="spinner small light" /> Creating Account…
              </>
            ) : (
              <>
                <UserPlus size={17} /> Create Account
              </>
            )}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;