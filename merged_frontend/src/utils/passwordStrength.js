// Very small, dependency-free password-strength estimator.
// Returns { score (0-4), level ('weak'|'medium'|'strong'|'empty'), label, tips[] }

export function getPasswordStrength(password = '') {
  let score = 0
  const tips = []

  if (password.length >= 8) score += 1
  else tips.push('Use at least 8 characters')

  if (/[A-Z]/.test(password)) score += 1
  else tips.push('Add an uppercase letter')

  if (/[0-9]/.test(password)) score += 1
  else tips.push('Add a number')

  if (/[^A-Za-z0-9]/.test(password)) score += 1
  else tips.push('Add a special character')

  let level = 'weak'
  let label = 'Weak'

  if (password.length === 0) {
    level = 'empty'
    label = ''
  } else if (score >= 4) {
    level = 'strong'
    label = 'Strong'
  } else if (score >= 2) {
    level = 'medium'
    label = 'Medium'
  } else {
    level = 'weak'
    label = 'Weak'
  }

  return { score, level, label, tips }
}
