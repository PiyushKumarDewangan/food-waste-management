import app from './app.js'
import { env } from './config/env.js'
import { connectDB } from './config/db.js'
import { logger } from './utils/logger.js'

async function startServer() {
  await connectDB()

  const server = app.listen(env.PORT, () => {
    logger.info(`FoodBridge API listening on http://localhost:${env.PORT}`)
    logger.info(`Environment: ${env.NODE_ENV}`)
  })

  // Graceful shutdown
  const shutdown = (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`)
    server.close(() => {
      logger.info('HTTP server closed.')
      process.exit(0)
    })
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

startServer().catch((err) => {
  logger.error('Failed to start server:', err)
  process.exit(1)
})
