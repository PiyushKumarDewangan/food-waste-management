import mongoose from 'mongoose'

const timelineEntrySchema = new mongoose.Schema(
  {
    step: {
      type: String,
      required: true,
      enum: [
        'accepted',
        'ready_for_pickup',
        'searching_for_volunteer',
        'volunteer_assigned',
        'picked_up_by_volunteer',
        'picked_up',
        'out_for_delivery',
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
      rating: { type: Number, default: 5.0 },
      transportType: {
        type: String,
        enum: ['walking', 'bicycle', 'motorcycle', 'car', 'electric_bike', 'Electric Bike', 'other'],
        default: 'car',
      },
      vehicleNumber: { type: String, default: '' },
      deliveriesCompleted: { type: Number, default: 0 },
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
        'not_needed',
        'none',
      ],
      default: 'none',
    },
    status: {
      type: String,
      enum: [
        'accepted',
        'ready_for_pickup',
        'searching_for_volunteer',
        'volunteer_assigned',
        'picked_up_by_volunteer',
        'picked_up',
        'out_for_delivery',
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
    pickupCoords: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    dropoffCoords: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    volunteerCoords: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      heading: { type: Number, default: null },
      updatedAt: { type: Date, default: null },
    },
    scheduledDate: {
      type: String,
      default: '',
    },
    donorConfirmedReady: {
      type: Boolean,
      default: false,
    },
    // Pickup Code (Donor -> Volunteer OR Donor -> Receiver)
    pickupCode: {
      type: String,
      default: () => Math.floor(1000 + Math.random() * 9000).toString(),
    },
    // Delivery Code (Volunteer -> Receiver; null for direct pickup)
    deliveryCode: {
      type: String,
      default: null,
    },
    pickedUpAt: {
      type: Date,
      default: null,
    },
    pickedUpBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    deliveredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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
      submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      role: { type: String, enum: ['donor', 'receiver', 'volunteer', ''], default: '' },
    },
    donorFeedback: {
      rating: { type: Number, default: null },
      comment: { type: String, default: '' },
      submittedAt: { type: Date, default: null },
    },
    receiverFeedback: {
      rating: { type: Number, default: null },
      comment: { type: String, default: '' },
      submittedAt: { type: Date, default: null },
    },
    receiverToDonorFeedback: {
      rating: { type: Number, default: null },
      comment: { type: String, default: '' },
      submittedAt: { type: Date, default: null },
    },
    receiverToVolunteerFeedback: {
      rating: { type: Number, default: null },
      comment: { type: String, default: '' },
      submittedAt: { type: Date, default: null },
    },
    // Extended fields for Receiver Order Tracking
    orderNo: {
      type: String,
      default: () => `FD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
      index: true,
    },
    stage: {
      type: Number,
      min: 1,
      max: 5,
      default: 1,
    },
    eta: {
      type: String,
      default: '~15 minutes',
    },
    courierPhone: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
)

export const Exchange = mongoose.model('Exchange', exchangeSchema)
export default Exchange
