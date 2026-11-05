import mongoose from 'mongoose'

const orderIssueSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exchange',
      required: true,
      index: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    issueType: {
      type: String,
      required: true,
      enum: [
        'late_delivery',
        'damaged_food',
        'missing_items',
        'incorrect_quantity',
        'unresponsive_courier',
        'quality_safety_concern',
        'other',
      ],
      default: 'other',
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    photoUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['open', 'in_review', 'resolved'],
      default: 'open',
      index: true,
    },
  },
  { timestamps: true }
)

export const OrderIssue = mongoose.model('OrderIssue', orderIssueSchema)
export default OrderIssue
