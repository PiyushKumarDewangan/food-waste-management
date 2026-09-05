import { CheckCircle2, Clock } from 'lucide-react'

/**
 * variant: 'success' | 'pending'
 */
export default function StatusBadge({ variant = 'pending', children }) {
  const isSuccess = variant === 'success'
  const Icon = isSuccess ? CheckCircle2 : Clock

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
        isSuccess ? 'bg-primary/10 text-primary' : 'bg-accent/15 text-accent'
      }`}
    >
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      {children}
    </span>
  )
}
