import mongoose from 'mongoose'

const timelineEntrySchema = new mongoose.Schema(
  {
    step: {
      type: String,
      required: true,
      enum: [
        'accepted',
        'ready_for_pickup',
        'volunteer_assigned',
        'picked_up',
        'in_transit',
        'completed',
        'cancelled',
      ],
    },
    title: {
      type: String,
      required: true,
    },
    time: {
      type: Date,
      default: Date.now,
    },
    actor: {
      type: String,
      enum: ['Donor', 'Receiver', 'Volunteer', 'System'],
      default: 'System',
    },
    note: {
      type: String,
      default: '',
    },
  },
  { _id: false }
)

const exchangeSchema = new mongoose.Schema(
  {
    donation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodDonation',
      required: true,
      index: true,
    },
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodRequest',
      required: true,
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
    receiverInfo: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      avatar: { type: String, default: '' },
      organization: { type: String, default: '' },
      exchangesCount: { type: Number, default: 0 },
    },
    deliveryType: {
      type: String,
      enum: ['volunteer_delivery', 'direct_pickup'],
      default: 'volunteer_delivery',
      index: true,
    },
    // Volunteer information — vital for the 3-role ecosystem
    volunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    volunteerInfo: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      avatar: { type: String, default: '' },
      rating: { type: Number, default: 4.9 },
      transportType: {
        type: String,
        enum: ['walking', 'bicycle', 'motorcycle', 'car', 'other'],
        default: 'car',
      },
      vehicleNumber: { type: String, default: '' },
      deliveriesCompleted: { type: Number, default: 15 },
    },
    volunteerStatus: {
      type: String,
      enum: [
        'searching_volunteer',
        'assigned',
        'en_route_to_pickup',
        'at_pickup',
        'picked_up',
        'in_transit',
        'delivered',
      ],
      default: 'assigned',
    },
    status: {
      type: String,
      enum: [
        'accepted',
        'ready_for_pickup',
        'volunteer_assigned',
        'picked_up',
        'in_transit',
        'completed',
        'cancelled',
      ],
      default: 'accepted',
      index: true,
    },
    pickupAddress: {
      type: String,
      required: true,
    },
    pickupWindow: {
      type: String,
      default: '',
    },
    dropoffAddress: {
      type: String,
      default: '',
    },
    scheduledDate: {
      type: String,
      default: '',
    },
    donorConfirmedReady: {
      type: Boolean,
      default: false,
    },
    pickupCode: {
      type: String,
      default: () => Math.floor(1000 + Math.random() * 9000).toString(),
    },
    handoverConfirmed: {
      type: Boolean,
      default: false,
    },
    handoverCodeEntered: {
      type: String,
      default: '',
    },
    timeline: [timelineEntrySchema],
    feedback: {
      rating: { type: Number, default: null },
      comment: { type: String, default: '' },
      submittedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
)

export const Exchange = mongoose.model('Exchange', exchangeSchema)
export default Exchange
