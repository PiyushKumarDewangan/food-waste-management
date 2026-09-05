import { useNavigate } from 'react-router-dom'
import { Package, Users, Bike } from 'lucide-react'
import Button from '../ui/Button.jsx'
import RoleCard from '../ui/RoleCard.jsx'
import { useRegistration } from '../../context/RegistrationContext.jsx'
import { ROLE_OPTIONS } from '../../utils/constants'

const ICONS = {
  donor: Package,
  receiver: Users,
  volunteer: Bike,
}

export default function RoleSelection() {
  const navigate = useNavigate()
  const { data, updateFields, markStepComplete } = useRegistration()

  const handleSelect = (roleValue) => updateFields({ role: roleValue })

  const handleContinue = () => {
    if (!data.role) return
    markStepComplete('role')
    navigate('/register/details')
  }

  const handleBack = () => navigate('/register/account')

  return (
    <div className="bg-white rounded-2xl shadow-card border border-borderc/60 px-8 py-9">
      <h1 className="text-xl font-bold text-ink">How would you like to contribute?</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Choose the role that best describes you. You can add another role later.
      </p>

      <div role="radiogroup" aria-label="Select your role" className="space-y-3">
        {ROLE_OPTIONS.map((role) => (
          <RoleCard
            key={role.value}
            icon={ICONS[role.value]}
            title={role.title}
            description={role.description}
            selected={data.role === role.value}
            onSelect={() => handleSelect(role.value)}
          />
        ))}
      </div>

      <div className="flex gap-3 mt-7">
        <Button type="button" variant="outline" onClick={handleBack} className="flex-1 justify-center">
          ← Back
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleContinue}
          disabled={!data.role}
          className="flex-1 justify-center"
        >
          Continue →
        </Button>
      </div>
    </div>
  )
}
