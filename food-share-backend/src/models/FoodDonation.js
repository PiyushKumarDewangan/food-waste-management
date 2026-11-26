import mongoose from 'mongoose'

const foodDonationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Cooked Meal',
        'Cooked Meals',
        'Bakery',
        'Fresh Produce',
        'Dairy & Eggs',
        'Packaged & Canned',
        'Packaged Goods',
        'Beverages & Other',
        'Beverages',
        'Other',
      ],
      default: 'Cooked Meals',
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    initialQuantity: {
      type: Number,
      default: null,
    },
    unit: {
      type: String,
      required: true,
      default: 'Servings',
    },
    bestBefore: {
      type: Date,
      required: true,
    },
    pickupAddress: {
      type: String,
      required: true,
      trim: true,
    },
    pickupWindow: {
      type: String,
      required: true,
      trim: true,
    },
    pickupInstructions: {
      type: String,
      trim: true,
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['available', 'requested', 'claimed', 'completed', 'cancelled', 'expired'],
      default: 'available',
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    foodSafetyAccepted: {
      type: Boolean,
      required: true,
      default: true,
    },
    interestedCount: {
      type: Number,
      default: 0,
    },
    // Extended fields for Receiver dashboard
    dietary: [
      {
        type: String,
        trim: true,
      },
    ],
    deliveryOptions: {
      type: [String],
      default: ['volunteer', 'direct'],
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    servings: {
      type: Number,
      default: null,
    },
    donorName: {
      type: String,
      default: '',
      trim: true,
    },
    donorOrganization: {
      type: String,
      default: '',
      trim: true,
    },
    lat: {
      type: Number,
      default: null,
    },
    lng: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
)

export const FoodDonation = mongoose.model('FoodDonation', foodDonationSchema)
export default FoodDonation
