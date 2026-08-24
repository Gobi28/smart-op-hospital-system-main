import axios from "axios";

/*
 * Central API client.
 * - baseURL points at the Express backend
 * - JWT token is automatically attached to every request
 * - 401 responses clear the session and redirect to /login
 */

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// ---- Request interceptor: attach JWT ----
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ---- Response interceptor: handle expired/invalid sessions ----
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !window.location.pathname.startsWith("/login")
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

// ---- Helper: extract a readable message from any error ----
export const getErrorMessage = (
  error,
  fallback = "Something went wrong. Please try again."
) => {
  if (error?.code === "ERR_NETWORK") {
    return "Cannot reach the server. Make sure the backend is running on port 5000.";
  }

  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
};

/* =========================
   AUTH
========================= */
export const registerUser = (data) => api.post("/auth/register", data);
export const loginUser = (data) => api.post("/auth/login", data);

/* =========================
   USER PROFILE
========================= */
export const getProfile = () => api.get("/users/profile");
export const updateProfile = (data) => api.put("/users/profile", data);

/* =========================
   DOCTORS
========================= */
export const getDoctors = (params) => api.get("/doctors", { params });
export const getDoctorById = (id) => api.get(`/doctors/${id}`);
export const createDoctor = (data) => api.post("/doctors", data);
export const updateDoctor = (id, data) => api.put(`/doctors/${id}`, data);
export const deleteDoctor = (id) => api.delete(`/doctors/${id}`);

/* =========================
   APPOINTMENTS
========================= */
export const bookAppointment = (data) => api.post("/appointments", data);
export const getMyAppointments = () => api.get("/appointments/my");
export const getAppointmentById = (id) => api.get(`/appointments/${id}`);
export const updateAppointmentStatus = (id, status) =>
  api.put(`/appointments/${id}`, { status });
export const cancelAppointment = (id) =>
  api.put(`/appointments/${id}/cancel`);
export const deleteAppointment = (id) => api.delete(`/appointments/${id}`);

export default api;