import { useState, useEffect, useCallback, useMemo } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import {
  Search,
  Clock,
  MapPin,
  Utensils,
  ChevronDown,
  Bike,
  UserCheck,
  Check,
  AlertCircle,
  Package,
} from 'lucide-react'
import receiverService from '../../services/receiverService'
import { RequestFoodModal } from '../../components/receiver/ReceiverModals'
import { getFoodImageUrl, handleImageError } from '../../utils/imageHelper'
import { formatQuantityUnit } from '../../utils/unitHelper'

const CATEGORIES = [
  'All',
  'Cooked Meals',
  'Fresh Produce',
  'Bakery',
  'Dairy & Eggs',
  'Packaged Goods',
  'Beverages & Other',
]

export default function BrowseFood() {
  const { refreshBadges } = useOutletContext() || {}
  const [searchParams] = useSearchParams()

  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Geolocation state
  const [userCoords, setUserCoords] = useState(null)
  const [locationDenied, setLocationDenied] = useState(false)

  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [distanceRadius, setDistanceRadius] = useState('10')
  const [sortBy, setSortBy] = useState(
    searchParams.get('sort') === 'expiring' ? 'expiring' : 'distance'
  )

  // Request Modal state
  const [selectedListing, setSelectedListing] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submittingRequest, setSubmittingRequest] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // Live timer tick every 30 seconds to recalculate countdowns
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now())
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // Geolocation lookup on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          })
          setLocationDenied(false)
        },
        (err) => {
          console.warn('Geolocation unavailable or denied:', err)
          setLocationDenied(true)
        },
        { timeout: 8000 }
      )
    } else {
      setLocationDenied(true)
    }
  }, [])

  // Load listings from API
  const fetchListings = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const params = {
        q: searchTerm,
        category: selectedCategory,
        radius: distanceRadius,
        sort: sortBy,
      }
      if (userCoords?.lat && userCoords?.lng) {
        params.lat = userCoords.lat
        params.lng = userCoords.lng
      }
      const res = await receiverService.getListings(params)
      if (res.data?.listings) {
        setListings(res.data.listings)
      }
    } catch (err) {
      setError('Unable to load listings. Please check connection.')
    } finally {
      setLoading(false)
    }
  }, [searchTerm, selectedCategory, distanceRadius, sortBy, userCoords])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchListings()
    }, 300)
    return () => clearTimeout(timer)
  }, [fetchListings])

  const handleOpenRequestModal = (listing) => {
    setSelectedListing(listing)
    setIsModalOpen(true)
  }

  const handleSubmitRequest = async (requestData) => {
    try {
      setSubmittingRequest(true)
      await receiverService.createRequest(requestData)
      setIsModalOpen(false)
      setToastMessage('Food request submitted successfully! Awaiting donor review.')
      setTimeout(() => setToastMessage(''), 4500)
      if (refreshBadges) refreshBadges()
    } catch (err) {
      alert(err.message || 'Failed to submit request.')
    } finally {
      setSubmittingRequest(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-[#2E7D32] text-white rounded-xl shadow-xl text-xs font-semibold animate-in slide-in-from-top-4">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Filter Bar: Search + Distance Dropdown */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search food or donor..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] shadow-2xs transition-all"
          />
        </div>

        {/* Distance Filter Dropdown */}
        <div className="relative shrink-0">
          <select
            value={distanceRadius}
            onChange={(e) => setDistanceRadius(e.target.value)}
            className="w-full sm:w-auto appearance-none bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5 pr-9 text-xs sm:text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:border-[#2E7D32] shadow-2xs transition-all cursor-pointer"
          >
            <option value="5">Within 5 km</option>
            <option value="10">Within 10 km</option>
            <option value="25">Within 25 km</option>
            <option value="50">Within 50 km</option>
            <option value="all">Any distance</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Geolocation Notice Banner */}
      {locationDenied && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
          <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Location access is turned off or unavailable. Distances cannot be calculated accurately and will appear as &ldquo;Distance unavailable&rdquo;.
          </span>
        </div>
      )}

      {/* Category Pills Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#2E7D32] text-white shadow-2xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* Food Listings Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-200 h-80 animate-pulse p-4 space-y-3"
            >
              <div className="bg-gray-200 rounded-xl h-44 w-full" />
              <div className="h-4 bg-gray-200 rounded-md w-3/4" />
              <div className="h-3 bg-gray-200 rounded-md w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-red-100">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-800">{error}</p>
          <button
            onClick={fetchListings}
            className="mt-3 px-4 py-2 bg-[#2E7D32] text-white text-xs font-semibold rounded-xl"
          >
            Try Again
          </button>
        </div>
      ) : listings.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-200">
          <Utensils className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">No Food Listings Found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Try adjusting your distance radius or clearing some category / dietary filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((item) => (
            <FoodCard
              key={item._id}
              listing={item}
              now={now}
              onRequest={() => handleOpenRequestModal(item)}
            />
          ))}
        </div>
      )}

      {/* Request Food Modal */}
      <RequestFoodModal
        listing={selectedListing}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitRequest}
        isSubmitting={submittingRequest}
      />
    </div>
  )
}

