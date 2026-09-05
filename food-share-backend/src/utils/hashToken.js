import crypto from 'crypto'

/**
 * Refresh tokens are stored in MongoDB HASHED (sha256), never in plaintext.
 * If the database were ever leaked, the stored values alone could not be
 * replayed as valid refresh tokens.
 */
export function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex')
}
