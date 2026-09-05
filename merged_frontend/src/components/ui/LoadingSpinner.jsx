import { Loader2 } from 'lucide-react'

export default function LoadingSpinner({ size = 'w-6 h-6', className = '' }) {
  return (
    <Loader2 className={`${size} animate-spin text-primary ${className}`} aria-label="Loading" />
  )
}
