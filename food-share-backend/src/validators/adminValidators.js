import { body, param } from 'express-validator'
import mongoose from 'mongoose'

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
