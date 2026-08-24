import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  CalendarCheck,
  CalendarX,
  Stethoscope,
  ArrowRight,
  UserRound,
  Clock,
  MapPin,
} from "lucide-react";

import {
  getProfile,
  getMyAppointments,
  getDoctors,
  getErrorMessage,
} from "../services/api";

/* ---------- date/time helpers ---------- */
const slotToDate = (a) => new Date(`${a.date}T${a.time || "00:00"}:00`);

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (timeStr) => {
  if (!timeStr) return "-";
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
};

function Dashboard() {
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [doctorCount, setDoctorCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Profile comes from localStorage instantly, then refreshed from API
      try {
        setUser(JSON.parse(localStorage.getItem("user")));
      } catch {
        setUser(null);
      }

      const [profileRes, apptRes, docRes] = await Promise.allSettled([
        getProfile(),
        getMyAppointments(),
        getDoctors(),
      ]);

      if (profileRes.status === "fulfilled") {
        setUser(profileRes.value.data.user);
        localStorage.setItem(
          "user",
          JSON.stringify(profileRes.value.data.user)
        );
      }

      if (apptRes.status === "fulfilled") {
        setAppointments(apptRes.value.data.appointments || []);
      } else {
        throw new Error(getErrorMessage(apptRes.reason));
      }

      if (docRes.status === "fulfilled") {
        setDoctorCount(docRes.value.data.count ?? docRes.value.data.doctors?.length ?? 0);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ---------- derived data ---------- */
  const now = Date.now();

  const upcoming = appointments.filter(
    (a) =>
      a.status === "Scheduled" && slotToDate(a).getTime() >= now
  );

  const completed = appointments.filter((a) => a.status === "Completed");
  const cancelled = appointments.filter((a) => a.status === "Cancelled");

  const nextAppointment = [...upcoming].sort(
    (a, b) => slotToDate(a) - slotToDate(b)
  )[0];

  const recentAppointments = [...appointments]
    .sort((a, b) => slotToDate(b) - slotToDate(a))
    .slice(0, 5);

  const firstName = (user?.name || "there").split(" ")[0];

  return (
    <>
      {/* WELCOME BANNER */}
      <section className="welcome-banner">
        <div>
          <h2>Hello, {firstName} 👋</h2>
          <p>
            Manage your appointments, find doctors and keep your profile up to
            date — all from one place.
          </p>
        </div>
        <div className="welcome-icon">🏥</div>
      </section>

      {error && (
        <div className="alert alert-error">
          {error}
          <button className="alert-retry" onClick={loadData}>
            Retry
          </button>
        </div>
      )}

      {/* STAT CARDS */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <CalendarDays size={26} />
          </div>
          <div>
            <p>Upcoming</p>
            <h3>{loading ? "…" : upcoming.length}</h3>
            <span>Scheduled appointments</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <CalendarCheck size={26} />
          </div>
          <div>
            <p>Completed</p>
            <h3>{loading ? "…" : completed.length}</h3>
            <span>Finished visits</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <CalendarX size={26} />
          </div>
          <div>
            <p>Cancelled</p>
            <h3>{loading ? "…" : cancelled.length}</h3>
            <span>Cancelled visits</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pink">
            <Stethoscope size={26} />
          </div>
          <div>
            <p>Doctors</p>
            <h3>{loading ? "…" : doctorCount}</h3>
            <span>Available specialists</span>
          </div>
        </div>
      </section>

      {/* LOWER CONTENT */}
      <section className="dashboard-grid">
        <div className="panel quick-panel">
          <div className="panel-header">
            <div>
              <h2>Quick Actions</h2>
              <p>Frequently used services</p>
            </div>
          </div>

          <div className="actions-grid">
            <Link to="/appointments?book=true" className="action-card">
              <div className="action-icon">
                <CalendarDays size={22} />
              </div>
              <div>
                <h3>Book Appointment</h3>
                <p>Schedule a doctor visit</p>
              </div>
              <ArrowRight className="arrow" size={18} />
            </Link>

            <Link to="/doctors" className="action-card">
              <div className="action-icon">
                <Stethoscope size={22} />
              </div>
              <div>
                <h3>Find Doctor</h3>
                <p>Browse available doctors</p>
              </div>
              <ArrowRight className="arrow" size={18} />
            </Link>

            <Link to="/profile" className="action-card">
              <div className="action-icon">
                <UserRound size={22} />
              </div>
              <div>
                <h3>My Profile</h3>
                <p>Update your information</p>
              </div>
              <ArrowRight className="arrow" size={18} />
            </Link>

            <Link to="/appointments" className="action-card">
              <div className="action-icon">
                <Clock size={22} />
              </div>
              <div>
                <h3>Appointment History</h3>
                <p>View past & upcoming visits</p>
              </div>
              <ArrowRight className="arrow" size={18} />
            </Link>
          </div>
        </div>

        {/* NEXT APPOINTMENT */}
        <div className="panel appointment-panel">
          <div className="panel-header">
            <div>
              <h2>Next Appointment</h2>
              <p>Your upcoming visit</p>
            </div>
            <Link to="/appointments" className="view-all">
              View All
            </Link>
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="spinner" />
              <h3>Loading…</h3>
            </div>
          ) : nextAppointment ? (
            <div className="next-appointment-card">
              <div className="next-appt-top">
                <div className="doctor-avatar small">
                  {(nextAppointment.doctor?.name || "D").replace("Dr. ", "").charAt(0)}
                </div>
                <div>
                  <h3>{nextAppointment.doctor?.name || "Doctor"}</h3>
                  <p>
                    {nextAppointment.doctor?.specialization ||
                      nextAppointment.department}
                  </p>
                </div>
                <span className="status-badge scheduled">Scheduled</span>
              </div>

              <div className="next-appt-details">
                <span>
                  <CalendarDays size={16} /> {formatDate(nextAppointment.date)}
                </span>
                <span>
                  <Clock size={16} /> {formatTime(nextAppointment.time)}
                </span>
                <span>
                  <MapPin size={16} /> {nextAppointment.department}
                </span>
              </div>

              {nextAppointment.reason && (
                <p className="next-appt-reason">
                  <strong>Reason:</strong> {nextAppointment.reason}
                </p>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <CalendarDays size={30} />
              </div>
              <h3>No upcoming appointments</h3>
              <p>You don't have any appointments scheduled.</p>
              <Link to="/appointments?book=true" className="primary-btn">
                Book Appointment
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* RECENT APPOINTMENTS */}
      <section className="panel recent-panel">
        <div className="panel-header">
          <div>
            <h2>Recent Appointments</h2>
            <p>Your latest activity</p>
          </div>
          <Link to="/appointments" className="view-all">
            View All
          </Link>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="spinner" />
            <h3>Loading appointments…</h3>
          </div>
        ) : recentAppointments.length === 0 ? (
          <div className="empty-state compact">
            <div className="empty-icon">
              <CalendarDays size={28} />
            </div>
            <h3>No appointments yet</h3>
            <p>Book your first appointment to see it here.</p>
            <Link to="/appointments?book=true" className="primary-btn">
              Book Appointment
            </Link>
          </div>
        ) : (
          <div className="appointments-list">
            {recentAppointments.map((a) => (
              <div className="appointment-card" key={a._id}>
                <div className="doctor-avatar small">
                  {(a.doctor?.name || "D").replace("Dr. ", "").charAt(0)}
                </div>

                <div className="appointment-info">
                  <h3>{a.doctor?.name || "Doctor"}</h3>
                  <p>{a.doctor?.specialization || a.department}</p>
                  <div className="appointment-details">
                    <span>
                      <CalendarDays size={14} /> {formatDate(a.date)}
                    </span>
                    <span>
                      <Clock size={14} /> {formatTime(a.time)}
                    </span>
                  </div>
                </div>

                <span className={`status-badge ${a.status.toLowerCase()}`}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="dashboard-footer">
        © 2026 Smart OP Hospital Management System
      </footer>
    </>
  );
}

export default Dashboard;
