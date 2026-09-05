import mongoose from 'mongoose'

const receiverProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    organizationName: { type: String, required: true, trim: true },
    contactPerson: { type: String, required: true, trim: true },
    organizationAddress: { type: String, required: true, trim: true },
    storageCapacity: { type: String, required: true, trim: true },
    operatingHours: { type: String, required: true, trim: true },

    verificationDocumentUrl: { type: String, default: null },
    verificationDocumentOriginalName: { type: String, default: null },

    // Admin review workflow
    reviewStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },

    // Placeholder fields for the future receiver dashboard.
    totalDonationsReceived: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export const ReceiverProfile = mongoose.model('ReceiverProfile', receiverProfileSchema)
export default ReceiverProfile
