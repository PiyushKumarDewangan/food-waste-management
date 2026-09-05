import { getPasswordStrength } from '../../utils/passwordStrength'

const levelStyles = {
  empty: { bars: 0, color: 'bg-gray-200', text: 'text-gray-400' },
  weak: { bars: 1, color: 'bg-red-400', text: 'text-red-500' },
  medium: { bars: 2, color: 'bg-accent', text: 'text-accent' },
  strong: { bars: 4, color: 'bg-primary', text: 'text-primary' },
}

export default function PasswordStrength({ password }) {
  const { level, label } = getPasswordStrength(password)
  const style = levelStyles[level] || levelStyles.empty

  if (!password) return null

  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < style.bars ? style.color : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      {label && <p className={`mt-1 text-xs font-medium ${style.text}`}>{label} password</p>}
    </div>
  )
}
