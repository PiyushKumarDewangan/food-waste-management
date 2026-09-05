import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Leaf } from 'lucide-react'
import Input from '../ui/Input.jsx'
import PasswordInput from '../ui/PasswordInput.jsx'
import Checkbox from '../ui/Checkbox.jsx'
import Button from '../ui/Button.jsx'
import { validateIdentifier } from '../../utils/validation'
import authService from '../../services/authService'
import { useAuth } from '../../context/AuthContext.jsx'

const initialForm = { identifier: '', password: '', rememberMe: false }

export default function LoginForm() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const handleChange = (field) => (e) => {
    const value = field === 'rememberMe' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const nextErrors = {}
    const identifierError = validateIdentifier(form.identifier)
    if (identifierError) nextErrors.identifier = identifierError
    if (!form.password) nextErrors.password = 'Password is required.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!validate()) return

    setLoading(true)
    try {
      const loggedInUser = await login(form.identifier, form.password, form.rememberMe)
      navigate(loggedInUser?.role === 'admin' ? '/admin' : '/dashboard')
    } catch (err) {
      setFormError(err.message || 'Unable to log in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setFormError('')
    setLoading(true)
    try {
      await authService.googleLogin()
      navigate('/dashboard')
    } catch (err) {
      setFormError(err.message || 'Google sign-in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-card border border-borderc/60 px-8 py-9">
      <div className="flex flex-col items-center text-center mb-6">
        <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 mb-3">
          <Leaf className="w-5 h-5 text-primary" aria-hidden="true" />
        </span>
        <h1 className="text-xl font-bold text-ink">Welcome back</h1>
        <p className="text-sm text-gray-500 mt-1">Log in to continue making a difference.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          id="identifier"
          label="Email or phone number"
          icon={Mail}
          type="text"
          placeholder="you@example.com"
          value={form.identifier}
          onChange={handleChange('identifier')}
          error={errors.identifier}
          required
        />

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="text-sm font-medium text-ink">
              Password <span className="text-primary">*</span>
            </label>
            <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange('password')}
            error={errors.password}
          />
        </div>

        <Checkbox
          id="rememberMe"
          label="Remember me"
          checked={form.rememberMe}
          onChange={handleChange('rememberMe')}
        />

        {formError && (
          <p role="alert" className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {formError}
          </p>
        )}

        <Button type="submit" variant="primary" className="w-full justify-center" loading={loading}>
          Log in →
        </Button>

        <div className="relative flex items-center py-1">
          <span className="flex-1 h-px bg-borderc" />
          <span className="px-3 text-xs text-gray-400">or</span>
          <span className="flex-1 h-px bg-borderc" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full justify-center"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <GoogleIcon className="w-4 h-4" />
          Continue with Google
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Don&apos;t have an account?{' '}
        <Link to="/register/account" className="text-primary font-semibold hover:underline">
          Create account
        </Link>
      </p>
    </div>
  )
}

function GoogleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29A11.96 11.96 0 000 12c0 1.94.46 3.77 1.29 5.38l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  )
}
