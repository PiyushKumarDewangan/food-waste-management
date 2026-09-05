import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import LoadingSpinner from '../ui/LoadingSpinner.jsx'

/**
 * Wraps a route element that requires an authenticated user.
 * While AuthContext is still attempting its one-time silent session
 * restore (isLoading), we show a spinner instead of bouncing to /login —
 * otherwise a real refresh-cookie session would flash a redirect on every
 * page load before the token check finishes.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/login" replace />
  }

  return children
}
