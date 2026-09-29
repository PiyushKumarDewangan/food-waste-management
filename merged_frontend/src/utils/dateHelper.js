/**
 * Calculates human-friendly countdown and urgency badges for food best-before dates.
 */
export function getExpiryCountdown(bestBeforeDate) {
  if (!bestBeforeDate) return null

  const target = new Date(bestBeforeDate).getTime()
  if (isNaN(target)) return null

  const now = Date.now()
  const diffMs = target - now

  if (diffMs <= 0) {
    return {
      label: 'Expired',
      urgency: 'expired',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
      dotClass: 'bg-rose-500',
      isUrgent: true,
      diffHours: 0,
      diffDays: 0,
    }
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) {
    return {
      label: `Expires in ${Math.max(1, diffMinutes)}m`,
      urgency: 'critical',
      badgeClass: 'bg-red-100 text-red-800 border-red-300 animate-pulse font-bold',
      dotClass: 'bg-red-600',
      isUrgent: true,
      diffHours,
      diffDays: 0,
    }
  }

  if (diffHours < 6) {
    return {
      label: `Expires in ${diffHours}h ${diffMinutes}m`,
      urgency: 'urgent',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/90 font-semibold',
      dotClass: 'bg-rose-500',
      isUrgent: true,
      diffHours,
      diffDays: 0,
    }
  }

  if (diffHours < 24) {
    return {
      label: `Expires in ${diffHours}h`,
      urgency: 'warning',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/80 font-semibold',
      dotClass: 'bg-amber-500',
      isUrgent: true,
      diffHours,
      diffDays: 0,
    }
  }

  if (diffDays === 1) {
    return {
      label: 'Expires tomorrow',
      urgency: 'warning',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/60 font-medium',
      dotClass: 'bg-amber-400',
      isUrgent: false,
      diffHours,
      diffDays: 1,
    }
  }

  return {
    label: `Expires in ${diffDays} days`,
    urgency: 'normal',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/70 font-medium',
    dotClass: 'bg-emerald-500',
    isUrgent: false,
    diffHours,
    diffDays,
  }
}
