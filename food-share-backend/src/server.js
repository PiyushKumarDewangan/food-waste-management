import app from './app.js'
import { env } from './config/env.js'
import { connectDB } from './config/db.js'
import { logger } from './utils/logger.js'
import { startExpiryScheduler } from './utils/expiryManager.js'

async function startServer() {
  await connectDB()
  startExpiryScheduler()

  const server = app.listen(env.PORT, () => {
    logger.info(`FoodShare API listening on http://localhost:${env.PORT}`)
    logger.info(`Environment: ${env.NODE_ENV}`)
  })

  // Graceful shutdown
  const shutdown = (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`)
    //Stops accepting new requests
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

// this file is the backend's "main switch"—it connects MongoDB,
//  starts the Express server, logs startup information, and safely
//  shuts everything down when the application stops.
// npm run dev
//       ↓
// server.js starts
//       ↓
// Import app, env, DB, logger
//       ↓
// startServer()
//       ↓
// connectDB()
//       ↓
// MongoDB connected
//       ↓
// app.listen(5000)
//       ↓
// FoodShare API running

// Ctrl + C
//       ↓
// SIGINT received
//       ↓
// shutdown()
//       ↓
// close server
//       ↓
// process.exit(0) 