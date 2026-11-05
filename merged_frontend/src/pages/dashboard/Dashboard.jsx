import { useNavigate, Navigate } from 'react-router-dom'
import { Leaf, LogOut } from 'lucide-react'
import Button from '../../components/ui/Button.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  // Seamlessly route donors to their complete Donor Dashboard
  if (user?.role === 'donor') {
    return <Navigate to="/donor/dashboard" replace />
  }

  // Seamlessly route receivers to their complete Receiver Dashboard
  if (user?.role === 'receiver') {
    return <Navigate to="/receiver/dashboard" replace />
  }

  // Seamlessly route volunteers to their Volunteer Dashboard
  if (user?.role === 'volunteer') {
    return <Navigate to="/volunteer" replace />
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-5">
        <Leaf className="w-6 h-6 text-primary" />
      </span>
      <h1 className="text-2xl font-bold text-ink">
        Welcome{user?.fullName ? `, ${user.fullName}` : ''}!
      </h1>
      <p className="text-sm text-gray-500 mt-2 max-w-sm">
        {user?.role === 'receiver' && 'Receiver portal is in preparation.'}
        {user?.role === 'volunteer' && 'Volunteer portal is in preparation.'}
        {!user?.role && 'Your dashboard is coming soon.'}
      </p>
      <Button variant="outline" icon={LogOut} iconPosition="left" className="mt-6" onClick={handleLogout}>
        Log out
      </Button>
    </div>
  )
}
