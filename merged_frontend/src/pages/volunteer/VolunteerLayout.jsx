import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Truck,
  FileText,
  TrendingUp,
  User,
  LogOut,
  Bell,
  Menu,
  X,
  ChevronDown,
  Leaf,
  HelpCircle,
  CheckCircle,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { volunteerService } from '../../services/volunteerService'
import HelpSupportModal from '../../components/common/HelpSupportModal'
import { getAvatarUrl } from '../../utils/imageHelper'

export default function VolunteerLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeDeliveriesCount, setActiveDeliveriesCount] = useState(0)
  const [profile, setProfile] = useState(null)
  const [isOnDuty, setIsOnDuty] = useState(true)
  const [dutyLoading, setDutyLoading] = useState(false)

  const [showNotifications, setShowNotifications] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [helpModalOpen, setHelpModalOpen] = useState(false)

  const notificationRef = useRef(null)
  const profileRef = useRef(null)

  // Fetch volunteer profile and badge count
  const loadData = async () => {
    try {
      const [profileRes, delivRes] = await Promise.all([
        volunteerService.getProfile().catch(() => null),
        volunteerService.getMyDeliveries('active').catch(() => null),
      ])

      if (profileRes?.data?.profile) {
        setProfile(profileRes.data.profile)
        setIsOnDuty(profileRes.data.profile.isOnDuty !== false)
      }

      if (delivRes?.data?.counts) {
        setActiveDeliveriesCount(delivRes.data.counts.active || 0)
      } else if (delivRes?.data?.deliveries) {
        setActiveDeliveriesCount(delivRes.data.deliveries.length)
      }
    } catch (err) {
      console.error('Failed to load volunteer layout data:', err)
    }
  }

  useEffect(() => {
    loadData()
  }, [location.pathname])

  // Periodic polling every 30 seconds for live badge updates
  useEffect(() => {
    const timer = setInterval(() => {
      loadData()
    }, 30000)
    return () => clearInterval(timer)
  }, [])

  // Close dropdowns on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileDropdownOpen(false)
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowNotifications(false)
        setProfileDropdownOpen(false)
        setSidebarOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Automatically close sidebar and popups on route change
  useEffect(() => {
    setSidebarOpen(false)
    setShowNotifications(false)
    setProfileDropdownOpen(false)
  }, [location.pathname])

  // Toggle On-Duty status
  const handleToggleDuty = async () => {
    const nextState = !isOnDuty
    try {
      setDutyLoading(true)
      setIsOnDuty(nextState)
      await volunteerService.updateProfile({ isOnDuty: nextState })
    } catch (err) {
      setIsOnDuty(!nextState)
      console.error('Failed to update duty status:', err)
    } finally {
      setDutyLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  // Get Initials for avatar
  const getInitials = (name) => {
    if (!name) return 'VD'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  const navItems = [
    { label: 'Dashboard', path: '/volunteer/dashboard', icon: LayoutDashboard },
    {
      label: 'My Deliveries',
      path: '/volunteer/deliveries',
      icon: Truck,
      badge: activeDeliveriesCount > 0 ? activeDeliveriesCount : null,
    },
    { label: 'Delivery History', path: '/volunteer/history', icon: FileText },
    { label: 'My Impact', path: '/volunteer/impact', icon: TrendingUp },
    { label: 'Profile & Vehicle', path: '/volunteer/profile', icon: User },
  ]

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date())

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 flex font-sans">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          {/* Brand Logo */}
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2E7D32] flex items-center justify-center text-white shadow-xs">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-gray-900 leading-tight">FoodShare</h1>
                <p className="text-[11px] font-semibold text-emerald-700">Volunteer Dashboard</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 mb-2">
              Menu
            </p>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive =
                  location.pathname === item.path ||
                  (item.path === '/volunteer/dashboard' && location.pathname === '/volunteer')

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#2E7D32] text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== null && item.badge !== undefined && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-[#2E7D32]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-gray-500" />
            <span>Log Out</span>
          </button>
          <div className="flex items-center justify-between px-3.5 pt-3 mt-1 text-xs text-gray-400">
            <span>FoodShare v1.0</span>
            <button
              onClick={() => {
                setSidebarOpen(false)
                setHelpModalOpen(true)
              }}
              className="hover:text-emerald-700 cursor-pointer p-1 rounded-lg hover:bg-gray-100 transition-colors"
              title="Help & Support"
              aria-label="Help & Support"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto w-full">
            {/* Left: Mobile menu button & Welcome message */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 -ml-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                  Welcome back, {user?.fullName || 'Volunteer'}
                </h2>
                <p className="text-xs text-gray-500">{todayFormatted}</p>
              </div>
            </div>

            {/* Right: Duty toggle, Notifications & Profile Avatar */}
            <div className="flex items-center gap-3 sm:gap-5">
              {/* On-Duty Toggle */}
              <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-200/80 rounded-full px-3 py-1.5 shadow-2xs">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOnDuty ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                  }`}
                />
                <span className="text-[11px] font-semibold text-gray-700 hidden sm:inline">
                  {isOnDuty ? 'On-Duty — Ready for Deliveries' : 'Off-Duty · Paused'}
                </span>
                <button
                  onClick={handleToggleDuty}
                  disabled={dutyLoading}
                  className={`w-8 h-4 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                    isOnDuty ? 'bg-[#2E7D32]' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${
                      isOnDuty ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Notification Bell */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors relative cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {activeDeliveriesCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500" />
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                      <span className="font-bold text-gray-900">Notifications</span>
                      <span className="text-[10px] text-emerald-700 font-semibold">Active Run</span>
                    </div>
                    {activeDeliveriesCount > 0 ? (
                      <div className="py-2 space-y-2">
                        <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] font-medium flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" />
                          <span>You have {activeDeliveriesCount} active delivery run currently in progress.</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 py-3 text-center">No new notifications.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Profile Avatar & Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-[#2E7D32] text-white flex items-center justify-center font-bold text-xs shadow-xs overflow-hidden">
                    {user?.avatar ? (
                      <img
                        src={getAvatarUrl(user.avatar)}
                        alt={user?.fullName || 'Volunteer'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getInitials(user?.fullName)
                    )}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-xs font-bold text-gray-900 leading-tight">
                      {user?.fullName || 'Volunteer'}
                    </div>
                    <div className="text-[10px] font-medium text-gray-500">
                      {user?.city || 'Volunteer'}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-2 border-b border-gray-100 mb-1">
                      <div className="font-bold text-gray-900 truncate">{user?.fullName}</div>
                      <div className="text-[10px] text-gray-500 truncate">{user?.email}</div>
                    </div>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false)
                        navigate('/volunteer/profile')
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-gray-700 hover:bg-gray-50 font-medium cursor-pointer"
                    >
                      Profile & Vehicle
                    </button>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false)
                        navigate('/volunteer/deliveries')
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-gray-700 hover:bg-gray-50 font-medium cursor-pointer"
                    >
                      My Deliveries
                    </button>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 font-semibold cursor-pointer"
                    >
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Nested Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet context={{ onRefreshCounts: loadData, isOnDuty, profile }} />
        </main>
      </div>

      {/* Floating Help Circle Button (Bottom Right) */}
      <button
        onClick={() => setHelpModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-10 h-10 rounded-full bg-[#2E7D32] hover:bg-[#256828] text-white flex items-center justify-center shadow-lg transition-all hover:scale-105 cursor-pointer"
        title="Volunteer Support & Help"
      >
        <HelpCircle className="w-5 h-5" />
      </button>

      {/* Help & Support FAQ Modal */}
      <HelpSupportModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        userRole="volunteer"
      />
    </div>
  )
}
