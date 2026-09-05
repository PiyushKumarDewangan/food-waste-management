import { createContext, useContext, useMemo, useState, useCallback } from 'react'

const RegistrationContext = createContext(null)

const initialState = {
  // Step 1 — account details
  fullName: '',
  email: '',
  countryCode: '+254',
  phone: '',
  password: '',
  confirmPassword: '',
  city: '',
  termsAccepted: false,

  // Step 2 — role
  role: '', // 'donor' | 'receiver' | 'volunteer'

  // Step 3 — donor fields
  donorType: 'individual',
  organizationName: '',
  pickupAddress: '',
  pickupAvailability: '',
  foodSafetyAccepted: false,

  // Step 3 — receiver fields
  contactPerson: '',
  organizationAddress: '',
  storageCapacity: '',
  operatingHours: '',
  verificationDocument: null,

  // Step 3 — volunteer fields
  availableDays: [],
  preferredTime: '',
  serviceRadius: '',
  transportType: '',
  vehicleNumber: '',
  guidelinesAccepted: false,
}

// Tracks how far the user has actually progressed so direct URL access to a
// later step (e.g. typing /register/details) can be blocked/redirected.
const STEP_ORDER = ['account', 'role', 'details', 'complete']

export function RegistrationProvider({ children }) {
  const [data, setData] = useState(initialState)
  const [completedSteps, setCompletedSteps] = useState([])
  const [submissionResult, setSubmissionResult] = useState(null)

  const updateFields = useCallback((fields) => {
    setData((prev) => ({ ...prev, ...fields }))
  }, [])

  const markStepComplete = useCallback((stepKey) => {
    setCompletedSteps((prev) => (prev.includes(stepKey) ? prev : [...prev, stepKey]))
  }, [])

  const canAccessStep = useCallback(
    (stepKey) => {
      const index = STEP_ORDER.indexOf(stepKey)
      if (index <= 0) return true
      const previousStep = STEP_ORDER[index - 1]
      return completedSteps.includes(previousStep)
    },
    [completedSteps]
  )

  const resetRegistration = useCallback(() => {
    setData(initialState)
    setCompletedSteps([])
    setSubmissionResult(null)
  }, [])

  const value = useMemo(
    () => ({
      data,
      updateFields,
      completedSteps,
      markStepComplete,
      canAccessStep,
      resetRegistration,
      submissionResult,
      setSubmissionResult,
    }),
    [data, updateFields, completedSteps, markStepComplete, canAccessStep, resetRegistration, submissionResult]
  )

  return <RegistrationContext.Provider value={value}>{children}</RegistrationContext.Provider>
}

export function useRegistration() {
  const ctx = useContext(RegistrationContext)
  if (!ctx) throw new Error('useRegistration must be used within a RegistrationProvider')
  return ctx
}

export default RegistrationContext
