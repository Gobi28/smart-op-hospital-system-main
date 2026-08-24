import { useEffect, useState } from "react";
import {
  UserRound,
  Mail,
  Phone,
  Save,
  ShieldCheck,
} from "lucide-react";

import {
  getProfile,
  updateProfile,
  getErrorMessage,
} from "../services/api";

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  gender: "",
  address: "",
  emergencyContact: "",
};

function Profile() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [role, setRole] = useState("patient");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await getProfile();
      const u = res.data.user;

      setRole(u.role || "patient");

      setForm({
        name: u.name || "",
        email: u.email || "",
        phone: u.phone || "",
        dateOfBirth: u.dateOfBirth
          ? new Date(u.dateOfBirth).toISOString().slice(0, 10)
          : "",
        gender: u.gender || "",
        address: u.address || "",
        emergencyContact: u.emergencyContact || "",
      });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load your profile."));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // ---- client-side validation ----
    if (!form.name.trim()) return setError("Name is required.");
    if (!/^\S+@\S+\.\S+$/.test(form.email))
      return setError("Please provide a valid email address.");
    if (!form.phone.trim()) return setError("Phone number is required.");

    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        address: form.address.trim(),
        emergencyContact: form.emergencyContact.trim(),
      };

      const res = await updateProfile(payload);

      setSuccess(res.data.message || "Profile updated successfully.");

      // keep navbar/sidebar name in sync
      localStorage.setItem("user", JSON.stringify(res.data.user));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update profile."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>My Profile</h1>
            <p>Your personal information</p>
          </div>
        </div>

        <div className="panel empty-state">
          <div className="spinner" />
          <h3>Loading profile…</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>My Profile</h1>
          <p>View and update your personal information</p>
        </div>

        <span className="role-chip">
          <ShieldCheck size={15} /> {role}
        </span>
      </div>

      {success && (
        <div className="alert alert-success" role="status">
          {success}
        </div>
      )}

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      <div className="profile-layout">
        {/* SUMMARY CARD */}
        <div className="panel profile-summary">
          <div className="doctor-avatar large">
            {(form.name || "U").charAt(0).toUpperCase()}
          </div>
          <h2>{form.name || "User"}</h2>
          <p className="muted">{role}</p>

          <div className="summary-lines">
            <p>
              <Mail size={14} /> {form.email || "-"}
            </p>
            <p>
              <Phone size={14} /> {form.phone || "-"}
            </p>
            <p>
              <UserRound size={14} />{" "}
              {form.gender || "Gender not set"}
            </p>
          </div>
        </div>

        {/* EDIT FORM */}
        <form className="panel profile-form" onSubmit={handleSubmit}>
          <div className="panel-header">
            <div>
              <h2>Personal Information</h2>
              <p>Keep your details up to date</p>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email (read-only)</label>
              <input id="email" type="email" value={form.email} disabled />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                maxLength="12"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="dateOfBirth">Date of Birth</label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                name="gender"
                value={form.gender}
                onChange={handleChange}
              >
                <option value="">Not specified</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="emergencyContact">Emergency Contact</label>
              <input
                id="emergencyContact"
                name="emergencyContact"
                type="tel"
                placeholder="Name & phone number"
                value={form.emergencyContact}
                onChange={handleChange}
                maxLength="40"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <textarea
              id="address"
              name="address"
              rows="3"
              placeholder="House no, street, city, state, pincode"
              value={form.address}
              onChange={handleChange}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={loadProfile}
              disabled={saving}
            >
              Reset
            </button>

            <button type="submit" className="primary-btn" disabled={saving}>
              <Save size={16} />
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Profile;