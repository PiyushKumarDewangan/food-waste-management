/**
 * One-off CLI script to create an admin account.
 * Admin is intentionally NOT exposed via public registration (per product
 * spec), so this is the only way to create the first admin user.
 *
 * Usage:
 *   node scripts/createAdmin.js "Jane Admin" jane@foodbridge.org StrongPass123! +254712345678 Nairobi
 *
 * Args (in order): fullName email password phone city
 */
import mongoose from 'mongoose'
import { env } from '../src/config/env.js'
import { User } from '../src/models/User.js'
import { hashPassword } from '../src/utils/hashPassword.js'

async function main() {
  const [fullName, email, password, phone, city] = process.argv.slice(2)

  if (!fullName || !email || !password || !phone || !city) {
    console.error(
      '\nUsage: node scripts/createAdmin.js "Full Name" email password phone city\n' +
        'Example: node scripts/createAdmin.js "Jane Admin" jane@foodbridge.org StrongPass123! +254712345678 Nairobi\n'
    )
    process.exit(1)
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters.')
    process.exit(1)
  }

  await mongoose.connect(env.MONGODB_URI)
  console.log(`Connected to MongoDB (${env.MONGODB_URI})`)

  const existing = await User.findOne({ email: email.toLowerCase() })
  if (existing) {
    console.error(`A user with email "${email}" already exists (role: ${existing.role}).`)
    await mongoose.disconnect()
    process.exit(1)
  }

  const passwordHash = await hashPassword(password)

  const admin = await User.create({
    fullName,
    email: email.toLowerCase(),
    phone,
    city,
    passwordHash,
    role: 'admin',
    status: 'active',
    isEmailVerified: true,
    isPhoneVerified: true,
  })

  console.log('\n✅ Admin account created:')
  console.log(`   Name:  ${admin.fullName}`)
  console.log(`   Email: ${admin.email}`)
  console.log(`   Role:  ${admin.role}`)
  console.log('\nYou can now log in at POST /api/auth/login with this email + password.\n')

  await mongoose.disconnect()
  process.exit(0)
}

main().catch((err) => {
  console.error('Failed to create admin:', err.message)
  process.exit(1)
})
