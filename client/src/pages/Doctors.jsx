import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Stethoscope,
  CalendarPlus,
  BadgeCheck,
  Mail,
  Phone,
} from "lucide-react";

import { getDoctors, getErrorMessage } from "../services/api";

function Doctors() {
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // filters
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [specialization, setSpecialization] = useState("All");

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await getDoctors();
      setDoctors(res.data.doctors || []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load doctors."));
    } finally {
      setLoading(false);
    }
  };

  /* ---------- filter options ---------- */
  const departments = useMemo(
    () =>
      ["All", ...new Set(doctors.map((d) => d.department).filter(Boolean))].sort(),
    [doctors]
  );

  const specializations = useMemo(
    () =>
      [
        "All",
        ...new Set(doctors.map((d) => d.specialization).filter(Boolean)),
      ].sort(),
    [doctors]
  );

  /* ---------- apply filters ---------- */
  const filteredDoctors = doctors.filter((d) => {
    if (department !== "All" && d.department !== department) return false;
    if (specialization !== "All" && d.specialization !== specialization)
      return false;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        d.name?.toLowerCase().includes(q) ||
        d.specialization?.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const handleBook = (doctorId) => {
    navigate(`/appointments?doctor=${doctorId}`);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Doctors</h1>
          <p>Find the right specialist for you</p>
        </div>
        <div className="doctor-count-badge">
          {loading ? "…" : filteredDoctors.length} Doctors
        </div>
      </div>

      {/* TOOLBAR: search + filters */}
      <div className="toolbar panel">
        <div className="search-bar">
          <Search size={17} />
          <input
            type="text"
            placeholder="Search by name or specialization…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          aria-label="Filter by department"
        >
          {departments.map((dep) => (
            <option key={dep} value={dep}>
              {dep === "All" ? "All Departments" : dep}
            </option>
          ))}
        </select>

        <select
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
          aria-label="Filter by specialization"
        >
          {specializations.map((spec) => (
            <option key={spec} value={spec}>
              {spec === "All" ? "All Specializations" : spec}
            </option>
          ))}
        </select>
      </div>

      {/* STATES */}
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
          <button className="alert-retry" onClick={fetchDoctors}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="doctors-grid">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div className="doctor-card skeleton-card" key={n}>
              <div className="skeleton avatar-skeleton" />
              <div className="skeleton line-skeleton" />
              <div className="skeleton line-skeleton short" />
              <div className="skeleton line-skeleton" />
            </div>
          ))}
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="panel empty-state">
          <div className="empty-icon">
            <Stethoscope size={30} />
          </div>
          <h3>No doctors found</h3>
          <p>
            {doctors.length === 0
              ? "There are currently no doctors registered."
              : "Try adjusting your search or filters."}
          </p>
        </div>
      ) : (
        <div className="doctors-grid">
          {filteredDoctors.map((doc) => (
            <div className="doctor-card" key={doc._id}>
              <div className="doctor-card-top">
                {doc.avatar ? (
                  <img
                    className="doctor-avatar-img"
                    src={doc.avatar}
                    alt={doc.name}
                  />
                ) : (
                  <div className="doctor-avatar large">
                    {doc.name.replace("Dr. ", "").charAt(0)}
                  </div>
                )}

                <span
                  className={`availability ${
                    doc.available ? "available" : "unavailable"
                  }`}
                >
                  <span className="availability-dot" />
                  {doc.available ? "Available" : "Unavailable"}
                </span>
              </div>

              <div className="doctor-info">
                <h2>{doc.name}</h2>
                <p className="specialization">
                  <BadgeCheck size={15} /> {doc.specialization}
                </p>

                <div className="doctor-details">
                  <p>
                    <strong>Department:</strong> {doc.department}
                  </p>
                  <p>
                    <strong>Experience:</strong> {doc.experience} years
                  </p>
                  {doc.qualification && (
                    <p>
                      <strong>Qualification:</strong> {doc.qualification}
                    </p>
                  )}
                  {doc.availability?.days?.length > 0 && (
                    <p>
                      <strong>Available:</strong>{" "}
                      {doc.availability.days.join(", ")} ({doc.availability.startTime}
                      –{doc.availability.endTime})
                    </p>
                  )}
                  {doc.email && (
                    <p className="contact-line">
                      <Mail size={13} /> {doc.email}
                    </p>
                  )}
                  {doc.phone && (
                    <p className="contact-line">
                      <Phone size={13} /> {doc.phone}
                    </p>
                  )}
                </div>
              </div>

              <button
                className="primary-btn book-doctor-btn"
                onClick={() => handleBook(doc._id)}
                disabled={!doc.available}
              >
                <CalendarPlus size={16} />
                {doc.available ? "Book Appointment" : "Currently Unavailable"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Doctors;