import { useEffect, useRef } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  PlusCircle,
  UtensilsCrossed,
  Inbox,
  ArrowLeftRight,
  Leaf,
  User,
  LogOut,
  LogIn,
  HelpCircle,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { navigationConfig } from '../../config/navigationConfig'

export default function GlobalSideDrawer({
  isOpen,
  onClose,
  role = 'donor',
  counts = {},
}) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const drawerRef = useRef(null)

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Automatically close on navigation
  useEffect(() => {
    if (isOpen) {
      onClose()
    }
  }, [location.pathname])

  const handleAuthAction = async () => {
    onClose()
    if (user) {
      try {
        await logout()
      } catch (err) {
        console.error('Logout error:', err)
      }
      navigate('/login')
    } else {
      navigate('/login')
    }
  }

  // Get nav items matching role (defaulting to donor items matching media_1792653455796.png)
  const navItems = navigationConfig
    .filter((item) => item.roles.includes(role))
    .map((item) => ({
      ...item,
      badge: item.badgeKey ? (counts[item.badgeKey] > 0 ? counts[item.badgeKey] : null) : null,
    }))

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      {/* Slide-in Drawer */}
      <aside
        ref={drawerRef}
        aria-label="Global navigation menu"
        className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-white border-r border-[#E5E7EB] flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5">
          {/* Header: Logo, Brand & Close Button */}
          <div className="flex items-center justify-between pb-5 mb-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2E7D32] flex items-center justify-center shadow-xs shrink-0">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900 tracking-tight leading-none">
                  FoodShare
                </h1>
                <p className="text-[11px] font-medium text-emerald-700 mt-1">
                  {role === 'receiver'
                    ? 'Receiver Dashboard'
                    : role === 'volunteer'
                    ? 'Volunteer Portal'
                    : 'Donor Dashboard'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
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
              Menu
            </p>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive =
                  location.pathname === item.path ||
                  (item.path === '/donor/dashboard' && location.pathname === '/donor') ||
                  (item.path === '/receiver/dashboard' && location.pathname === '/receiver')

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
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
                    {item.badge && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          isActive ? 'bg-white/20 text-white' : item.badgeColor
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

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 space-y-1">
          <button
            onClick={handleAuthAction}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            {user ? (
              <>
                <LogOut className="w-4 h-4 text-gray-500 hover:text-red-600" />
                <span>Log Out</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 text-gray-500 hover:text-emerald-700" />
                <span>Log In</span>
              </>
            )}
          </button>
          <div className="flex items-center justify-between px-3.5 py-2 text-xs text-gray-400">
            <span>FoodShare v1.0</span>
            <button
              onClick={() => alert('FoodShare Community Support: help@foodshare.org')}
              className="hover:text-emerald-700 cursor-pointer"
              title="Help & Support"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
