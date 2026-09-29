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
        'Bakery',
        'Fresh Produce',
        'Dairy & Eggs',
        'Packaged & Canned',
        'Beverages',
        'Other',
      ],
      default: 'Cooked Meal',
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
      min: 1,
    },
    unit: {
      type: String,
      required: true,
      default: 'servings',
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
      enum: ['available', 'requested', 'claimed', 'completed', 'cancelled'],
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
  },
  { timestamps: true }
)

export const FoodDonation = mongoose.model('FoodDonation', foodDonationSchema)
export default FoodDonation
