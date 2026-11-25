import { Routes, Route, Navigate } from 'react-router-dom'

import LandingPage from '../pages/LandingPage'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import ForgotPassword from '../pages/auth/ForgotPassword'
import ResetPassword from '../pages/auth/ResetPassword'
import Dashboard from '../pages/dashboard/Dashboard'
import ProtectedRoute from '../components/layout/ProtectedRoute'

// Admin Portal Pages
import AdminLayout from '../pages/admin/AdminLayout'
import AdminDashboard from '../pages/admin/AdminDashboard'
import AdminVerifications from '../pages/admin/AdminVerifications'
import AdminUsers from '../pages/admin/AdminUsers'
import AdminFood from '../pages/admin/AdminFood'
import AdminDeliveries from '../pages/admin/AdminDeliveries'
import AdminReports from '../pages/admin/AdminReports'

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

// Receiver Dashboard Pages
import ReceiverLayout from '../pages/receiver/ReceiverLayout'
import ReceiverDashboard from '../pages/receiver/ReceiverDashboard'
import BrowseFood from '../pages/receiver/BrowseFood'
import MyRequests from '../pages/receiver/MyRequests'
import ActivePickups from '../pages/receiver/ActivePickups'
import HistoryImpact from '../pages/receiver/HistoryImpact'
import ProfileNeeds from '../pages/receiver/ProfileNeeds'

// Volunteer Portal Pages
import VolunteerLayout from '../pages/volunteer/VolunteerLayout'
import VolunteerDashboard from '../pages/volunteer/VolunteerDashboard'
import VolunteerDeliveries from '../pages/volunteer/VolunteerDeliveries'
import VolunteerHistory from '../pages/volunteer/VolunteerHistory'
import VolunteerImpact from '../pages/volunteer/VolunteerImpact'
import VolunteerProfile from '../pages/volunteer/VolunteerProfile'

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

      {/* Receiver Portal Routes */}
      <Route
        path="/receiver"
        element={
          <ProtectedRoute allowedRoles={['receiver']}>
            <ReceiverLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/receiver/dashboard" replace />} />
        <Route path="dashboard" element={<ReceiverDashboard />} />
        <Route path="browse" element={<BrowseFood />} />
        <Route path="requests" element={<MyRequests />} />
        <Route path="pickups" element={<ActivePickups />} />
        <Route path="history" element={<HistoryImpact />} />
        <Route path="profile" element={<ProfileNeeds />} />
      </Route>

      {/* Volunteer Portal Routes */}
      <Route
        path="/volunteer"
        element={
          <ProtectedRoute allowedRoles={['volunteer']}>
            <VolunteerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/volunteer/dashboard" replace />} />
        <Route path="dashboard" element={<VolunteerDashboard />} />
        <Route path="deliveries" element={<VolunteerDeliveries />} />
        <Route path="history" element={<VolunteerHistory />} />
        <Route path="impact" element={<VolunteerImpact />} />
        <Route path="profile" element={<VolunteerProfile />} />
      </Route>

      {/* Admin Portal Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="verifications" element={<AdminVerifications />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="food" element={<AdminFood />} />
        <Route path="deliveries" element={<AdminDeliveries />} />
        <Route path="reports" element={<AdminReports />} />
      </Route>

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes
