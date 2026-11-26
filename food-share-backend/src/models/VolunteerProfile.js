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

    // Operational & Duty Settings
    isOnDuty: { type: Boolean, default: true },
    emergencyContact: { type: String, trim: true, default: '' },
    operatingNeighborhood: { type: String, trim: true, default: '' },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    smartDispatch: { type: Boolean, default: true },

    // Notification Preferences
    notificationPreferences: {
      nearbyPickups: { type: Boolean, default: true },
      urgentExpiryAlerts: { type: Boolean, default: true },
      exchangeStatusUpdates: { type: Boolean, default: true },
      weeklyImpactDigest: { type: Boolean, default: true },
    },

    // Statistics and Impact
    totalDeliveriesCompleted: { type: Number, default: 0 },
    totalMealsDelivered: { type: Number, default: 0 },
    foodRescuedKg: { type: Number, default: 0 },
    co2PreventedKg: { type: Number, default: 0 },
    hoursVolunteered: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    totalReviewsCount: { type: Number, default: 0 },
    avatar: { type: String, default: '' },
  },
  { timestamps: true }
)

export const VolunteerProfile = mongoose.model('VolunteerProfile', volunteerProfileSchema)
export default VolunteerProfile
