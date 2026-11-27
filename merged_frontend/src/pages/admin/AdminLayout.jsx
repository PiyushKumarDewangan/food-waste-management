import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  UtensilsCrossed,
  Truck,
  BarChart3,
  LogOut,
  Bell,
  Menu,
  X,
  ChevronDown,
  Leaf,
  HelpCircle,
  CheckCheck,
  AlertTriangle,
  Clock,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import HelpSupportModal from '../../components/common/HelpSupportModal'
import { adminService } from '../../services/adminService'

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [pendingBadge, setPendingBadge] = useState(null)

  useEffect(() => {
    async function fetchBadge() {
      try {
        const dash = await adminService.getDashboard()
        if (dash?.kpis?.pendingVerifications !== undefined) {
          setPendingBadge(dash.kpis.pendingVerifications)
        }
      } catch (e) {
        // quiet
      }
    }
    fetchBadge()
  }, [location.pathname])

  const NAV_ITEMS = [
    {
      name: 'Dashboard',
      to: '/admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Verifications',
      to: '/admin/verifications',
      icon: ShieldCheck,
      badge: pendingBadge !== null ? (pendingBadge > 0 ? String(pendingBadge) : null) : '...',
    },
    {
      name: 'User Management',
      to: '/admin/users',
      icon: Users,
    },
    {
      name: 'Food Management',
      to: '/admin/food',
      icon: UtensilsCrossed,
    },
    {
      name: 'Requests & Deliveries',
      to: '/admin/deliveries',
      icon: Truck,
    },
    {
      name: 'Reports & Analytics',
      to: '/admin/reports',
      icon: BarChart3,
    },
  ]

  // Sidebar is collapsed by default (opens on clicking the 3-line hamburger menu)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false)
  const [helpModalOpen, setHelpModalOpen] = useState(false)
  const [sectionToast, setSectionToast] = useState(null)

  const profileRef = useRef(null)
  const notificationRef = useRef(null)
  const sidebarRef = useRef(null)

  // Notification items matching real platform alerts
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: '3 Food Listings Expiring',
      description: 'Items at Hyatt Regency & Metro Supermarket expire in < 2 hours.',
      time: '10m ago',
      unread: true,
      type: 'warning',
    },
    {
      id: 'notif-2',
      title: 'New Receiver Application',
      description: 'Hope Foundation Kitchen submitted 80G Certificate + PAN for verification.',
      time: '2h ago',
      unread: true,
      type: 'verification',
    },
    {
      id: 'notif-3',
      title: 'Unassigned Urgent Pickup',
      description: 'Exchange #EX-1043 needs volunteer assignment in Colaba.',
      time: '3h ago',
      unread: true,
      type: 'alert',
    },
  ])

  const unreadCount = notifications.filter((n) => n.unread).length

  // Close dropdowns and sidebar when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationDropdownOpen(false)
      }
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        // Handled by backdrop click
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setSidebarOpen(false)
        setProfileDropdownOpen(false)
        setNotificationDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Automatically close sidebar and popups on navigation change
  useEffect(() => {
    setSidebarOpen(false)
    setProfileDropdownOpen(false)
    setNotificationDropdownOpen(false)

    const current = NAV_ITEMS.find((item) => location.pathname.startsWith(item.to))
    if (current && current.name !== 'Dashboard') {
      setSectionToast(`${current.name} section selected`)
      const timer = setTimeout(() => setSectionToast(null), 3500)
      return () => clearTimeout(timer)
    } else {
      setSectionToast(null)
    }
  }, [location.pathname])

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
      // Ignore
    } finally {
      navigate('/login')
    }
  }

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
  }

  // Format current date nicely: "Friday, November 20, 2026"
  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  // Display user's name or fallback
  const displayName = user?.fullName || 'Super Admin'
  const userInitials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AD'

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#1F2937] flex flex-col antialiased">
      {/* ===================== SIDEBAR BACKDROP OVERLAY ===================== */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
      />

      {/* ===================== SIDEBAR NAVIGATION DRAWER ===================== */}
      <aside
        ref={sidebarRef}
        aria-label="Admin sidebar navigation"
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-[#E5E7EB] flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-in-out select-none ${
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
                <p className="text-[11px] font-medium text-emerald-700 mt-1">Admin Dashboard</p>
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
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname.startsWith(item.to)

                return (
                  <NavLink
                    key={item.name}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#2E7D32] text-white shadow-xs font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-amber-100 text-amber-700 font-extrabold'
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

      {/* ===================== MAIN CONTENT WRAPPER ===================== */}
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-y-auto">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-[#F8FAF7]/95 backdrop-blur-md px-4 sm:px-6 py-3.5 border-b border-[#E5E7EB]/70 flex items-center justify-between gap-4">
          {/* LEFT SIDE: [ Hamburger Menu (Three Lines) ] Welcome back, ... */}
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
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 tracking-tight truncate">
                Welcome back, {displayName}
              </h2>
              <p className="text-xs text-gray-500 font-medium hidden sm:block">
                {currentDateFormatted}
              </p>
            </div>
          </div>

          {/* RIGHT SIDE: [ Notification Bell ] [ Super Admin Profile ] */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
                className="relative p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 shadow-2xs transition-all cursor-pointer"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {notificationDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-200 py-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between px-4 pb-2 border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-[#1F2937]">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-xs text-[#2E7D32] hover:underline font-semibold flex items-center space-x-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark all read</span>
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`px-4 py-3 hover:bg-gray-50/80 transition-colors flex items-start space-x-3 ${
                          notif.unread ? 'bg-emerald-50/30' : ''
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {notif.type === 'warning' ? (
                            <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                              <Clock className="w-4 h-4" />
                            </div>
                          ) : notif.type === 'alert' ? (
                            <div className="w-7 h-7 rounded-full bg-red-100 text-red-700 flex items-center justify-center">
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                              <ShieldCheck className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-gray-900 truncate">
                              {notif.title}
                            </h4>
                            <span className="text-[10px] text-gray-400">{notif.time}</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5 leading-snug">
                            {notif.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 px-4 border-t border-gray-100 text-center">
                    <NavLink
                      to="/admin/verifications"
                      onClick={() => setNotificationDropdownOpen(false)}
                      className="text-xs text-[#2E7D32] font-bold hover:underline"
                    >
                      View all system verifications & alerts &rarr;
                    </NavLink>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer group"
                aria-label="User Profile"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#2E7D32] flex items-center justify-center font-bold text-xs ring-2 ring-emerald-500/20">
                  {userInitials}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-xs font-bold text-gray-800 leading-tight truncate max-w-[140px]">
                    {displayName}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium capitalize">
                    {user?.role === 'admin' ? 'Super Admin' : user?.role || 'Admin'}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-colors hidden sm:block" />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-400">Signed in as</p>
                    <p className="text-sm font-bold text-[#1F2937] truncate">
                      {user?.email || 'admin@foodshare.org'}
                    </p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false)
                        navigate('/admin/dashboard')
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <LayoutDashboard className="w-4 h-4 text-gray-400" />
                      <span>Admin Console Home</span>
                    </button>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false)
                        navigate('/admin/users')
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>Manage User Accounts</span>
                    </button>
                  </div>

                  <div className="border-t border-gray-100 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>Sign out of Admin</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Floating Section Selected Pill Toast (From Figma Screenshot Bottom Right) */}
      {sectionToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 bg-white text-gray-800 text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg border border-gray-200/90 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px]">
            ✓
          </span>
          <span>{sectionToast}</span>
          <button
            onClick={() => setSectionToast(null)}
            className="ml-2 text-gray-400 hover:text-gray-600 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Reusable Help Modal */}
      {helpModalOpen && (
        <HelpSupportModal isOpen={helpModalOpen} onClose={() => setHelpModalOpen(false)} />
      )}
    </div>
  )
}
