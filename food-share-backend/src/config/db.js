import mongoose from 'mongoose'
import { env } from './env.js'
import { logger } from '../utils/logger.js'

export async function connectDB() {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI)
    logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`)
  } catch (error) {
    logger.error('MongoDB connection failed:', error.message)
    // A backend that can't reach its database should not silently keep running.
    process.exit(1)
  }
}

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected')
})

export default connectDB
