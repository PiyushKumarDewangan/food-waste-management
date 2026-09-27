import mongoose from 'mongoose'
import dns from 'dns'
// dns is node.js built in module
// It converts domain names into IP addresses 
// Your MongoDB Atlas connection uses a domain name, so Node needs DNS to resolve that domain  

import { env } from './env.js'
import { logger } from '../utils/logger.js'

dns.setServers(['8.8.8.8', '8.8.4.4'])

export async function connectDB() {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI)
    logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`)
  } catch (error) {
    logger.error('MongoDB connection failed:', error.message)
    process.exit(1)
  }
}

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected')
})

export default connectDB