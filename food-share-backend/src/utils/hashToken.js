import crypto from 'crypto'

/**
 * Refresh tokens are stored in MongoDB HASHED (sha256), never in plaintext.
 * If the database were ever leaked, the stored values alone could not be
 * replayed as valid refresh tokens.
 */
// "Take a token string, convert it into a secure SHA-256 hash, and return that hash as a hexadecimal string so it can be safely stored and compared later."
// This function is commonly used for security, especially for password reset tokens, email verification tokens, and refresh tokens.

export function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex')
}