function FoodCard({ listing, now, onRequest }) {
  const [imageError, setImageError] = useState(false)

  // Compute live countdown
  const expTime = new Date(listing.expiresAt).getTime()
  const diffMs = expTime - now
  const isExpired = diffMs <= 0

  let countdownText = 'Expired'
  if (!isExpired) {
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    if (days > 0) {
      countdownText = `${days}d ${hours}h`
    } else {
      countdownText = `${hours}h ${mins}m`
    }
  }

  // Delivery tag pill styling
  const isVolunteer =
    listing.deliveryType === 'volunteer' ||
    listing.deliveryOptions?.includes('volunteer')

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        {/* Card Header Image with Live Countdown Pill */}
        <div className="relative h-44 w-full bg-gray-100 overflow-hidden">
          {!imageError ? (
            <img
              src={getFoodImageUrl(listing.imageUrl, listing.category)}
              alt={listing.title}
              onError={(e) => {
                if (!e.target.dataset.triedFallback) {
                  e.target.dataset.triedFallback = 'true'
                  handleImageError(e, listing.category)
                } else {
                  setImageError(true)
                }
              }}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            /* Neutral gray fallback placeholder with food icon (e.g. Canned Goods Variety) */
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400 p-4 text-center">
              <Package className="w-10 h-10 text-gray-300 mb-1" />
              <span className="text-xs font-semibold text-gray-500 line-clamp-1">
                {listing.title}
              </span>
            </div>
          )}

          {/* Expiry Pill at Top Right */}
          <div className="absolute top-2.5 right-2.5">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#D32F2F] text-white shadow-xs">
              <Clock className="w-3 h-3" />
              {countdownText}
            </span>
          </div>
        </div>

        {/* Card Content Body */}
        <div className="p-4 space-y-2.5">
          {/* Title & Donor Subtitle */}
          <div>
            <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-1">
              {listing.title}
            </h3>
            <p className="text-xs font-medium text-gray-500 mt-0.5">
              {listing.donor} · {listing.distance}
            </p>
          </div>

          {/* Meta Pills: Servings + Pickup Window */}
          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
            <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold">
              {formatQuantityUnit(listing.servings, listing.unit)}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 text-gray-400" />
              {listing.pickupWindow}
            </span>
          </div>

          {/* Delivery Method Tag Pill */}
          <div>
            {isVolunteer ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-[#1565C0] border border-blue-100">
                <Bike className="w-3.5 h-3.5" />
                Volunteer Delivery Available
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-orange-50 text-[#E65100] border border-orange-100">
                <UserCheck className="w-3.5 h-3.5" />
                Direct Pickup Only
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Full-width Request Food Button */}
      <div className="p-4 pt-0">
        <button
          onClick={onRequest}
          disabled={isExpired}
          className="w-full py-2.5 bg-[#2E7D32] hover:bg-[#1B5E20] disabled:bg-gray-300 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          Request Food
        </button>
      </div>
    </div>
  )
}
