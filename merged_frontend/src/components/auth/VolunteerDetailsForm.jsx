import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Clock } from 'lucide-react'
import Input from '../ui/Input.jsx'
import Checkbox from '../ui/Checkbox.jsx'
import Button from '../ui/Button.jsx'
import { useRegistration } from '../../context/RegistrationContext.jsx'
import {
  DAYS,
  TRANSPORT_TYPES,
  TRANSPORT_TYPES_REQUIRING_VEHICLE_NUMBER,
} from '../../utils/constants'
import { validateRequired, validateChecked, runValidators } from '../../utils/validation'
import authService from '../../services/authService'

export default function VolunteerDetailsForm() {
  const navigate = useNavigate()
  const { data, updateFields, markStepComplete, setSubmissionResult } = useRegistration()
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const needsVehicleNumber = TRANSPORT_TYPES_REQUIRING_VEHICLE_NUMBER.includes(data.transportType)

  const toggleDay = (dayValue) => {
    const exists = data.availableDays.includes(dayValue)
    const next = exists
      ? data.availableDays.filter((d) => d !== dayValue)
      : [...data.availableDays, dayValue]
    updateFields({ availableDays: next })
    if (errors.availableDays) setErrors((prev) => ({ ...prev, availableDays: '' }))
  }

  const handleChange = (field) => (e) => {
    const value = field === 'guidelinesAccepted' ? e.target.checked : e.target.value
    updateFields({ [field]: value })
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const validators = {
      availableDays: (v) => validateRequired(v, 'Availability'),
      preferredTime: (v) => validateRequired(v, 'Preferred time slots'),
      serviceRadius: (v) => validateRequired(v, 'Service area / travel radius'),
      transportType: (v) => validateRequired(v, 'Transport type'),
      guidelinesAccepted: (v) =>
        validateChecked(v, 'Please agree to the food handling and delivery guidelines.'),
    }
    if (needsVehicleNumber) {
      validators.vehicleNumber = (v) => validateRequired(v, 'Vehicle number')
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
        role: 'volunteer',
        availableDays: data.availableDays,
        preferredTime: data.preferredTime,
        serviceRadius: data.serviceRadius,
        transportType: data.transportType,
        vehicleNumber: needsVehicleNumber ? data.vehicleNumber : '',
        guidelinesAccepted: data.guidelinesAccepted,
      }
      const result = await authService.registerVolunteer(payload)
      setSubmissionResult(result)
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
      <h1 className="text-xl font-bold text-ink">Volunteer Details</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">Help us set up your profile correctly.</p>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            Availability — days <span className="text-primary">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => {
              const selected = data.availableDays.includes(day.value)
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  aria-pressed={selected}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    selected
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-600 border-borderc hover:border-primary'
                  }`}
                >
                  {day.label}
                </button>
              )
            })}
          </div>
          {errors.availableDays && <p className="mt-1.5 text-xs text-red-500">{errors.availableDays}</p>}
        </div>

        <Input
          id="preferredTime"
          label="Preferred time slots"
          icon={Clock}
          placeholder="e.g. Mornings 8-12, Evenings 5-8"
          value={data.preferredTime}
          onChange={handleChange('preferredTime')}
          error={errors.preferredTime}
          required
        />

        <Input
          id="serviceRadius"
          label="Service area / travel radius"
          icon={MapPin}
          placeholder="e.g. Within 10 km of Westlands"
          value={data.serviceRadius}
          onChange={handleChange('serviceRadius')}
          error={errors.serviceRadius}
          required
        />

        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            Transport type <span className="text-primary">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {TRANSPORT_TYPES.map((t) => {
              const selected = data.transportType === t.value
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => {
                    updateFields({ transportType: t.value })
                    if (errors.transportType) setErrors((prev) => ({ ...prev, transportType: '' }))
                  }}
                  aria-pressed={selected}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    selected
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-600 border-borderc hover:border-primary'
                  }`}
                >
                  {t.label}
                </button>
              )
            })}
          </div>
          {errors.transportType && <p className="mt-1.5 text-xs text-red-500">{errors.transportType}</p>}
        </div>

        {needsVehicleNumber && (
          <Input
            id="vehicleNumber"
            label="Vehicle number"
            placeholder="e.g. KDA 123B"
            value={data.vehicleNumber}
            onChange={handleChange('vehicleNumber')}
            error={errors.vehicleNumber}
            required
          />
        )}

        <Checkbox
          id="guidelinesAccepted"
          checked={data.guidelinesAccepted}
          onChange={handleChange('guidelinesAccepted')}
          error={errors.guidelinesAccepted}
          label="I agree to follow food handling and delivery guidelines"
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
            Submit for review →
          </Button>
        </div>
      </form>
    </div>
  )
}
