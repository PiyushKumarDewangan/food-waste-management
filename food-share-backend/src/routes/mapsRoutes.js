import { Router } from 'express'
import { autocomplete, placeDetails, computeRoute, geocode, reverseGeocode } from '../controllers/mapsController.js'

const router = Router()

// Public map endpoints so road routes and geocoding always render smoothly across all dashboards
router.get('/geocode', geocode)
router.get('/reverse-geocode', reverseGeocode)
router.get('/autocomplete', autocomplete)
router.get('/place-details', placeDetails)
router.post('/route', computeRoute)

export default router
