import mongoose from 'mongoose'

/**
 * Core auth/identity collection — shared by every role. Role-specific
 * fields live in their own linked collection (DonorProfile, ReceiverProfile,
 * VolunteerProfile) so this schema stays lean and auth-focused.
 */
const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never returned by default on .find()/.findOne()
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['donor', 'receiver', 'volunteer', 'admin'],
      required: true,
      index: true,
    },

    // Donor accounts are auto-verified on signup (per product spec).
    // Receiver/volunteer accounts start pending until an admin approves them.
    status: {
      type: String,
      enum: ['active', 'pending_review', 'suspended', 'rejected'],
      default: 'active',
      index: true,
    },

    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },

    // Google OAuth support
    googleId: { type: String, default: null, index: true, sparse: true },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },

    // Password reset
    passwordResetTokenHash: { type: String, default: null, select: false },
    passwordResetExpires: { type: Date, default: null, select: false },

    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
)

// Never leak sensitive fields even if a stray query forgets to .select('-passwordHash')
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject()
  delete obj.passwordHash
  delete obj.passwordResetTokenHash
  delete obj.passwordResetExpires
  delete obj.__v
  return obj
}

export const User = mongoose.model('User', userSchema)
export default User
