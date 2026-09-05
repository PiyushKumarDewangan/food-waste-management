import { useNavigate } from 'react-router-dom'
import { Check, AlertTriangle } from 'lucide-react'
import Button from '../ui/Button.jsx'
import StatusBadge from '../ui/StatusBadge.jsx'
import { useRegistration } from '../../context/RegistrationContext.jsx'
import { ROLES } from '../../utils/constants'

export default function RegistrationComplete() {
  const navigate = useNavigate()
  const { data, resetRegistration } = useRegistration()

  const isDonor = data.role === ROLES.DONOR

  const handlePrimaryAction = () => {
    resetRegistration()
    navigate(isDonor ? '/dashboard' : '/login')
  }

  return (
    <div className="bg-white rounded-2xl shadow-card border border-borderc/60 px-8 py-10 text-center">
      <div className="relative mx-auto w-20 h-20 mb-5">
        <span
          className={`absolute inset-0 rounded-full animate-pulseSoft ${
            isDonor ? 'bg-primary/15' : 'bg-accent/20'
          }`}
        />
        <span
          className={`absolute inset-2 rounded-full ${isDonor ? 'bg-primary/20' : 'bg-accent/25'}`}
        />
        <span
          className={`absolute inset-[22px] flex items-center justify-center rounded-full text-white ${
            isDonor ? 'bg-primary' : 'bg-accent'
          }`}
        >
          {isDonor ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
        </span>
      </div>

      {isDonor ? (
        <>
          <h1 className="text-xl font-bold text-ink">Your account is ready!</h1>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Your email and phone have been verified. You can now start posting food donations.
          </p>
          <Button onClick={handlePrimaryAction} variant="primary" className="w-full justify-center mt-7">
            Go to dashboard →
          </Button>
        </>
      ) : (
        <>
          <h1 className="text-xl font-bold text-ink">Registration submitted</h1>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Your profile is under review. We&apos;ll notify you once it has been approved.
          </p>
          <div className="mt-4 flex justify-center">
            <StatusBadge variant="pending">Pending review</StatusBadge>
          </div>
          <Button onClick={handlePrimaryAction} variant="primary" className="w-full justify-center mt-7">
            Back to login →
          </Button>
          <a
            href="mailto:support@foodbridge.org"
            className="block text-xs text-gray-400 hover:text-primary mt-4"
          >
            Need help? Contact support
          </a>
        </>
      )}
    </div>
  )
}
