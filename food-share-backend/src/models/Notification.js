import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    user: {
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
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['request', 'order', 'delivery', 'expiry', 'system', 'impact', 'general', 'exchange', 'pickup', 'new_request', 'courier_update', 'exchange_completed'],
      default: 'general',
    },
    category: {
      type: String,
      enum: ['newFoodRequest', 'volunteerCourierUpdates', 'exchangeCompleted', 'general', 'system', 'other'],
      default: 'general',
      index: true,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    link: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
)

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 })

export const Notification = mongoose.model('Notification', notificationSchema)
export default Notification
