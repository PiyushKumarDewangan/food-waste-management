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

    // Extended Receiver Dashboard Fields
    taxId: { type: String, default: '84-2948102' },
    isVerified: { type: Boolean, default: true },
    verifiedDate: { type: String, default: 'Nov 1, 2023' },
    phone: { type: String, default: '+1 (555) 280-4400' },
    email: { type: String, default: 'contact@hopeharbor.org' },
    website: { type: String, default: '' },
    dropoffAddress: { type: String, default: '87 Elm Street, Downtown, CA 90210' },
    about: { type: String, default: '' },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },

    capacity: {
      storageTypes: {
        type: [String],
        default: ['refrigerated', 'dry'],
      },
      maxServingsPerPickup: { type: Number, default: 100 },
      peopleServedPerDay: { type: Number, default: 150 },
      preferredPickupWindows: {
        type: [String],
        default: ['Morning (09:00 - 12:00)', 'Afternoon (12:00 - 16:00)'],
      },
      vehicleAvailable: { type: Boolean, default: true },
    },

    dietaryPrefs: {
      type: [String],
      default: ['Halal', 'Vegetarian', 'Vegan', 'Gluten-Free'],
    },
    preferredCategories: {
      type: [String],
      default: ['Cooked Meals', 'Fresh Produce', 'Bakery', 'Dairy & Eggs', 'Packaged Goods'],
    },

    notificationPrefs: {
      newFoodAvailable: { type: Boolean, default: true },
      requestStatusUpdates: { type: Boolean, default: true },
      deliveryAlerts: { type: Boolean, default: true },
      urgentExpiryAlerts: { type: Boolean, default: true },
      weeklyImpactDigest: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
)

export const ReceiverProfile = mongoose.model('ReceiverProfile', receiverProfileSchema)
export default ReceiverProfile
