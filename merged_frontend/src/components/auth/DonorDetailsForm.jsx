import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, MapPin, Clock } from 'lucide-react'
import Input from '../ui/Input.jsx'
import Checkbox from '../ui/Checkbox.jsx'
import Button from '../ui/Button.jsx'
import { useRegistration } from '../../context/RegistrationContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { DONOR_ACCOUNT_TYPES } from '../../utils/constants'
import { validateRequired, validateChecked, runValidators } from '../../utils/validation'
import authService from '../../services/authService'

export default function DonorDetailsForm() {
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const { data, updateFields, markStepComplete, setSubmissionResult } = useRegistration()
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const isOrg = data.donorType === 'business'

  const handleChange = (field) => (e) => {
    const value = field === 'foodSafetyAccepted' ? e.target.checked : e.target.value
    updateFields({ [field]: value })
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const validators = {
      pickupAddress: (v) => validateRequired(v, 'Pickup address'),
      pickupAvailability: (v) => validateRequired(v, 'Preferred pickup time'),
      foodSafetyAccepted: (v) => validateChecked(v, 'Please confirm the food safety statement.'),
    }
    if (isOrg) {
      validators.organizationName = (v) => validateRequired(v, 'Organization or business name')
    }
    const nextErrors = runValidators(data, validators)
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!validate()) return

    setLoading(true)
    try {
      const payload = {
        fullName: data.fullName,
        email: data.email,
        phone: `${data.countryCode}${data.phone}`,
        password: data.password,
        city: data.city,
        role: 'donor',
        donorType: data.donorType,
        organizationName: data.organizationName,
        pickupAddress: data.pickupAddress,
        pickupAvailability: data.pickupAvailability,
        foodSafetyAccepted: data.foodSafetyAccepted,
      }
      const result = await authService.registerDonor(payload)
      setSubmissionResult(result)
      // Donors are auto-verified on signup, so the backend returns a real
      // access token + user immediately — log them in right away rather
      // than making them visit /login separately.
      if (result?.data?.accessToken) {
        setSession(result.data.user, result.data.accessToken)
      }
      markStepComplete('details')
      navigate('/register/complete')
    } catch (err) {
      setFormError(err.message || 'Something went wrong submitting your registration.')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => navigate('/register/role')

  return (
    <div className="bg-white rounded-2xl shadow-card border border-borderc/60 px-8 py-9">
      <h1 className="text-xl font-bold text-ink">Donor Details</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">Help us set up your profile correctly.</p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Account type</label>
          <div className="grid grid-cols-2 rounded-xl border border-borderc bg-gray-50 p-1">
            {DONOR_ACCOUNT_TYPES.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateFields({ donorType: opt.value })}
                aria-pressed={data.donorType === opt.value}
                className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                  data.donorType === opt.value ? 'bg-white text-primary shadow-soft' : 'text-gray-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {isOrg && (
          <Input
            id="organizationName"
            label="Organization or business name"
            icon={Building2}
            placeholder="Green Table Restaurant"
            value={data.organizationName}
            onChange={handleChange('organizationName')}
            error={errors.organizationName}
            required
          />
        )}

        <Input
          id="pickupAddress"
          label="Pickup address"
          icon={MapPin}
          placeholder="123 Uhuru Highway, Nairobi"
          value={data.pickupAddress}
          onChange={handleChange('pickupAddress')}
          error={errors.pickupAddress}
          required
        />

        <Input
          id="pickupAvailability"
          label="Preferred pickup time / availability"
          icon={Clock}
          placeholder="e.g. Weekdays, 5 PM - 8 PM"
          value={data.pickupAvailability}
          onChange={handleChange('pickupAvailability')}
          error={errors.pickupAvailability}
          required
        />

        <Checkbox
          id="foodSafetyAccepted"
          checked={data.foodSafetyAccepted}
          onChange={handleChange('foodSafetyAccepted')}
          error={errors.foodSafetyAccepted}
          label="I confirm that donated food will be safe and accurately described"
        />

        {formError && (
          <p role="alert" className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {formError}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" onClick={handleBack} className="flex-1 justify-center">
            ← Back
          </Button>
          <Button type="submit" variant="primary" loading={loading} className="flex-1 justify-center">
            Submit registration →
          </Button>
        </div>
      </form>
    </div>
  )
}
