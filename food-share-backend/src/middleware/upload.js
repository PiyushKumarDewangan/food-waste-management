import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { ApiError } from '../utils/ApiError.js'
import { env } from '../config/env.js'

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads/verification-docs')

// Ensure the upload directory exists (useful on first run / fresh clone).
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const ext = path.extname(file.originalname)
    cb(null, `verification-${uniqueSuffix}${ext}`)
  },
})

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

// NOTE: For production, swap `storage` for an S3 (or similar) multer-storage
// adapter instead of the local disk — local disk storage doesn't survive
// container restarts/horizontal scaling.
