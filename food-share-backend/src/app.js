import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import path from 'path'

import { env } from './config/env.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

import authRoutes from './routes/authRoutes.js'
import donorRoutes from './routes/donorRoutes.js'
import receiverRoutes from './routes/receiverRoutes.js'
import volunteerRoutes from './routes/volunteerRoutes.js'

const app = express()

// --- Security & core middleware -------------------------------------------
app.use(helmet())
app.use(
  cors({
    origin: env.CORS_ORIGIN, // must exactly match the frontend's origin
    credentials: true, // required so the httpOnly refresh-token cookie is sent/received
  })
)
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))
app.use(cookieParser())

if (env.NODE_ENV !== 'production') {
  app.use(morgan('dev'))
}

// Serve uploaded verification documents statically (dev only — use S3/CDN in production)
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')))

// --- Health check ------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'FoodBridge API is running.' })
})

// --- Routes -------------------------------------------------------------------
app.use('/api/auth', authRoutes)
app.use('/api/donors', donorRoutes)
app.use('/api/receivers', receiverRoutes)
app.use('/api/volunteers', volunteerRoutes)

// --- 404 + centralized error handler (must be registered LAST) ---------------
app.use(notFoundHandler)
app.use(errorHandler)

export default app
