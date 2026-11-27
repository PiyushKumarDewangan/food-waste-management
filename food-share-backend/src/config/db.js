import mongoose from 'mongoose'
import { env } from './env.js'
import { logger } from '../utils/logger.js'

export async function connectDB() {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      family: 4,
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    })
    logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`)
  } catch (error) {
    logger.error('MongoDB connection failed:', error.message)
    // Retry once after 3 seconds instead of immediate exit
    setTimeout(async () => {
      try {
        const retryConn = await mongoose.connect(env.MONGODB_URI, {
          family: 4,
          serverSelectionTimeoutMS: 15000,
          connectTimeoutMS: 15000,
          socketTimeoutMS: 45000,
        })
        logger.info(`MongoDB re-connected: ${retryConn.connection.host}/${retryConn.connection.name}`)
      } catch (err) {
        logger.error('MongoDB retry connection failed:', err.message)
      }
    }, 3000)
  }
}

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected')
})

export default connectDB