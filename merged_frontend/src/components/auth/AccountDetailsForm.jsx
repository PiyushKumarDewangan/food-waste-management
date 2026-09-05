import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { User, Mail, Phone, MapPin } from 'lucide-react'
import Input from '../ui/Input.jsx'
import PasswordInput from '../ui/PasswordInput.jsx'
import PasswordStrength from '../ui/PasswordStrength.jsx'
import Checkbox from '../ui/Checkbox.jsx'
import Button from '../ui/Button.jsx'
import { useRegistration } from '../../context/RegistrationContext.jsx'
import { COUNTRY_CODES } from '../../utils/constants'
import {
  validateRequired,
  validateEmail,
  validatePhone,
  validatePassword,
  validateConfirmPassword,
  validateChecked,
  runValidators,
} from '../../utils/validation'

export default function AccountDetailsForm() {
  const navigate = useNavigate()
  const { data, updateFields, markStepComplete } = useRegistration()
  const [errors, setErrors] = useState({})

  const handleChange = (field) => (e) => {
    const value = field === 'termsAccepted' ? e.target.checked : e.target.value
    updateFields({ [field]: value })
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const nextErrors = runValidators(data, {
      fullName: (v) => validateRequired(v, 'Full name'),
      email: (v) => validateEmail(v),
      phone: (v) => validatePhone(v),
      password: (v) => validatePassword(v),
      confirmPassword: (v, all) => validateConfirmPassword(all.password, v),
      city: (v) => validateRequired(v, 'City or service area'),
      termsAccepted: (v) => validateChecked(v, 'You must accept the Terms of Service and Privacy Policy.'),
    })
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    markStepComplete('account')
    navigate('/register/role')
  }

  return (
    <div className="bg-white rounded-2xl shadow-card border border-borderc/60 px-8 py-9">
      <h1 className="text-xl font-bold text-ink">Create your account</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">Join the movement to reduce food waste.</p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          id="fullName"
          label="Full name"
          icon={User}
          placeholder="Jane Appleseed"
          value={data.fullName}
          onChange={handleChange('fullName')}
          error={errors.fullName}
          required
        />

        <Input
          id="email"
          label="Email address"
          icon={Mail}
          type="email"
          placeholder="you@example.com"
          value={data.email}
          onChange={handleChange('email')}
          error={errors.email}
          required
        />

        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            Phone number <span className="text-primary">*</span>
          </label>
          <div className="flex gap-2">
            <select
              aria-label="Country code"
              value={data.countryCode}
              onChange={handleChange('countryCode')}
              className="rounded-xl border border-borderc bg-white text-sm text-ink py-3 px-2.5 outline-none focus:border-primary w-24 shrink-0"
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.value}
                </option>
              ))}
            </select>
            <Input
              id="phone"
              icon={Phone}
              type="tel"
              placeholder="712 345 678"
              value={data.phone}
              onChange={handleChange('phone')}
              error={errors.phone}
              containerClassName="flex-1"
            />
          </div>
          {errors.phone && <p className="mt-1.5 text-xs text-red-500">{errors.phone}</p>}
        </div>

        <div>
          <PasswordInput
            id="password"
            label="Password"
            placeholder="Create a strong password"
            value={data.password}
            onChange={handleChange('password')}
            error={errors.password}
            required
          />
          <PasswordStrength password={data.password} />
        </div>

        <PasswordInput
          id="confirmPassword"
          label="Confirm password"
          placeholder="Repeat your password"
          value={data.confirmPassword}
          onChange={handleChange('confirmPassword')}
          error={errors.confirmPassword}
          required
        />

        <Input
          id="city"
          label="City or service area"
          icon={MapPin}
          placeholder="e.g. Nairobi, Westlands"
          value={data.city}
          onChange={handleChange('city')}
          error={errors.city}
          required
        />

        <Checkbox
          id="termsAccepted"
          checked={data.termsAccepted}
          onChange={handleChange('termsAccepted')}
          error={errors.termsAccepted}
          label={
            <>
              I agree to the{' '}
              <a href="#terms" className="text-primary font-medium hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#privacy" className="text-primary font-medium hover:underline">
                Privacy Policy
              </a>
            </>
          }
        />

        <Button type="submit" variant="primary" className="w-full justify-center">
          Continue →
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-primary font-semibold hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}
