import dns from 'dns'
dns.setServers(['8.8.8.8', '8.8.4.4'])

import mongoose from 'mongoose'
import { env } from '../src/config/env.js'
import { User } from '../src/models/User.js'
import { VolunteerProfile } from '../src/models/VolunteerProfile.js'
import { RefreshToken } from '../src/models/RefreshToken.js'
import { Notification } from '../src/models/Notification.js'
import { Exchange } from '../src/models/Exchange.js'

async function deleteVolunteer() {
  await mongoose.connect(env.MONGODB_URI)
  console.log('Connected to MongoDB')

  const volunteers = await User.find({ role: 'volunteer' })
  const volunteerIds = volunteers.map((v) => v._id)

  console.log(`Found ${volunteers.length} volunteer accounts:`)
  volunteers.forEach((v) => console.log(` - [VOLUNTEER] ${v.fullName} (${v.email}) [ID: ${v._id}]`))

  if (volunteerIds.length > 0) {
    const delProfiles = await VolunteerProfile.deleteMany({ user: { $in: volunteerIds } })
    console.log(`Deleted ${delProfiles.deletedCount} volunteer profiles`)

    const delTokens = await RefreshToken.deleteMany({ user: { $in: volunteerIds } })
    console.log(`Deleted ${delTokens.deletedCount} refresh tokens`)

    const delNotifications = await Notification.deleteMany({ user: { $in: volunteerIds } })
    console.log(`Deleted ${delNotifications.deletedCount} notifications`)

    const delExchanges = await Exchange.deleteMany({ volunteer: { $in: volunteerIds } })
    console.log(`Deleted ${delExchanges.deletedCount} exchanges linked to volunteer`)

    const delUsers = await User.deleteMany({ _id: { $in: volunteerIds } })
    console.log(`Deleted ${delUsers.deletedCount} volunteer user accounts.`)
  } else {
    // Also clean up any orphan volunteer profiles if any exist
    const delProfiles = await VolunteerProfile.deleteMany({})
    console.log(`Deleted ${delProfiles.deletedCount} orphaned volunteer profiles.`)
  }

  const remaining = await User.find({})
  console.log(`\nRemaining users in database (${remaining.length}):`)
  remaining.forEach((u) => console.log(` - [${u.role.toUpperCase()}] ${u.fullName} (${u.email})`))

  await mongoose.disconnect()
}

deleteVolunteer().catch((err) => {
  console.error('Error deleting volunteer:', err)
  process.exit(1)
})
