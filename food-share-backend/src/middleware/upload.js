import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { ApiError } from '../utils/ApiError.js'
import { env } from '../config/env.js'

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads/verification-docs')
// project/uploads/verification-docs
// This is where uploaded files are stored

// Ensure the upload directory exists (useful on first run / fresh clone).
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}//Create folder if missing

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const ext = path.extname(file.originalname)
    cb(null, `verification-${uniqueSuffix}${ext}`)
  },
})

// file filter Runs before saving
function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new ApiError(400, 'Unsupported file type. Please upload a PDF, JPG, JPEG or PNG file.'))
  }
  cb(null, true)
}

export const uploadVerificationDocument = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024 },
}).single('verificationDocument')

// Food photos directory
const FOOD_UPLOAD_DIR = path.resolve(process.cwd(), 'uploads/food')
if (!fs.existsSync(FOOD_UPLOAD_DIR)) {
  fs.mkdirSync(FOOD_UPLOAD_DIR, { recursive: true })
}

const foodStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, FOOD_UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const ext = path.extname(file.originalname)
    cb(null, `food-${uniqueSuffix}${ext}`)
  },
})

const FOOD_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
function foodFileFilter(req, file, cb) {
  if (!FOOD_MIME_TYPES.includes(file.mimetype)) {
    return cb(new ApiError(400, 'Unsupported image type. Please upload a JPG, PNG or WEBP file.'))
  }
  cb(null, true)
}

export const uploadFoodPhoto = multer({
  storage: foodStorage,
  fileFilter: foodFileFilter,
  limits: { fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024 },
}).single('foodPhoto')

// User Avatars directory
const AVATAR_UPLOAD_DIR = path.resolve(process.cwd(), 'uploads/avatars')
if (!fs.existsSync(AVATAR_UPLOAD_DIR)) {
  fs.mkdirSync(AVATAR_UPLOAD_DIR, { recursive: true })
}

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AVATAR_UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `avatar-${uniqueSuffix}${ext}`)
  },
})

const AVATAR_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
function avatarFileFilter(req, file, cb) {
  if (!AVATAR_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
    return cb(new ApiError(400, 'Unsupported image format. Allowed formats: JPG, JPEG, PNG, WebP.'))
  }
  cb(null, true)
}

export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: avatarFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
}).single('avatar')


