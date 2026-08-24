import { Navigate, Outlet, useLocation } from "react-router-dom";

/*
 * Guards all private routes.
 * If no JWT exists in localStorage the user is redirected to /login,
 * preserving the page they tried to visit so we can send them back after login.
 * Refreshing a protected page keeps working because the token persists
 * in localStorage and every API call re-attaches it via the axios interceptor.
 */
function ProtectedRoute() {
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export default ProtectedRoute;