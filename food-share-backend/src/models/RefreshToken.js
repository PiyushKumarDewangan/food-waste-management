import mongoose from 'mongoose'

/**
 * Refresh tokens are stored HASHED, never in plaintext (see utils/hashToken.js).
 * This is what enables rotation ("one-time use") and revocation
 * ("log out everywhere") without trusting the JWT alone.
 */
const refreshTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    createdByIp: { type: String, default: null },
    revoked: { type: Boolean, default: false },
    revokedAt: { type: Date, default: null },
    replacedByTokenHash: { type: String, default: null },
  },
  { timestamps: true }
)

// MongoDB TTL index — automatically deletes expired documents.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema)
export default RefreshToken
