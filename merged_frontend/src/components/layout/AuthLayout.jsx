import { HelpCircle } from 'lucide-react'
import AuthLeftPanel from './AuthLeftPanel.jsx'

/**
 * Shared desktop split-screen shell for every auth / registration page.
 * Left = green brand panel, Right = white content area (card + optional stepper).
 */
export default function AuthLayout({ mode = 'login', leftHeading, leftSubheading, children }) {
  return (
    <div className="min-h-screen w-full flex bg-background">
      <AuthLeftPanel mode={mode} heading={leftHeading} subheading={leftSubheading} />

      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">{children}</div>

        <a
          href="mailto:support@foodbridge.org"
          aria-label="Need help? Contact support"
          className="absolute bottom-6 right-6 flex items-center justify-center w-9 h-9 rounded-full bg-white shadow-soft text-gray-400 hover:text-primary transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
        </a>
      </div>
    </div>
  )
}
