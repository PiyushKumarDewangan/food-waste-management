import { Routes, Route, Navigate } from "react-router-dom";

import LandingPage from "../pages/LandingPage";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import Dashboard from "../pages/dashboard/Dashboard";
import AdminDashboard from "../pages/admin/AdminDashboard";
import ProtectedRoute from "../components/layout/ProtectedRoute";

function AppRoutes() {
  return (
    <Routes>
      {/* Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Authentication */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Registration Flow */}
      <Route path="/register/account" element={<Register />} />
      <Route path="/register/role" element={<Register />} />
      <Route path="/register/details" element={<Register />} />
      <Route path="/register/complete" element={<Register />} />

      {/* Redirect /register to first registration step */}
      <Route
        path="/register"
        element={<Navigate to="/register/account" replace />}
      />

      {/* Requires a valid session (real access token, restored via the
          httpOnly refresh cookie on load if needed) — see AuthContext.jsx */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Admin dashboard: not linked anywhere in the public UI (admin isn't
          exposed via registration) — reached only by a logged-in admin
          navigating to /admin directly. Role-gated by ProtectedRoute. */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
