// Reusable, framework-agnostic validation helpers.
// Every function returns a string error message, or '' when the value is valid.

export function validateRequired(value, fieldLabel = 'This field') {
  if (value === null || value === undefined) return `${fieldLabel} is required.`
  if (typeof value === 'string' && value.trim() === '') return `${fieldLabel} is required.`
  if (Array.isArray(value) && value.length === 0) return `${fieldLabel} is required.`
  return ''
}

export function validateEmail(value) {
  if (!value) return 'Email address is required.'
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(value)) return 'Enter a valid email address.'
  return ''
}

// Accepts an "identifier" that can be an email OR a phone number.
export function validateIdentifier(value) {
  if (!value || value.trim() === '') return 'Email or phone number is required.'
  const isEmailLike = value.includes('@')
  if (isEmailLike) return validateEmail(value)
  return validatePhone(value)
}

export function validatePhone(value) {
  if (!value || value.trim() === '') return 'Phone number is required.'
  const digitsOnly = value.replace(/[\s-]/g, '')
  const phoneRegex = /^[0-9]{6,12}$/
  if (!phoneRegex.test(digitsOnly)) return 'Enter a valid phone number.'
  return ''
}

export function validatePassword(value) {
  if (!value) return 'Password is required.'
  if (value.length < 8) return 'Password must be at least 8 characters.'
  return ''
}

export function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword) return 'Please confirm your password.'
  if (password !== confirmPassword) return 'Passwords do not match.'
  return ''
}

export function validateChecked(value, message = 'You must accept this to continue.') {
  return value ? '' : message
}

export function validateFile(file, { allowedTypes = [], maxSizeBytes = Infinity } = {}) {
  if (!file) return ''
  if (allowedTypes.length && !allowedTypes.includes(file.type)) {
    return 'Unsupported file type. Please upload a PDF, JPG, JPEG or PNG file.'
  }
  if (file.size > maxSizeBytes) {
    const maxMb = Math.round(maxSizeBytes / (1024 * 1024))
    return `File is too large. Maximum size is ${maxMb}MB.`
  }
  return ''
}

// Runs a map of { field: validatorFn } against a values object.
// Returns an errors object containing only the fields that failed.
export function runValidators(values, validatorMap) {
  const errors = {}
  Object.entries(validatorMap).forEach(([field, validator]) => {
    const error = validator(values[field], values)
    if (error) errors[field] = error
  })
  return errors
}
