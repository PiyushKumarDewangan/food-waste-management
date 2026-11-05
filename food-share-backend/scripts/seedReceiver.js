import dns from 'dns'
import mongoose from 'mongoose'
dns.setServers(['8.8.8.8', '8.8.4.4'])

import { env } from '../src/config/env.js'
import { User } from '../src/models/User.js'
import { ReceiverProfile } from '../src/models/ReceiverProfile.js'
import { DonorProfile } from '../src/models/DonorProfile.js'
import { VolunteerProfile } from '../src/models/VolunteerProfile.js'
import { FoodDonation } from '../src/models/FoodDonation.js'
import { FoodRequest } from '../src/models/FoodRequest.js'
import { Exchange } from '../src/models/Exchange.js'
import { Notification } from '../src/models/Notification.js'
import { hashPassword } from '../src/utils/hashPassword.js'

async function seed() {
  console.log('Connecting to MongoDB...')
  await mongoose.connect(env.MONGODB_URI)
  console.log('Connected!')

  // 1. Create or Find Demo Receiver User (Maria Chen, Hope Harbor Shelter)
  const receiverEmail = 'contact@hopeharbor.org'
  let receiver = await User.findOne({ email: receiverEmail })
  const defaultPassHash = await hashPassword('HopeHarbor123!')

  if (!receiver) {
    receiver = await User.create({
      fullName: 'Maria Chen',
      email: receiverEmail,
      phone: '+1 (555) 280-4400',
      city: 'San Francisco',
      passwordHash: defaultPassHash,
      role: 'receiver',
      status: 'active',
      isEmailVerified: true,
      isPhoneVerified: true,
    })
    console.log(`Created demo receiver: ${receiver.email}`)
  } else {
    receiver.fullName = 'Maria Chen'
    receiver.role = 'receiver'
    receiver.status = 'active'
    receiver.passwordHash = defaultPassHash
    await receiver.save()
    console.log(`Updated existing demo receiver: ${receiver.email}`)
  }

  // 2. Setup Receiver Profile
  let receiverProfile = await ReceiverProfile.findOne({ user: receiver._id })
  const profileData = {
    user: receiver._id,
    organizationName: 'Hope Harbor Shelter',
    contactPerson: 'Maria Chen',
    taxId: '84-2948102',
    isVerified: true,
    verifiedDate: 'Nov 1, 2023',
    organizationAddress: '87 Elm Street, Downtown, CA 90210',
    dropoffAddress: '87 Elm Street, Downtown, CA 90210',
    phone: '+1 (555) 280-4400',
    email: receiverEmail,
    website: 'www.hopeharbor.org',
    storageCapacity: 'Refrigerated & Dry',
    operatingHours: '08:00 - 18:00',
    totalDonationsReceived: 14,
    lat: 37.7749,
    lng: -122.4194,
    capacity: {
      storageTypes: ['refrigerated', 'dry'],
      maxServingsPerPickup: 100,
      peopleServedPerDay: 150,
      preferredPickupWindows: ['Morning (09:00 - 12:00)', 'Afternoon (12:00 - 16:00)'],
      vehicleAvailable: true,
    },
    dietaryPrefs: ['Halal', 'Vegetarian', 'Vegan', 'Gluten-Free'],
    preferredCategories: ['Cooked Meals', 'Fresh Produce', 'Bakery', 'Dairy & Eggs', 'Packaged Goods'],
    notificationPrefs: {
      newFoodAvailable: true,
      requestStatusUpdates: true,
      deliveryAlerts: true,
      urgentExpiryAlerts: true,
      weeklyImpactDigest: true,
      smsNotifications: false,
    },
  }

  if (!receiverProfile) {
    receiverProfile = await ReceiverProfile.create(profileData)
  } else {
    Object.assign(receiverProfile, profileData)
    await receiverProfile.save()
  }
  console.log('Receiver profile configured.')

  // 3. Create or find Donor users for listings
  const donorEmail = 'donor@spicegarden.com'
  let donor = await User.findOne({ email: donorEmail })
  if (!donor) {
    donor = await User.create({
      fullName: 'Spice Garden Donor',
      email: donorEmail,
      phone: '+1 (555) 321-7654',
      city: 'San Francisco',
      passwordHash: defaultPassHash,
      role: 'donor',
      status: 'active',
      isEmailVerified: true,
    })
    await DonorProfile.create({
      user: donor._id,
      organizationName: 'Spice Garden Restaurant',
      pickupAddress: '42 Curry Way, San Francisco, CA',
      pickupAvailability: 'Daily 11:00 - 21:00',
    })
  }

  // 4. Create or find Volunteer Courier (David K.)
  const volunteerEmail = 'david.courier@foodshare.org'
  let volunteer = await User.findOne({ email: volunteerEmail })
  if (!volunteer) {
    volunteer = await User.create({
      fullName: 'David K.',
      email: volunteerEmail,
      phone: '+1 (555) 019-2834',
      city: 'San Francisco',
      passwordHash: defaultPassHash,
      role: 'volunteer',
      status: 'active',
      isEmailVerified: true,
    })
    await VolunteerProfile.create({
      user: volunteer._id,
      transportType: 'bicycle',
      vehicleNumber: 'BIKE-889',
      preferredTime: 'morning',
      serviceRadius: '10 miles',
      availableDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      guidelinesAccepted: true,
      totalDeliveriesCompleted: 42,
    })
  }

  // 5. Seed Food Listings
  // Clean existing seed listings
  await FoodDonation.deleteMany({ donor: donor._id })

  const now = new Date()
  const listingsData = [
    {
      title: 'Vegetable Biryani',
      category: 'Cooked Meals',
      description: 'Fragrant basmati rice cooked with fresh seasonal vegetables and aromatic spices.',
      quantity: 45,
      servings: 45,
      unit: 'servings',
      bestBefore: new Date(now.getTime() + 3.25 * 3600 * 1000), // 3h 15m
      expiresAt: new Date(now.getTime() + 3.25 * 3600 * 1000),
      pickupAddress: '42 Curry Way, San Francisco, CA',
      pickupWindow: '11:00 - 13:00',
      donorName: 'Spice Garden',
      donorOrganization: 'Spice Garden',
      deliveryOptions: ['volunteer', 'direct'],
      dietary: ['Halal', 'Vegetarian'],
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
      lat: 37.781,
      lng: -122.412,
      status: 'available',
    },
    {
      title: 'Mixed Salad Greens',
      category: 'Fresh Produce',
      description: 'Crisp organic mixed baby greens, arugula, spinach, and shaved carrots.',
      quantity: 30,
      servings: 30,
      unit: 'servings',
      bestBefore: new Date(now.getTime() + 6.0 * 3600 * 1000), // 6h 00m
      expiresAt: new Date(now.getTime() + 6.0 * 3600 * 1000),
      pickupAddress: '120 Market St, San Francisco, CA',
      pickupWindow: '10:00 - 12:00',
      donorName: 'FreshMart Co-op',
      donorOrganization: 'FreshMart Co-op',
      deliveryOptions: ['direct'],
      dietary: ['Vegan', 'Gluten-Free'],
      imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
      lat: 37.785,
      lng: -122.408,
      status: 'available',
    },
    {
      title: 'Sourdough Loaves',
      category: 'Bakery',
      description: 'Freshly baked artisanal sourdough loaves made with wild yeast culture.',
      quantity: 18,
      servings: 18,
      unit: 'units',
      bestBefore: new Date(now.getTime() + 4.5 * 3600 * 1000), // 4h 30m
      expiresAt: new Date(now.getTime() + 4.5 * 3600 * 1000),
      pickupAddress: '78 Bakery Lane, San Francisco, CA',
      pickupWindow: '09:00 - 11:00',
      donorName: 'Artisan Bakehouse',
      donorOrganization: 'Artisan Bakehouse',
      deliveryOptions: ['direct'],
      dietary: ['Vegetarian'],
      imageUrl: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=600&auto=format&fit=crop&q=80',
      lat: 37.765,
      lng: -122.435,
      status: 'available',
    },
    {
      title: 'Organic Milk & Cheese',
      category: 'Dairy & Eggs',
      description: 'Whole organic pasteurized milk cartons and artisanal aged cheddar blocks.',
      quantity: 24,
      servings: 24,
      unit: 'units',
      bestBefore: new Date(now.getTime() + 8.0 * 3600 * 1000), // 8h 00m
      expiresAt: new Date(now.getTime() + 8.0 * 3600 * 1000),
      pickupAddress: '88 Farmhouse Road, Riverside District',
      pickupWindow: '14:00 - 16:00',
      donorName: 'Valley Dairy Farm',
      donorOrganization: 'Valley Dairy Farm',
      deliveryOptions: ['volunteer', 'direct'],
      dietary: ['Vegetarian', 'Gluten-Free'],
      imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
      lat: 37.745,
      lng: -122.395,
      status: 'available',
    },
    {
      title: 'Lentil Dal & Rice',
      category: 'Cooked Meals',
      description: 'Hearty yellow lentil stew tempered with cumin, garlic and served with steamed basmati rice.',
      quantity: 60,
      servings: 60,
      unit: 'servings',
      bestBefore: new Date(now.getTime() + 2.75 * 3600 * 1000), // 2h 45m
      expiresAt: new Date(now.getTime() + 2.75 * 3600 * 1000),
      pickupAddress: '55 Spiceway Blvd, San Francisco, CA',
      pickupWindow: '12:00 - 14:00',
      donorName: 'The Curry House',
      donorOrganization: 'The Curry House',
      deliveryOptions: ['volunteer'],
      dietary: ['Vegan', 'Gluten-Free', 'Halal'],
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
      lat: 37.76,
      lng: -122.42,
      status: 'available',
    },
    {
      title: 'Canned Goods Variety',
      category: 'Packaged Goods',
      description: 'Assorted canned black beans, sweet corn, crushed tomatoes, and organic chickpeas.',
      quantity: 80,
      servings: 80,
      unit: 'servings',
      bestBefore: new Date(now.getTime() + 5 * 24 * 3600 * 1000), // 5d 0h
      expiresAt: new Date(now.getTime() + 5 * 24 * 3600 * 1000),
      pickupAddress: '15 Community Way, San Francisco, CA',
      pickupWindow: 'Any time',
      donorName: 'Community Pantry',
      donorOrganization: 'Community Pantry',
      deliveryOptions: ['direct'],
      dietary: ['Vegan', 'Gluten-Free'],
      imageUrl: 'https://broken-link-example.org/invalid-image.png', // Intentional broken fallback image as per spec!
      lat: 37.778,
      lng: -122.415,
      status: 'available',
    },
  ]

  const createdListings = []
  for (const item of listingsData) {
    const listing = await FoodDonation.create({
      ...item,
      donor: donor._id,
      foodSafetyAccepted: true,
    })
    createdListings.push(listing)
  }
  console.log(`Created ${createdListings.length} seed food listings.`)

  // 6. Seed Requests
  await FoodRequest.deleteMany({ receiver: receiver._id })

  const requestsData = [
    {
      donation: createdListings[0]._id, // Vegetable Biryani
      requestedQuantity: 30,
      deliveryPreference: 'volunteer_delivery',
      status: 'pending',
      preferredDate: 'Nov 29, 2024',
      notes: 'Needed for our lunchtime soup kitchen service.',
    },
    {
      donation: createdListings[2]._id, // Sourdough Loaves
      requestedQuantity: 12,
      deliveryPreference: 'direct_pickup',
      status: 'pending',
      preferredDate: 'Nov 27, 2024',
      notes: 'Volunteer van will pick up at 10am.',
    },
    {
      donation: createdListings[1]._id, // Mixed Salad Greens
      requestedQuantity: 20,
      deliveryPreference: 'direct_pickup',
      status: 'pending',
      preferredDate: 'Nov 28, 2024',
      notes: 'Salad bar fresh replenishment.',
    },
    {
      donation: createdListings[4]._id, // Lentil Dal & Rice
      requestedQuantity: 50,
      deliveryPreference: 'volunteer_delivery',
      status: 'approved',
      preferredDate: 'Nov 29, 2024',
      notes: 'Approved by The Curry House for community dinner.',
    },
  ]

  for (const r of requestsData) {
    await FoodRequest.create({
      ...r,
      donor: donor._id,
      receiver: receiver._id,
      receiverName: 'Maria Chen',
      receiverOrganization: 'Hope Harbor Shelter',
      receiverPhone: '+1 (555) 280-4400',
      message: r.notes,
      requestedUnit: 'servings',
    })
  }
  console.log('Seed requests created.')

  // 7. Seed Active Pickups / Deliveries
  await Exchange.deleteMany({ receiver: receiver._id })

  // Card A: Volunteer Courier Order #FD-20241129 (In Transit, stage 4)
  const activeVolunteerOrder = await Exchange.create({
    donation: createdListings[0]._id, // Vegetable Biryani
    request: new mongoose.Types.ObjectId(),
    donor: donor._id,
    receiver: receiver._id,
    receiverInfo: {
      name: 'Maria Chen',
      phone: '+1 (555) 280-4400',
      organization: 'Hope Harbor Shelter',
      exchangesCount: 14,
    },
    deliveryType: 'volunteer_delivery',
    volunteer: volunteer._id,
    volunteerInfo: {
      name: 'David K.',
      phone: '+1 (555) 019-2834',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      rating: 4.9,
      transportType: 'Electric Bike',
      vehicleNumber: 'E-BIKE-29',
      deliveriesCompleted: 42,
    },
    volunteerStatus: 'in_transit',
    status: 'in_transit',
    orderNo: 'FD-20241129',
    stage: 4,
    eta: '~15 minutes',
    courierPhone: '+1 (555) 019-2834',
    pickupAddress: '42 Curry Way, San Francisco, CA',
    dropoffAddress: '87 Elm Street, Downtown, CA 90210',
    pickupWindow: 'Today 11:00 - 13:00',
    pickupCode: '9102',
    timeline: [
      { step: 'accepted', title: 'Order Placed', time: new Date(now.getTime() - 45 * 60 * 1000), actor: 'System' },
      { step: 'ready_for_pickup', title: 'Preparing Food', time: new Date(now.getTime() - 30 * 60 * 1000), actor: 'Donor' },
      { step: 'picked_up', title: 'Picked Up', time: new Date(now.getTime() - 15 * 60 * 1000), actor: 'Volunteer' },
      { step: 'in_transit', title: 'In Transit', time: new Date(now.getTime() - 5 * 60 * 1000), actor: 'Volunteer' },
    ],
  })

  // Card B: Self-Pickup Order #FD-20241128 (Handover Code #4821)
  const activeSelfPickupOrder = await Exchange.create({
    donation: createdListings[3]._id, // Organic Milk & Cheese
    request: new mongoose.Types.ObjectId(),
    donor: donor._id,
    receiver: receiver._id,
    receiverInfo: {
      name: 'Maria Chen',
      phone: '+1 (555) 280-4400',
      organization: 'Hope Harbor Shelter',
      exchangesCount: 14,
    },
    deliveryType: 'direct_pickup',
    volunteerStatus: 'not_needed',
    status: 'ready_for_pickup',
    orderNo: 'FD-20241128',
    stage: 3,
    pickupAddress: '88 Farmhouse Road, Riverside District',
    dropoffAddress: '87 Elm Street, Downtown, CA 90210',
    pickupWindow: 'Today 14:00 - 16:00',
    pickupCode: '4821', // Large #4821 Handover code as required!
    timeline: [
      { step: 'accepted', title: 'Order Placed', time: new Date(now.getTime() - 120 * 60 * 1000), actor: 'System' },
      { step: 'ready_for_pickup', title: 'Preparing Food', time: new Date(now.getTime() - 60 * 60 * 1000), actor: 'Donor' },
      { step: 'picked_up', title: 'Ready for Collection', time: new Date(now.getTime() - 20 * 60 * 1000), actor: 'Donor' },
    ],
  })
  console.log('Active pickups created (#FD-20241129, #FD-20241128 with handover code #4821).')

  // 8. Seed Completed History Records (Matching screenshot 6)
  const historyData = [
    {
      title: 'Pasta Primavera',
      donorName: 'Bella Cucina',
      qty: 40,
      date: new Date('2024-11-20'),
      method: 'volunteer_delivery',
      category: 'Cooked Meals',
    },
    {
      title: 'Whole Grain Bread',
      donorName: 'Sunrise Bakery',
      qty: 24,
      date: new Date('2024-11-18'),
      method: 'direct_pickup',
      category: 'Bakery',
    },
    {
      title: 'Fresh Fruit Basket',
      donorName: 'OrganicHub',
      qty: 35,
      date: new Date('2024-11-15'),
      method: 'volunteer_delivery',
      category: 'Fresh Produce',
    },
    {
      title: 'Rice & Chicken Stew',
      donorName: 'Home Kitchen',
      qty: 55,
      date: new Date('2024-11-12'),
      method: 'volunteer_delivery',
      category: 'Cooked Meals',
    },
    {
      title: 'Vegetable Soup',
      donorName: 'Garden Bistro',
      qty: 30,
      date: new Date('2024-11-09'),
      method: 'direct_pickup',
      category: 'Cooked Meals',
    },
    {
      title: 'Mixed Sandwiches',
      donorName: 'Metro Deli',
      qty: 48,
      date: new Date('2024-11-06'),
      method: 'volunteer_delivery',
      category: 'Cooked Meals',
    },
  ]

  for (const h of historyData) {
    const histDonation = await FoodDonation.create({
      title: h.title,
      category: h.category,
      description: 'Historical rescued donation.',
      quantity: h.qty,
      servings: h.qty,
      unit: 'srv',
      bestBefore: h.date,
      expiresAt: h.date,
      pickupAddress: 'San Francisco, CA',
      pickupWindow: 'Completed',
      donorName: h.donorName,
      donorOrganization: h.donorName,
      donor: donor._id,
      status: 'completed',
    })

    await Exchange.create({
      donation: histDonation._id,
      request: new mongoose.Types.ObjectId(),
      donor: donor._id,
      receiver: receiver._id,
      deliveryType: h.method,
      status: 'completed',
      stage: 5,
      handoverConfirmed: true,
      deliveredAt: h.date,
      orderNo: `FD-${h.date.toISOString().slice(0, 10).replace(/-/g, '')}`,
      pickupCode: '1234',
      pickupAddress: 'San Francisco, CA',
      dropoffAddress: '87 Elm Street, Downtown, CA 90210',
    })
  }
  console.log('Seed completed collection history created.')

  // 9. Seed In-app Notifications
  await Notification.deleteMany({ user: receiver._id })
  await Notification.create([
    {
      user: receiver._id,
      title: 'Delivery In Transit',
      message: 'David K. is en route with your Vegetable Biryani order (ETA ~15 min).',
      type: 'delivery',
      link: '/receiver/pickups',
      isRead: false,
    },
    {
      user: receiver._id,
      title: 'Request Approved',
      message: 'The Curry House approved your request for 50 servings of Lentil Dal & Rice.',
      type: 'request',
      link: '/receiver/requests',
      isRead: false,
    },
    {
      user: receiver._id,
      title: 'Urgent Expiry Alert',
      message: 'Spice Garden has Vegetable Biryani expiring in less than 4 hours.',
      type: 'expiry',
      link: '/receiver/browse',
      isRead: false,
    },
  ])
  console.log('Seed notifications created.')

  console.log('\n===========================================')
  console.log('✅ RECEIVER SEED COMPLETED SUCCESSFULLY!')
  console.log('Demo Login Credentials:')
  console.log('Email:    contact@hopeharbor.org')
  console.log('Password: HopeHarbor123!')
  console.log('Role:     receiver')
  console.log('Org:      Hope Harbor Shelter')
  console.log('===========================================\n')

  await mongoose.disconnect()
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
