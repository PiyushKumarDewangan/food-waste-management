/**
 * Timezone-safe date, time, and countdown utilities for FoodShare.
 * Formats dates and times in Indian Standard Time (Asia/Kolkata).
 */

/**
 * Format a timestamp into an IST date string.
 * e.g. "Oct 26, 2026" or "Oct 26"
 */
export function formatDateIST(dateStr, options = {}) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''

  const defaultOptions = {
    timeZone: 'Asia/Kolkata',
    month: 'short',
    day: 'numeric',
    ...options,
  }

  return new Intl.DateTimeFormat('en-IN', defaultOptions).format(date)
}

/**
 * Format a timestamp into an IST time string.
 * e.g. "1:30 PM"
 */
export function formatTimeIST(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

/**
 * Format a full IST date and time string.
 * e.g. "Oct 27, 2026 — 1:30 PM"
 */
export function formatDateTimeIST(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''

  const datePart = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)

  const timePart = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)

  return `${datePart} — ${timePart}`
}

/**
 * Calculates human-friendly real-time countdown for food expiry.
 * Formula: Remaining Time = Stored Expiry Timestamp − Current Time
 *
 * Expected examples:
 * - diffMs <= 0: "Expired"
 * - 21h 0m: "Expires in 21h"
 * - 9h 0m: "Expires in 9h"
 * - 2h 30m: "Expires in 2h 30m"
 * - 0h 45m: "Expires in 45m"
 * - 0h 1m: "Expires in 1m"
 *
 * @param {string|Date|number} expiryDate - Stored expiry timestamp
 * @param {number|Date} [now=Date.now()] - Current real clock timestamp
 * @returns {object|null}
 */
export function getExpiryCountdown(expiryDate, now = Date.now()) {
  if (!expiryDate) return null

  const target = new Date(expiryDate).getTime()
  if (isNaN(target)) return null

  const current = typeof now === 'number' ? now : new Date(now).getTime()
  const diffMs = target - current

  if (diffMs <= 0) {
    return {
      label: 'Expired',
      isExpired: true,
      urgency: 'expired',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
      dotClass: 'bg-rose-500',
      diffMs: 0,
      diffHours: 0,
      diffMinutes: 0,
      diffDays: 0,
    }
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = totalMinutes % 60
  const diffDays = Math.floor(diffHours / 24)

  let label = ''
  if (diffDays > 0) {
    const remHours = diffHours % 24
    label = remHours > 0 ? `Expires in ${diffDays}d ${remHours}h` : `Expires in ${diffDays}d`
  } else if (diffHours > 0) {
    label = diffMinutes > 0 ? `Expires in ${diffHours}h ${diffMinutes}m` : `Expires in ${diffHours}h`
  } else {
    label = `Expires in ${Math.max(1, diffMinutes)}m`
  }

  let badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200/70 font-medium'
  let dotClass = 'bg-emerald-500'
  let urgency = 'normal'

  if (diffHours < 1) {
    urgency = 'critical'
    badgeClass = 'bg-red-100 text-red-800 border-red-300 font-bold animate-pulse'
    dotClass = 'bg-red-600'
  } else if (diffHours < 6) {
    urgency = 'urgent'
    badgeClass = 'bg-rose-50 text-rose-700 border-rose-200 font-semibold'
    dotClass = 'bg-rose-500'
  } else if (diffHours < 24) {
    urgency = 'warning'
    badgeClass = 'bg-amber-50 text-amber-800 border-amber-200 font-semibold'
    dotClass = 'bg-amber-500'
  }

  return {
    label,
    isExpired: false,
    urgency,
    badgeClass,
    dotClass,
    diffMs,
    diffHours,
    diffMinutes,
    diffDays,
  }
}

/**
 * Determines exact donation display status based on strict business rules:
 *
 * Priority 1: Completed
 *   -> Show ONLY "Completed". Never show expiry countdown, expiry badge, or "Expired".
 * Priority 2: Available + expiry time remaining
 *   -> Show "Available" badge + "Expires in X" countdown pill.
 * Priority 3: Expiry reached + not completed
 *   -> Show ONLY "Expired". Never show positive countdown or "Available".
 *
 * @param {object} item - Donation item
 * @param {number|Date} [now=Date.now()] - Current real clock
 * @returns {object} Status display configuration
 */
export function getDonationDisplayStatus(item, now = Date.now()) {
  if (!item) {
    return {
      status: 'unknown',
      badgeText: 'Unknown',
      badgeClass: 'bg-gray-100 text-gray-600',
      showCountdown: false,
      showExpiryBadge: false,
      isExpired: false,
      countdownLabel: '',
    }
  }

  const statusLower = (item.status || '').toLowerCase()

  // Rule 1: Completed ALWAYS overrides expiry. Show ONLY Completed.
  if (statusLower === 'completed') {
    return {
      status: 'completed',
      badgeText: 'Completed',
      badgeClass: 'bg-gray-100 text-gray-700 border border-gray-200',
      showCountdown: false,
      showExpiryBadge: false,
      isExpired: false,
      countdownLabel: '',
    }
  }

  // Check stored expiry timestamp
  const expiryTimestamp = item.expiresAt || item.bestBefore
  const expiry = getExpiryCountdown(expiryTimestamp, now)
  const isExpired = statusLower === 'expired' || (expiry?.isExpired ?? false)

  // Rule 3: Expiry reached and not completed -> Show Expired
  if (isExpired) {
    return {
      status: 'expired',
      badgeText: 'Expired',
      badgeClass: 'bg-red-50 text-red-700 border border-red-200',
      showCountdown: false,
      showExpiryBadge: false,
      isExpired: true,
      countdownLabel: 'Expired',
    }
  }

  // Rule 2: Available with time remaining -> Show Available + Expires in X
  if (statusLower === 'available') {
    return {
      status: 'available',
      badgeText: 'Available',
      badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
      showCountdown: Boolean(expiry?.label),
      showExpiryBadge: true,
      isExpired: false,
      countdownLabel: expiry?.label || '',
      expiryBadgeClass: expiry?.badgeClass || '',
      expiryDotClass: expiry?.dotClass || '',
    }
  }

  // Other active exchange statuses (Requested, Claimed, Cancelled)
  if (statusLower === 'requested') {
    return {
      status: 'requested',
      badgeText: 'Requested',
      badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200/60',
      showCountdown: false,
      showExpiryBadge: false,
      isExpired: false,
      countdownLabel: '',
    }
  }

  if (statusLower === 'claimed') {
    return {
      status: 'claimed',
      badgeText: 'Claimed',
      badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200/60',
      showCountdown: false,
      showExpiryBadge: false,
      isExpired: false,
      countdownLabel: '',
    }
  }

  return {
    status: statusLower,
    badgeText: item.status || 'Unknown',
    badgeClass: 'bg-gray-100 text-gray-600',
    showCountdown: false,
    showExpiryBadge: false,
    isExpired: false,
    countdownLabel: '',
  }
}
