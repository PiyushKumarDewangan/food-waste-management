import express from 'express'
import cors from 'cors'
import helmet from 'helmet'//Adds security headers automatically,Protects against common attacks
import cookieParser from 'cookie-parser'//Reads cookies sent by the browser
import morgan from 'morgan'//Logs HTTP requests
import path from 'path'

import { env } from './config/env.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

import authRoutes from './routes/authRoutes.js'
import donorRoutes from './routes/donorRoutes.js'
import receiverRoutes from './routes/receiverRoutes.js'
import volunteerRoutes from './routes/volunteerRoutes.js'

const app = express()

// --- Security & core middleware -------------------------------------------
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
) // Runs Helmet for every request
app.use(
  cors({
    origin: env.CORS_ORIGIN, // must exactly match the frontend's origin
    credentials: true, // required so the httpOnly refresh-token cookie is sent/received
    // Allows cookies to be sent.
    // Needed because you're using refresh-token cookies

  })
)
app.use(express.json({ limit: '1mb' }))//Converts JSON request body into JavaScript objects
app.use(express.urlencoded({ extended: true, limit: '1mb' }))
app.use(cookieParser())

if (env.NODE_ENV !== 'production') {
  app.use(morgan('dev'))
}

// Serve uploaded verification documents statically (dev only — use S3/CDN in production)
app.use(
  '/uploads',
  express.static(path.resolve(process.cwd(), 'uploads'), {
    setHeaders: (res) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
    },
  })
)

// --- Health check ------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'FoodBridge API is running.' })
})
//Simple endpoint to check if server is alive

// --- Routes -------------------------------------------------------------------
app.use('/api/auth', authRoutes)
app.use('/api/donors', donorRoutes)
app.use('/api/receivers', receiverRoutes)
app.use('/api/volunteers', volunteerRoutes)

// --- 404 + centralized error handler (must be registered LAST) ---------------
app.use(notFoundHandler)//Runs when no route matches
app.use(errorHandler)//Central place for handling all errors
//If they were placed at the top, every request would hit them before reaching the routes

export default app

// app.js is the main configuration center of your FoodShare backend. It:

// Creates the Express app.
// Adds security (helmet).
// Allows frontend requests (cors).
// Parses JSON, forms, and cookies.
// Logs requests (morgan).
// Serves uploaded files.
// Registers authentication, donor, receiver, and volunteer routes.
// Handles 404 errors.
// Handles all application errors in one place.
// Exports the configured app to server.js, where the server actually starts.
