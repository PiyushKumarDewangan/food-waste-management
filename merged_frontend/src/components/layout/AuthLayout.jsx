import { useState } from 'react'
import { HelpCircle, Menu } from 'lucide-react'
import AuthLeftPanel from './AuthLeftPanel.jsx'
import GlobalSideDrawer from './GlobalSideDrawer.jsx'

/**
 * Shared desktop split-screen shell for every auth / registration page.
 * Left = green brand panel, Right = white content area with global hamburger side menu.
 */
export default function AuthLayout({ mode = 'login', leftHeading, leftSubheading, children }) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="min-h-screen w-full flex bg-background relative">
      {/* Global Slide-in Side Menu (Identical to Donor Dashboard) */}
      <GlobalSideDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        role="donor"
      />

      <AuthLeftPanel mode={mode} heading={leftHeading} subheading={leftSubheading} />

      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-14">
        {/* Top Header Bar with Hamburger Button for Global Side Menu */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="p-2 sm:p-2.5 rounded-xl bg-white text-gray-700 hover:text-gray-900 hover:bg-gray-100/90 border border-gray-200 shadow-2xs transition-all cursor-pointer flex items-center justify-center shrink-0"
            title="Open Navigation Menu"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        <div className="w-full max-w-md">{children}</div>

        <a
          href="mailto:support@foodshare.org"
          aria-label="Need help? Contact support"
          className="absolute bottom-6 right-6 flex items-center justify-center w-9 h-9 rounded-full bg-white shadow-soft text-gray-400 hover:text-primary transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
        </a>
      </div>
    </div>
  )
}
