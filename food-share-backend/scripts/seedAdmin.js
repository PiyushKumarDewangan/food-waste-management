import dns from 'dns'
import mongoose from 'mongoose'
dns.setServers(['8.8.8.8', '8.8.4.4'])

import { env } from '../src/config/env.js'
import { User } from '../src/models/User.js'
import { hashPassword } from '../src/utils/hashPassword.js'

async function seedAdmin() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(env.MONGODB_URI)
    console.log('Connected!')

    const adminEmail = 'admin@foodshare.org'
    let admin = await User.findOne({ email: adminEmail })
    const passHash = await hashPassword('Admin123!')

    if (!admin) {
      admin = await User.create({
        fullName: 'Super Admin',
        email: adminEmail,
        phone: '+91 99999 88888',
        city: 'Mumbai',
        passwordHash: passHash,
        role: 'admin',
        status: 'active',
        isEmailVerified: true,
        isPhoneVerified: true,
      })
      console.log(`Created Super Admin: ${admin.email} (Password: Admin123!)`)
    } else {
      admin.role = 'admin'
      admin.status = 'active'
      admin.passwordHash = passHash
      await admin.save()
      console.log(`Updated Super Admin: ${admin.email} (Password: Admin123!)`)
    }
  } catch (err) {
    console.error('Seeding error:', err)
  } finally {
    await mongoose.disconnect()
    console.log('Done!')
  }
}

seedAdmin()
