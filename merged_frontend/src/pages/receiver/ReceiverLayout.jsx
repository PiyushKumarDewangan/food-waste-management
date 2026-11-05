import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Leaf,
  LogOut,
  HelpCircle,
  Bell,
  Menu,
  X,
  ChevronDown,
  ExternalLink,
  CheckCircle,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import receiverService from '../../services/receiverService'
import { navigationConfig } from '../../config/navigationConfig'
import HelpSupportModal from '../../components/common/HelpSupportModal'
import { getAvatarUrl } from '../../utils/imageHelper'

export default function ReceiverLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [badges, setBadges] = useState({ requests: 3, pickups: 2, notifications: 3 })
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [expandedNotifId, setExpandedNotifId] = useState(null)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [helpModalOpen, setHelpModalOpen] = useState(false)
  const [receiverProfile, setReceiverProfile] = useState(null)
  const [orgName, setOrgName] = useState(user?.fullName || '')

  const handleToggleNotifications = () => {
    const nextState = !showNotifications
    setShowNotifications(nextState)
    if (nextState) {
      loadNotifications()
      refreshBadges()
    }
  }

  const notificationRef = useRef(null)
  const profileRef = useRef(null)
  const drawerRef = useRef(null)

  // Fetch badge counts and notifications
  const refreshBadges = async () => {
    try {
      const res = await receiverService.getBadges()
      if (res.data) {
        setBadges({
          requests: res.data.requests ?? 0,
          pickups: res.data.pickups ?? 0,
          notifications: res.data.notifications ?? 0,
        })
      }
    } catch (err) {
      // Fallback defaults
      setBadges({ requests: 3, pickups: 2, notifications: 3 })
    }
  }

  const loadNotifications = async () => {
    try {
      const res = await receiverService.getNotifications()
      if (res.data) {
        setNotifications(res.data)
      }
    } catch (err) {
      // Fallback demo notifications
      setNotifications([
        {
          _id: 'n1',
          title: 'Delivery In Transit',
          message: 'Volunteer courier is en route with your food order (ETA ~15 min).',
          link: '/receiver/pickups',
          isRead: false,
        },
        {
          _id: 'n2',
          title: 'Request Approved',
          message: 'The Curry House approved your request for 50 servings of Lentil Dal & Rice.',
          link: '/receiver/requests',
          isRead: false,
        },
        {
          _id: 'n3',
          title: 'Urgent Expiry Alert',
          message: 'Spice Garden has Vegetable Biryani expiring in less than 4 hours.',
          link: '/receiver/browse',
          isRead: false,
        },
      ])
    }
  }

  useEffect(() => {
    refreshBadges()
    loadNotifications()

    // Load registered receiver profile
    receiverService.getProfile().then((res) => {
      const prof = res.data?.profile
      const u = res.data?.user
      if (prof) {
        setReceiverProfile(prof)
        setOrgName(prof.organizationName || u?.fullName || user?.fullName || 'Receiver')
      }
    }).catch(() => {
      if (user?.fullName) setOrgName(user.fullName)
    })
  }, [location.pathname, user])

  // Click outside and ESC handlers
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

  // Auto close sidebar drawer on navigation
  useEffect(() => {
    setSidebarOpen(false)
    setShowNotifications(false)
    setProfileDropdownOpen(false)
  }, [location.pathname])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (err) {
      navigate('/login')
    }
  }

  const handleNotificationClick = async (notif) => {
    // Expand or collapse full message details in place without opening another page
    setExpandedNotifId((prev) => (prev === notif._id ? null : notif._id))

    // Mark as read if currently unread
    if (!notif.isRead) {
      try {
        await receiverService.markNotificationRead(notif._id)
      } catch (err) {
        console.error('Failed to mark notification as read:', err)
      }
      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
      )
      setBadges((prev) => ({
        ...prev,
        notifications: Math.max(0, (prev.notifications || 0) - 1),
      }))
    }
  }

  const markAllRead = async () => {
    try {
      await receiverService.markAllNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setBadges((prev) => ({ ...prev, notifications: 0 }))
    } catch (err) {
      console.error('Failed to mark all notifications read:', err)
    }
  }

  const displayName = user?.fullName || receiverProfile?.contactPerson || orgName || 'Receiver'
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'R'

  // Filter shared config by 'receiver' role
  const receiverNavItems = navigationConfig
    .filter((item) => item.roles.includes('receiver'))
    .map((item) => {
      let badgeVal = null
      let badgeColor = item.badgeColor || 'bg-[#2E7D32] text-white'

      if (item.badgeKey === 'requests') {
        badgeVal = badges.requests > 0 ? badges.requests : null
        badgeColor = 'bg-[#F59E0B] text-white'
      } else if (item.badgeKey === 'pickups') {
        badgeVal = badges.pickups > 0 ? badges.pickups : null
        badgeColor = 'bg-[#2E7D32] text-white'
      }

      return {
        ...item,
        badge: badgeVal,
        badgeColor,
      }
    })

  const today = new Date()
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Get current page Title & Subtitle for Top Bar (matching screenshots & user registered name)
  const getHeaderInfo = () => {
    const path = location.pathname
    if (path.startsWith('/receiver/browse')) {
      return {
        title: 'Browse Available Food',
        subtitle: 'Find and request food donations near you.',
      }
    }
    if (path.startsWith('/receiver/dashboard')) {
      // Use registered name / organization of receiver matching donor header style
      const receiverHeaderName = orgName || user?.fullName || receiverProfile?.contactPerson || 'Receiver'

      return {
        title: `Welcome back, ${receiverHeaderName}`,
        subtitle: formattedDate,
      }
    }
    if (path.startsWith('/receiver/requests')) {
      return {
        title: 'My Requests',
        subtitle: 'Track the status of your food requests.',
      }
    }
    if (path.startsWith('/receiver/pickups')) {
      return {
        title: 'Active Pickups',
        subtitle: 'Monitor your ongoing food pickups and deliveries.',
      }
    }
    if (path.startsWith('/receiver/history')) {
      return {
        title: 'History & Impact',
        subtitle: "See your organization's food rescue impact over time.",
      }
    }
    if (path.startsWith('/receiver/profile')) {
      return {
        title: 'My Profile',
        subtitle: 'Manage your organization information and contact details.',
      }
    }
    return {
      title: 'Receiver Portal',
      subtitle: 'Manage surplus food rescue operations.',
    }
  }

  const headerInfo = getHeaderInfo()

  return (
    <div className="min-h-screen bg-[#F8FAF7] flex font-['Inter',sans-serif] text-gray-900">
      {/* Backdrop for Universal Sidebar Drawer (All Screen Sizes) */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
      />

      {/* Universal Slide-in Side Navigation Drawer */}
      <aside
        ref={drawerRef}
        aria-label="Sidebar navigation drawer"
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-[#E5E7EB] flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5">
          {/* Logo & Brand + Close button */}
          <div className="flex items-center justify-between pb-5 mb-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2E7D32] flex items-center justify-center shadow-xs">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900 tracking-tight leading-none">
                  FoodShare
                </h1>
                <p className="text-[11px] font-medium text-[#2E7D32] mt-1">Receiver Dashboard</p>
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

          {/* Menu Items */}
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
              MENU
            </p>
            <nav className="space-y-1">
              {receiverNavItems.map((item) => {
                const Icon = item.icon
                const isActive =
                  location.pathname === item.path ||
                  (item.path === '/receiver/dashboard' &&
                    (location.pathname === '/receiver' || location.pathname === '/receiver/'))

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
                    {item.badge != null && (
                      <span
                        className={`text-xs min-w-5 h-5 flex items-center justify-center px-2 py-0.5 rounded-full font-bold ${
                          isActive ? 'bg-white text-[#2E7D32]' : item.badgeColor
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

        {/* Drawer Footer */}
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
              onClick={() => setHelpModalOpen(true)}
              className="hover:text-emerald-700 cursor-pointer"
              title="Help & Support"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* 2. MAIN CONTENT WRAPPER                                       */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0 w-full min-h-screen">
        {/* Top Navbar Header */}
        <header className="sticky top-0 z-30 bg-[#F8FAF7]/95 backdrop-blur-md px-4 sm:px-6 py-3.5 border-b border-[#E5E7EB]/70 flex items-center justify-between gap-4">
          {/* Left: 3-line Hamburger Menu Button + Page Title & Subtitle */}
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
                {headerInfo.title}
              </h2>
              <p className="text-xs text-gray-500 font-medium hidden sm:block truncate mt-0.5">
                {headerInfo.subtitle}
              </p>
            </div>
          </div>

          {/* Right: Notifications Bell + User Profile Chip */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={handleToggleNotifications}
                className="relative p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 shadow-2xs transition-all cursor-pointer"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {badges.notifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-gray-900">Notifications</p>
                      {badges.notifications > 0 && (
                        <span className="text-[11px] bg-emerald-100 text-[#2E7D32] font-bold px-2 py-0.5 rounded-full">
                          {badges.notifications > 99 ? '99+' : badges.notifications} new
                        </span>
                      )}
                    </div>
                    {badges.notifications > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[11px] text-[#2E7D32] hover:underline font-semibold cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto mt-1 -mx-1 px-1">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => {
                        const isExpanded = expandedNotifId === notif._id
                        const timeString = notif.createdAt
                          ? new Date(notif.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : null

                        return (
                          <div
                            key={notif._id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-2.5 my-1 rounded-xl cursor-pointer transition-colors ${
                              !notif.isRead
                                ? 'bg-emerald-50/50 hover:bg-emerald-50/80'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className={`w-2 h-2 rounded-full shrink-0 ${
                                    !notif.isRead ? 'bg-[#2E7D32]' : 'bg-transparent'
                                  }`}
                                />
                                <p
                                  className={`text-xs truncate ${
                                    !notif.isRead
                                      ? 'font-bold text-gray-900'
                                      : 'font-medium text-gray-700'
                                  }`}
                                >
                                  {notif.title}
                                </p>
                              </div>
                              {timeString && (
                                <span className="text-[10px] text-gray-400 shrink-0">
                                  {timeString}
                                </span>
                              )}
                            </div>

                            <p
                              className={`text-[11px] text-gray-600 mt-1 pl-4 leading-relaxed ${
                                isExpanded ? 'whitespace-normal' : 'line-clamp-2'
                              }`}
                            >
                              {notif.message}
                            </p>
                          </div>
                        )
                      })
                    ) : (
                      <div className="py-8 text-center text-xs text-gray-400">
                        No notifications right now.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Chip */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-white border border-transparent hover:border-gray-200 transition-all cursor-pointer group text-left"
                aria-label="User Profile Menu"
              >
                {/* Circular Avatar matching Donor Dashboard */}
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#2E7D32]/15 text-[#2E7D32] font-bold flex items-center justify-center text-xs sm:text-sm border border-[#2E7D32]/25 shrink-0 group-hover:bg-[#2E7D32]/20 transition-colors overflow-hidden">
                  {user?.avatar ? (
                    <img
                      src={getAvatarUrl(user.avatar)}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div className="hidden md:block leading-tight pr-1">
                  <p className="text-xs font-bold text-gray-900 truncate">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-gray-500 font-medium">Receiver</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 hidden md:block" />
              </button>

              {/* Profile Dropdown Popover */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in duration-150">
                  <div className="px-3 py-2.5 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-900 truncate">{orgName}</p>
                    <p className="text-[11px] text-gray-500 truncate">{user?.email || 'contact@hopeharbor.org'}</p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false)
                        navigate('/receiver/profile')
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                    >
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

        {/* Viewport Dynamic Content with Outlet Context */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
          <Outlet context={{ refreshBadges, badges }} />
        </main>
      </div>

      {/* Reusable Help & Support Modal */}
      <HelpSupportModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        userRole="receiver"
      />
    </div>
  )
}
