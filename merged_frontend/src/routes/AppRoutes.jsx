import { Routes, Route, Navigate } from 'react-router-dom'

import LandingPage from '../pages/LandingPage'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import ForgotPassword from '../pages/auth/ForgotPassword'
import ResetPassword from '../pages/auth/ResetPassword'
import Dashboard from '../pages/dashboard/Dashboard'
import AdminDashboard from '../pages/admin/AdminDashboard'
import ProtectedRoute from '../components/layout/ProtectedRoute'

// Donor Dashboard Pages
import DonorLayout from '../pages/donor/DonorLayout'
import DonorDashboard from '../pages/donor/DonorDashboard'
import AddFood from '../pages/donor/AddFood'
import MyFood from '../pages/donor/MyFood'
import DonationDetail from '../pages/donor/DonationDetail'
import Requests from '../pages/donor/Requests'
import Exchanges from '../pages/donor/Exchanges'
import MyImpact from '../pages/donor/MyImpact'
import DonorProfile from '../pages/donor/DonorProfile'

function AppRoutes() {
  return (
    <Routes>
      {/* Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Authentication */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

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

      {/* General /dashboard route — redirects donor to /donor/dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Donor Portal Routes */}
      <Route
        path="/donor"
        element={
          <ProtectedRoute allowedRoles={['donor']}>
            <DonorLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/donor/dashboard" replace />} />
        <Route path="dashboard" element={<DonorDashboard />} />
        <Route path="add-food" element={<AddFood />} />
        <Route path="my-food" element={<MyFood />} />
        <Route path="food/:id" element={<DonationDetail />} />
        <Route path="requests" element={<Requests />} />
        <Route path="exchanges" element={<Exchanges />} />
        <Route path="impact" element={<MyImpact />} />
        <Route path="profile" element={<DonorProfile />} />
      </Route>

      {/* Admin Dashboard */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes
