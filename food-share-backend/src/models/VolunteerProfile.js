import mongoose from 'mongoose'

const volunteerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    availableDays: [
      {
        type: String,
        enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      },
    ],
    preferredTime: { type: String, required: true, trim: true },
    serviceRadius: { type: String, required: true, trim: true },
    transportType: {
      type: String,
      enum: ['walking', 'bicycle', 'motorcycle', 'car', 'other'],
      required: true,
    },
    vehicleNumber: { type: String, trim: true, default: '' },
    guidelinesAccepted: { type: Boolean, required: true, default: false },

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

    // Placeholder fields for the future volunteer dashboard.
    totalDeliveriesCompleted: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export const VolunteerProfile = mongoose.model('VolunteerProfile', volunteerProfileSchema)
export default VolunteerProfile
