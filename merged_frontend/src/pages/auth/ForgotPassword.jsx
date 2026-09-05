import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft } from 'lucide-react'
import AuthLayout from '../../components/layout/AuthLayout.jsx'
import Input from '../../components/ui/Input.jsx'
import Button from '../../components/ui/Button.jsx'
import { validateEmail } from '../../utils/validation'
import authService from '../../services/authService'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const emailError = validateEmail(email)
    if (emailError) {
      setError(emailError)
      return
    }
    setError('')
    setLoading(true)
    try {
      await authService.forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout mode="login">
      <div className="bg-white rounded-2xl shadow-card border border-borderc/60 px-8 py-9">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary mb-5">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to login
        </Link>

        {sent ? (
          <>
            <h1 className="text-xl font-bold text-ink">Check your email</h1>
            <p className="text-sm text-gray-500 mt-2">
              If an account exists for {email}, we&apos;ve sent instructions to reset your password.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-ink">Forgot your password?</h1>
            <p className="text-sm text-gray-500 mt-1 mb-6">
              Enter your email and we&apos;ll send you reset instructions.
            </p>
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <Input
                id="forgotEmail"
                label="Email address"
                icon={Mail}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (error) setError('')
                }}
                error={error}
                required
              />
              <Button type="submit" variant="primary" loading={loading} className="w-full justify-center">
                Send reset link →
              </Button>
            </form>
          </>
        )}
      </div>
    </AuthLayout>
  )
}
