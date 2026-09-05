import AuthLayout from '../../components/layout/AuthLayout.jsx'
import LoginForm from '../../components/auth/LoginForm.jsx'

export default function Login() {
  return (
    <AuthLayout mode="login">
      <LoginForm />
    </AuthLayout>
  )
}
