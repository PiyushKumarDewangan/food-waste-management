import { body, param } from 'express-validator'
import mongoose from 'mongoose'

// this func simply ask: Is this a valid MongoDB ObjectId?
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value)

export const reviewActionValidator = [
  param('id').custom(isValidObjectId).withMessage('Invalid profile id.'),
]

export const rejectActionValidator = [
  ...reviewActionValidator,
  body('reason')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must be under 500 characters.'),
]
//Used when an admin rejects a profile



//This file is a validation file. Its job is to check incoming request data before the controller runs