import { Loader2 } from 'lucide-react'

/**
 * variant: 'primary' | 'secondary' | 'outline' | 'ghost'
 */
export default function Button({
  children,
  variant = 'primary',
  type = 'button',
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'right',
  className = '',
  ...rest
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-sm px-5 py-3 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark shadow-soft',
    secondary: 'bg-secondary text-white hover:bg-secondary/90',
    outline: 'bg-white text-ink border border-borderc hover:bg-gray-50',
    ghost: 'bg-transparent text-primary hover:bg-primary/5',
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${className}`}
      {...rest}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
      {!loading && Icon && iconPosition === 'left' && <Icon className="w-4 h-4" aria-hidden="true" />}
      <span>{children}</span>
      {!loading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4" aria-hidden="true" />}
    </button>
  )
}
