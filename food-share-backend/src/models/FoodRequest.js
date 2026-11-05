import mongoose from 'mongoose'

const foodRequestSchema = new mongoose.Schema(
  {
    donation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodDonation',
      required: true,
      index: true,
    },
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    receiverName: {
      type: String,
      trim: true,
      default: '',
    },
    receiverOrganization: {
      type: String,
      trim: true,
      default: '',
    },
    receiverExchangesCount: {
      type: Number,
      default: 0,
    },
    receiverPhone: {
      type: String,
      trim: true,
      default: '',
    },
    receiverAvatar: {
      type: String,
      default: '',
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    requestedQuantity: {
      type: Number,
      default: 1,
    },
    requestedUnit: {
      type: String,
      default: 'Servings',
    },
    deliveryPreference: {
      type: String,
      enum: ['volunteer_delivery', 'direct_pickup'],
      default: 'volunteer_delivery',
    },
    deliveryMethod: {
      type: String,
      enum: ['volunteer_delivery', 'direct_pickup'],
      default: 'volunteer_delivery',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'approved', 'declined', 'cancelled'],
      default: 'pending',
      index: true,
    },
    preferredDate: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
)

export const FoodRequest = mongoose.model('FoodRequest', foodRequestSchema)
export default FoodRequest
