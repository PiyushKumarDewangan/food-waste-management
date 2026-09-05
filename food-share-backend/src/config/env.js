import dotenv from 'dotenv'
import path from 'path'

// Always resolve .env from the project root (process.cwd()), regardless of
// how deeply this file is imported from within src/. This is why .env lives
// at the project root and NOT inside src/.
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

function required(key) {
  const value = process.env[key]
  if (!value) {
    // Fail fast and loud at boot time rather than deep inside a request.
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 5000,

  MONGODB_URI: required('MONGODB_URI'),

  JWT_ACCESS_SECRET: required('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',

  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  REFRESH_COOKIE_NAME: process.env.REFRESH_COOKIE_NAME || 'fb_refresh_token',

  MAX_UPLOAD_SIZE_MB: Number(process.env.MAX_UPLOAD_SIZE_MB) || 5,

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
}

export default env
