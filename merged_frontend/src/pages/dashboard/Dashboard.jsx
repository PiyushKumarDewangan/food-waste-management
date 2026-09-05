import { useNavigate } from 'react-router-dom'
import { Leaf, LogOut } from 'lucide-react'
import Button from '../../components/ui/Button.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

// Minimal placeholder dashboard so "Go to dashboard" has somewhere to land.
// Replace with the real dashboard once it's designed.
export default function Dashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-5">
        <Leaf className="w-6 h-6 text-primary" />
      </span>
      <h1 className="text-2xl font-bold text-ink">Welcome{user?.fullName ? `, ${user.fullName}` : ''}!</h1>
      <p className="text-sm text-gray-500 mt-2 max-w-sm">
        Your dashboard is coming soon. This is a placeholder landing page for authenticated users.
      </p>
      <Button variant="outline" icon={LogOut} iconPosition="left" className="mt-6" onClick={handleLogout}>
        Log out
      </Button>
    </div>
  )
}
