import mongoose from 'mongoose'

const donorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    donorType: {
      type: String,
      enum: ['individual', 'business'],
      default: 'individual',
    },
    organizationName: { type: String, trim: true, default: '' },
    pickupAddress: { type: String, required: true, trim: true },
    pickupAvailability: { type: String, required: true, trim: true },
    foodSafetyAccepted: { type: Boolean, required: true, default: false },

    // Placeholder fields for the future donor dashboard.
    totalDonationsPosted: { type: Number, default: 0 },
    totalMealsShared: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export const DonorProfile = mongoose.model('DonorProfile', donorProfileSchema)
export default DonorProfile
