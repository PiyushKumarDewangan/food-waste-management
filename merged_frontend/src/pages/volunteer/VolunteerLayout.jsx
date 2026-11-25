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
  CheckCheck,
  Loader2,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { volunteerService } from '../../services/volunteerService'
import HelpSupportModal from '../../components/common/HelpSupportModal'
import { getAvatarUrl } from '../../utils/imageHelper'

function formatRelativeTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

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
  const [unreadNotifCount, setUnreadNotifCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [expandedNotifId, setExpandedNotifId] = useState(null)
  const [loadingNotifs, setLoadingNotifs] = useState(false)
  const [notifsError, setNotifsError] = useState('')

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [helpModalOpen, setHelpModalOpen] = useState(false)

  const notificationRef = useRef(null)
  const profileRef = useRef(null)
  const sidebarRef = useRef(null)

  // Fetch volunteer profile and badge counts
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

  // Load unread notification count
  const loadUnreadCount = async () => {
    try {
      const res = await volunteerService.getUnreadNotificationCount()
      setUnreadNotifCount(res.data?.unreadCount ?? 0)
    } catch {
      // Ignore background refresh errors
    }
  }

  const fetchNotifications = async () => {
    try {
      setLoadingNotifs(true)
      setNotifsError('')
      const res = await volunteerService.getNotifications()
      setNotifications(res.data?.notifications || [])
      if (typeof res.data?.unreadCount === 'number') {
        setUnreadNotifCount(res.data.unreadCount)
      }
    } catch (err) {
      setNotifsError('Failed to load notifications.')
    } finally {
      setLoadingNotifs(false)
    }
  }

  const handleToggleNotifications = () => {
    const nextState = !showNotifications
    setShowNotifications(nextState)
    if (nextState) {
      fetchNotifications()
      loadUnreadCount()
    }
  }

  const handleMarkAsRead = async (notif) => {
    setExpandedNotifId((prev) => (prev === notif._id ? null : notif._id))

    if (!notif.isRead) {
      try {
        await volunteerService.markNotificationAsRead(notif._id)
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        )
        setUnreadNotifCount((prev) => Math.max(0, prev - 1))
      } catch (err) {
        console.error('Failed to mark notification as read:', err)
      }
    }
  }

  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation()
    if (unreadNotifCount === 0) return
    try {
      await volunteerService.markAllNotificationsAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadNotifCount(0)
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err)
    }
  }

  useEffect(() => {
    loadData()
    loadUnreadCount()
  }, [location.pathname])

  // Periodic polling every 30 seconds for live updates
  useEffect(() => {
    const timer = setInterval(() => {
      loadData()
      loadUnreadCount()
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
        setHelpModalOpen(false)
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
      navigate('/login')
    }
  }

  // Get Initials for avatar
  const displayName = user?.fullName || 'Volunteer'
  const getInitials = (name) => {
    if (!name) return 'VL'
    const parts = name.trim().split(' ').filter(Boolean)
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
    { label: 'My Profile', path: '/volunteer/profile', icon: User },
  ]

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date())

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-gray-900 flex font-sans">
      {/* Backdrop for Sidebar Drawer (All Screen Sizes) */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
      />

      {/* Collapsible Sidebar Navigation Drawer */}
      <aside
        ref={sidebarRef}
        aria-label="Sidebar navigation"
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-[#E5E7EB] flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5">
          {/* Brand Logo & Close Button */}
          <div className="flex items-center justify-between pb-5 mb-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2E7D32] flex items-center justify-center text-white shadow-xs">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900 tracking-tight leading-none">
                  FoodShare
                </h1>
                <p className="text-[11px] font-medium text-emerald-700 mt-1">Volunteer Dashboard</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              title="Close Menu"
              aria-label="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
              Menu
            </p>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive =
                  location.pathname === item.path ||
                  (item.path === '/volunteer/dashboard' &&
                    (location.pathname === '/volunteer' || location.pathname === '/volunteer/'))

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#2E7D32] text-white shadow-xs font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== null && item.badge !== undefined && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
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
        <div className="p-4 border-t border-gray-100 space-y-1">
          <button
            onClick={() => {
              setSidebarOpen(false)
              handleLogout()
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-gray-500 hover:text-red-600" />
            <span>Log Out</span>
          </button>
          <div className="flex items-center justify-between px-3.5 py-2 text-xs text-gray-400">
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full min-h-screen">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-[#F8FAF7]/95 backdrop-blur-md px-4 sm:px-6 py-3.5 border-b border-[#E5E7EB]/70 flex items-center justify-between gap-4">
          {/* Left: Hamburger Button & Welcome message */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 sm:p-2.5 rounded-xl bg-white text-gray-700 hover:text-gray-900 hover:bg-gray-100/90 border border-gray-200 shadow-2xs transition-all shrink-0 cursor-pointer"
              title="Toggle Menu"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 tracking-tight leading-tight truncate">
                Welcome back, {displayName}
              </h2>
              <p className="text-xs text-gray-500 font-medium hidden sm:block">{todayFormatted}</p>
            </div>
          </div>

          {/* Right: Duty Toggle, Notifications Bell & Profile Dropdown */}
          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
            {/* On-Duty / Off-Duty Toggle */}
            <div className="flex items-center gap-2 sm:gap-2.5 bg-white border border-gray-200 rounded-full px-3 py-1.5 shadow-2xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnDuty ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                }`}
              />
              <span className="text-[11px] font-semibold text-gray-700 hidden sm:inline">
                {isOnDuty ? 'On-Duty — Ready for Deliveries' : 'Off-Duty — Not Available'}
              </span>
              <button
                onClick={handleToggleDuty}
                disabled={dutyLoading}
                aria-label={isOnDuty ? 'Switch to Off-Duty' : 'Switch to On-Duty'}
                title={isOnDuty ? 'Switch to Off-Duty' : 'Switch to On-Duty'}
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
                type="button"
                onClick={handleToggleNotifications}
                className="relative p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 shadow-2xs transition-all cursor-pointer"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] text-[10px] font-extrabold text-white bg-red-500 rounded-full flex items-center justify-center ring-2 ring-white">
                    {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Panel */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-gray-900">Notifications</p>
                      {unreadNotifCount > 0 && (
                        <span className="text-[11px] bg-emerald-100 text-[#2E7D32] font-bold px-2 py-0.5 rounded-full">
                          {unreadNotifCount > 99 ? '99+' : unreadNotifCount} new
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleMarkAllAsRead}
                      disabled={unreadNotifCount === 0}
                      className="text-[11px] font-semibold text-[#2E7D32] hover:text-[#256428] disabled:text-gray-300 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer transition-colors"
                      title="Mark all notifications as read"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all as read
                    </button>
                  </div>

                  {loadingNotifs ? (
                    <div className="py-8 flex flex-col items-center justify-center text-xs text-gray-400 gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-[#2E7D32]" />
                      <span>Loading notifications...</span>
                    </div>
                  ) : notifsError ? (
                    <div className="py-6 text-center text-xs text-red-500 space-y-2">
                      <p>{notifsError}</p>
                      <button
                        onClick={fetchNotifications}
                        className="text-[#2E7D32] font-semibold hover:underline cursor-pointer"
                      >
                        Retry
                      </button>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-500 space-y-1">
                      <Bell className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />
                      <p className="font-semibold text-gray-700">No notifications yet</p>
                      <p className="text-gray-400 text-[11px]">You're all caught up!</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto mt-1 -mx-1 px-1">
                      {notifications.map((notif) => {
                        const isExpanded = expandedNotifId === notif._id
                        return (
                          <div
                            key={notif._id}
                            onClick={() => handleMarkAsRead(notif)}
                            className={`p-2.5 my-1 rounded-xl transition-colors cursor-pointer hover:bg-gray-100/70 flex gap-2.5 items-start ${
                              !notif.isRead ? 'bg-emerald-50/50' : 'bg-transparent'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                !notif.isRead ? 'bg-[#2E7D32]' : 'bg-transparent'
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p
                                  className={`text-xs truncate ${
                                    !notif.isRead
                                      ? 'font-bold text-gray-900'
                                      : 'font-medium text-gray-700'
                                  }`}
                                >
                                  {notif.title}
                                </p>
                                <span className="text-[10px] text-gray-400 shrink-0 font-medium">
                                  {formatRelativeTime(notif.createdAt)}
                                </span>
                              </div>
                              <p
                                className={`text-[11px] text-gray-500 mt-0.5 leading-relaxed ${
                                  isExpanded ? 'whitespace-normal' : 'line-clamp-2'
                                }`}
                              >
                                {notif.message}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Avatar & Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2.5 sm:gap-3 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-white border border-transparent hover:border-gray-200/80 hover:shadow-2xs transition-all cursor-pointer group text-left"
                aria-label="User Profile Menu"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#2E7D32]/15 text-[#2E7D32] font-bold flex items-center justify-center text-xs sm:text-sm border border-[#2E7D32]/25 shrink-0 group-hover:bg-[#2E7D32]/20 transition-colors overflow-hidden">
                  {user?.avatar ? (
                    <img
                      src={getAvatarUrl(user.avatar)}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(displayName)
                  )}
                </div>
                <div className="hidden sm:block min-w-0 leading-tight pr-1">
                  <p className="text-xs sm:text-sm font-bold text-gray-900 truncate group-hover:text-[#2E7D32] transition-colors">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                    Volunteer
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 hidden md:block transition-transform duration-200" />
              </button>

              {/* Profile Dropdown (Screenshot 3 Reference: My Profile, Log Out) */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in duration-150">
                  <div className="px-3 py-2.5 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-900 truncate">{displayName}</p>
                    <p className="text-[11px] text-gray-500 truncate">{user?.email || 'volunteer@foodshare.org'}</p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false)
                        navigate('/volunteer/profile')
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                    >
                      <User className="w-4 h-4 text-gray-500" />
                      <span>My Profile</span>
                    </button>
                  </div>

                  <div className="pt-1 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false)
                        handleLogout()
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Nested Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet context={{ onRefreshCounts: loadData, isOnDuty, profile }} />
        </main>
      </div>

      {/* Help & Support FAQ Modal */}
      <HelpSupportModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        userRole="volunteer"
      />
    </div>
  )
}
