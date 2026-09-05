import { useEffect } from 'react'
import { useLocation, Navigate } from 'react-router-dom'
import AuthLayout from '../../components/layout/AuthLayout.jsx'
import RegisterStepper from '../../components/auth/RegisterStepper.jsx'
import AccountDetailsForm from '../../components/auth/AccountDetailsForm.jsx'
import RoleSelection from '../../components/auth/RoleSelection.jsx'
import DonorDetailsForm from '../../components/auth/DonorDetailsForm.jsx'
import ReceiverDetailsForm from '../../components/auth/ReceiverDetailsForm.jsx'
import VolunteerDetailsForm from '../../components/auth/VolunteerDetailsForm.jsx'
import RegistrationComplete from '../../components/auth/RegistrationComplete.jsx'
import { useRegistration } from '../../context/RegistrationContext.jsx'
import { ROLES } from '../../utils/constants'

// Maps the URL suffix (/register/:step) to the stepper key + left-panel copy.
const STEP_META = {
  account: {
    stepperKey: 'account',
    left: { heading: 'Join the movement', subheading: 'Every registration brings us one step closer to a world with zero food waste.' },
  },
  role: {
    stepperKey: 'role',
    left: { heading: 'Choose your role', subheading: 'Whether you donate, receive, or deliver — every role matters in the chain.' },
  },
  details: {
    stepperKey: 'details',
    left: { heading: 'Almost there!', subheading: 'Just a few more details so we can tailor the experience to your needs.' },
  },
  complete: {
    stepperKey: 'complete',
    left: { heading: "You're making a difference", subheading: 'Together we\u2019ve already shared over 180,000 meals across 340 communities.' },
  },
}

export default function Register() {
  const location = useLocation()
  const { data, canAccessStep } = useRegistration()

  // /register/account, /register/role, /register/details, /register/complete
  const step = location.pathname.split('/register/')[1] || 'account'
  const meta = STEP_META[step] || STEP_META.account

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [step])

  // Guard: block direct URL access to a later step before earlier ones are done.
  if (!canAccessStep(step)) {
    return <Navigate to="/register/account" replace />
  }

  // Guard: block /register/details without a chosen role.
  if (step === 'details' && !data.role) {
    return <Navigate to="/register/role" replace />
  }

  const renderStep = () => {
    switch (step) {
      case 'account':
        return <AccountDetailsForm />
      case 'role':
        return <RoleSelection />
      case 'details':
        if (data.role === ROLES.RECEIVER) return <ReceiverDetailsForm />
        if (data.role === ROLES.VOLUNTEER) return <VolunteerDetailsForm />
        return <DonorDetailsForm />
      case 'complete':
        return <RegistrationComplete />
      default:
        return <AccountDetailsForm />
    }
  }

  return (
    <AuthLayout mode="register" leftHeading={meta.left.heading} leftSubheading={meta.left.subheading}>
      {step !== 'complete' && (
        <RegisterStepper activeKey={meta.stepperKey} completedSteps={completedStepKeys(step)} />
      )}
      {renderStep()}
    </AuthLayout>
  )
}

// Small helper so the stepper visually marks every step before the current one
// as completed, independent of context.completedSteps timing quirks.
function completedStepKeys(currentStep) {
  const order = ['account', 'role', 'details', 'complete']
  const index = order.indexOf(currentStep)
  return order.slice(0, index)
}
