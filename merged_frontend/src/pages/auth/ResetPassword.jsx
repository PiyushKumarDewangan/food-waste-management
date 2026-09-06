import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react'
import AuthLayout from '../../components/layout/AuthLayout.jsx'
import PasswordInput from '../../components/ui/PasswordInput.jsx'
import PasswordStrength from '../../components/ui/PasswordStrength.jsx'
import Button from '../../components/ui/Button.jsx'
import { validatePassword, validateConfirmPassword } from '../../utils/validation'
import authService from '../../services/authService'

// Reached via the link inside the password-reset email:
// `${FRONTEND_URL}/reset-password?token=<rawResetToken>` — see backend
// authController.forgotPassword for how that link is built and sent.
export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState(false)

  const validate = () => {
    const nextErrors = {}
    const passwordError = validatePassword(password)
    if (passwordError) nextErrors.password = passwordError
    const confirmError = validateConfirmPassword(password, confirmPassword)
    if (confirmError) nextErrors.confirmPassword = confirmError
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!validate()) return

    setLoading(true)
    try {
      await authService.resetPassword(token, password)
      setSuccess(true)
    } catch (err) {
      setFormError(err.message || 'This reset link is invalid or has expired.')
    } finally {
      setLoading(false)
    }
  }

  // No token in the URL at all — someone navigated here directly rather
  // than via the emailed link.
  if (!token) {
    return (
      <AuthLayout mode="login">
        <div className="bg-white rounded-2xl shadow-card border border-borderc/60 px-8 py-9 text-center">
          <span className="flex items-center justify-center w-12 h-12 rounded-full bg-accent/15 mx-auto mb-4">
            <AlertTriangle className="w-5 h-5 text-accent" />
          </span>
          <h1 className="text-xl font-bold text-ink">Invalid reset link</h1>
          <p className="text-sm text-gray-500 mt-2">
            This password reset link is missing or invalid. Please request a new one.
          </p>
          <Link to="/forgot-password">
            <Button variant="primary" className="w-full justify-center mt-6">
              Request a new link
            </Button>
          </Link>
        </div>
      </AuthLayout>
    )
  }

  if (success) {
    return (
      <AuthLayout mode="login">
        <div className="bg-white rounded-2xl shadow-card border border-borderc/60 px-8 py-9 text-center">
          <span className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4">
            <CheckCircle2 className="w-5 h-5 text-primary" />
          </span>
          <h1 className="text-xl font-bold text-ink">Password reset successful</h1>
          <p className="text-sm text-gray-500 mt-2">
            Your password has been updated. You can now log in with your new password.
          </p>
          <Button variant="primary" className="w-full justify-center mt-6" onClick={() => navigate('/login')}>
            Go to login →
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout mode="login">
      <div className="bg-white rounded-2xl shadow-card border border-borderc/60 px-8 py-9">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary mb-5">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to login
        </Link>

        <h1 className="text-xl font-bold text-ink">Set a new password</h1>
        <p className="text-sm text-gray-500 mt-1 mb-6">Choose a strong password for your account.</p>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <PasswordInput
              id="password"
              label="New password"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (errors.password) setErrors((prev) => ({ ...prev, password: '' }))
              }}
              error={errors.password}
              required
            />
            <PasswordStrength password={password} />
          </div>

          <PasswordInput
            id="confirmPassword"
            label="Confirm new password"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }))
            }}
            error={errors.confirmPassword}
            required
          />

          {formError && (
            <p role="alert" className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {formError}
            </p>
          )}

          <Button type="submit" variant="primary" loading={loading} className="w-full justify-center">
            Reset password →
          </Button>
        </form>
      </div>
    </AuthLayout>
  )
}
