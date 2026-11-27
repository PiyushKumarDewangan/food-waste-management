import { Router } from 'express'
import { autocomplete, placeDetails, computeRoute, geocode, reverseGeocode } from '../controllers/mapsController.js'
import { authenticate } from '../middleware/authenticate.js'

const router = Router()

// All maps routes require authenticated users to prevent abuse
router.use(authenticate)

router.get('/geocode', geocode)
router.get('/reverse-geocode', reverseGeocode)
router.get('/autocomplete', autocomplete)
router.get('/place-details', placeDetails)
router.post('/route', computeRoute)

export default router
