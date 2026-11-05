import dns from 'node:dns'
dns.setServers(['8.8.8.8', '8.8.4.4'])
import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

import { FoodRequest } from '../src/models/FoodRequest.js'
import { Exchange } from '../src/models/Exchange.js'
import { FoodDonation } from '../src/models/FoodDonation.js'
import { VolunteerProfile } from '../src/models/VolunteerProfile.js'
import { User } from '../src/models/User.js'

async function run() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected to MongoDB')

  const acceptedRequests = await FoodRequest.find({ status: 'accepted' }).populate('donation')
  console.log(`Found ${acceptedRequests.length} accepted requests`)

  let repaired = 0
  for (const req of acceptedRequests) {
    const existing = await Exchange.findOne({ request: req._id })
    if (existing) {
      console.log(`Request ${req._id} already has exchange ${existing._id}`)
      continue
    }

    if (!req.donation) {
      console.log(`Request ${req._id} has no valid donation attached (donation was deleted). Skipping or cancelling.`)
      req.status = 'cancelled'
      await req.save()
      continue
    }

    console.log(`Repairing missing exchange for request ${req._id} (${req.receiverName}) - Food: ${req.donation.title}...`)

    const deliveryType =
      req.deliveryPreference === 'direct_pickup' || req.deliveryMethod === 'direct_pickup'
        ? 'direct_pickup'
        : 'volunteer_delivery'

    const pickupCode = Math.floor(1000 + Math.random() * 9000).toString()

    const exchangeData = {
      donation: req.donation._id,
      request: req._id,
      donor: req.donor,
      receiver: req.receiver,
      receiverInfo: {
        name: req.receiverName || 'Receiver',
        phone: req.receiverPhone || '',
        organization: req.receiverOrganization || '',
        exchangesCount: req.receiverExchangesCount || 0,
      },
      deliveryType,
      pickupCode,
      pickupAddress: req.donation.pickupAddress || 'Donor Pickup Location',
      pickupWindow: req.donation.pickupWindow || 'Flexible',
    }

    if (deliveryType === 'direct_pickup') {
      exchangeData.volunteer = null
      exchangeData.volunteerInfo = {
        name: '',
        phone: '',
        rating: 0,
        transportType: 'walking',
        vehicleNumber: '',
        deliveriesCompleted: 0,
      }
      exchangeData.volunteerStatus = 'not_needed'
      exchangeData.status = 'ready_for_pickup'
      exchangeData.stage = 1
      exchangeData.timeline = [
        {
          step: 'accepted',
          title: 'Request Approved (Direct Receiver Pickup)',
          time: req.updatedAt || new Date(),
          actor: 'Donor',
          note: `Donor approved direct receiver collection for ${req.requestedQuantity} ${req.requestedUnit}.`,
        },
        {
          step: 'ready_for_pickup',
          title: 'Ready for Collection',
          time: new Date(),
          actor: 'Donor',
          note: `Food is ready for collection at ${exchangeData.pickupAddress}.`,
        },
      ]
    } else {
      exchangeData.volunteer = null
      exchangeData.volunteerInfo = {
        name: 'Searching for Courier...',
        phone: '',
        rating: 0,
        transportType: 'other',
        vehicleNumber: '',
        deliveriesCompleted: 0,
      }
      exchangeData.volunteerStatus = 'searching_volunteer'
      exchangeData.status = 'accepted'
      exchangeData.stage = 1
      exchangeData.timeline = [
        {
          step: 'accepted',
          title: 'Donor Approved (Searching for Volunteer Courier)',
          time: req.updatedAt || new Date(),
          actor: 'Donor',
          note: `Donor approved delivery for ${req.requestedQuantity} ${req.requestedUnit}. System searching for volunteer courier.`,
        },
      ]
    }

    const created = await Exchange.create(exchangeData)
    console.log(`Created exchange ${created._id} for request ${req._id}`)
    repaired++
  }

  console.log(`Repair completed. Repaired ${repaired} orphan exchanges.`)
  await mongoose.disconnect()
  process.exit(0)
}

run().catch((err) => {
  console.error('Repair error:', err)
  process.exit(1)
})
