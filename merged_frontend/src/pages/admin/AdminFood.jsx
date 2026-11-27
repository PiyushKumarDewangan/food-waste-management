import { useState, useEffect } from 'react'
import {
  Leaf,
  Scale,
  Clock,
  Eye,
  Radio,
  Share2,
  Navigation,
  X,
  AlertTriangle,
  Building2,
  MapPin,
  Calendar,
  CheckCircle2,
  Trash2,
} from 'lucide-react'
import { adminService, MOCK_FOOD_LISTINGS } from '../../services/adminService'
import { getFoodImageUrl, handleImageError } from '../../utils/imageHelper'

export default function AdminFood() {
  const [foodListings, setFoodListings] = useState(MOCK_FOOD_LISTINGS)
  const [stats, setStats] = useState({ active: 0, expiringSoon: 0, rescuedTodayKg: 0, totalDivertedKg: 0 })
  const [categoryFilter, setCategoryFilter] = useState('all') // 'all' | 'Cooked Meals' | 'Packaged Groceries' | 'Bakery / Dairy' | 'Fresh Produce'
  const [vegOnly, setVegOnly] = useState(false)
  const [inspectItem, setInspectItem] = useState(null)
  const [sosModalItem, setSosModalItem] = useState(null)
  const [journeyItem, setJourneyItem] = useState(null)
  const [toastMessage, setToastMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadFoodListings = async () => {
    try {
      setLoading(true)
      const data = await adminService.getFoodListings({
        category: categoryFilter,
        vegOnly
      })
      if (data) {
        if (Array.isArray(data.listings)) {
          setFoodListings(data.listings)
        }
        if (data.stats) {
          setStats(data.stats)
        }
      }
    } catch (err) {
      console.warn('Failed to load food listings:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFoodListings()
  }, [categoryFilter, vegOnly])

  // Filter listings
  const filteredListings = foodListings.filter((item) => {
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false
    if (vegOnly && !item.isVeg) return false
    return true
  })

  // Handle SOS Broadcast
  const handleBroadcastSOS = async () => {
    if (!sosModalItem) return
    try {
      await adminService.broadcastFoodSOS(sosModalItem.id)
      setToastMessage(`🚨 Urgent SOS broadcast sent for "${sosModalItem.title}" to nearby NGOs & volunteers!`)
    } catch (err) {
      setToastMessage(`Failed to broadcast SOS: ${err.message}`)
    }
    setSosModalItem(null)
    setTimeout(() => setToastMessage(null), 4000)
  }

  // Handle Delete Listing
  const handleDeleteListing = async (listingId, title) => {
    if (!window.confirm(`Are you sure you want to cancel the listing "${title}"?`)) return
    try {
      await adminService.deleteFoodListing(listingId)
      setToastMessage(`✓ Listing "${title}" was cancelled and removed.`)
      loadFoodListings()
    } catch (err) {
      setToastMessage(`Failed to cancel listing: ${err.message}`)
    }
    setInspectItem(null)
    setTimeout(() => setToastMessage(null), 3000)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ======================= HEADER ======================= */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#1F2937] tracking-tight">
          Food Management & Inventory
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Track all surplus food listings, food categories, and real-time expiration
        </p>
      </div>

      {/* ======================= SUMMARY STAT CARDS (ROW 1) ======================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Active Listings */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
              Active Listings
            </span>
            <h3 className="text-3xl font-extrabold text-[#1F2937] mt-1">{stats.active ?? 0}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#2E7D32] flex items-center justify-center">
            <Leaf className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Expiring Soon (<2h) (Highlighted amber border) */}
        <div className="bg-white rounded-2xl p-5 border-2 border-amber-300 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
              Expiring Soon (&lt;2h)
            </span>
            <h3 className="text-3xl font-extrabold text-[#1F2937] mt-1">{stats.expiringSoon ?? 0}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Leaf className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Rescued Today */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
              Rescued Today
            </span>
            <h3 className="text-3xl font-extrabold text-[#1F2937] mt-1">{stats.rescuedTodayKg ?? 0} kg</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1565C0] flex items-center justify-center">
            <Leaf className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Total Diverted */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
              Total Diverted
            </span>
            <h3 className="text-3xl font-extrabold text-[#1F2937] mt-1">{(stats.totalDivertedKg ?? 0).toLocaleString()} kg</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#6A1B9A] flex items-center justify-center">
            <Scale className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ======================= CATEGORY & DIET FILTERS ======================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {['all', 'Cooked Meals', 'Packaged Groceries', 'Bakery / Dairy', 'Fresh Produce'].map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  categoryFilter === cat
                    ? 'bg-[#2E7D32] text-white shadow-sm shadow-emerald-800/15'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {cat === 'all' ? 'All Items' : cat}
              </button>
            )
          )}
        </div>

        {/* Veg / Non-Veg Toggle Pills */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={() => setVegOnly(true)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              vegOnly
                ? 'bg-emerald-100 text-[#2E7D32] border border-emerald-300'
                : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            Veg Only
          </button>
          <button
            onClick={() => setVegOnly(false)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              !vegOnly
                ? 'bg-emerald-100 text-[#2E7D32] border border-emerald-300'
                : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            Non-Veg
          </button>
        </div>
      </div>

      {/* ======================= 3-COLUMN FOOD CARD GRID ======================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredListings.map((listing) => (
          <div
            key={listing.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow group"
          >
            {/* Image Header with Expiry Pill */}
            <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
              <img
                src={getFoodImageUrl(listing.imageUrl, listing.category)}
                alt={listing.title}
                onError={(e) => handleImageError(e, listing.category)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {/* Expiry Pill */}
              <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center space-x-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    listing.expiryUrgency === 'critical'
                      ? 'bg-red-500 animate-pulse'
                      : listing.expiryUrgency === 'warning'
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                />
                <span>{listing.expiryLabel}</span>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 leading-snug">
                  {listing.title}
                </h3>
                <p className="text-xs text-gray-400 font-medium mt-0.5">{listing.donor}</p>

                {/* Sub-grid of quantity & status */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100 text-xs">
                  <div>
                    <span className="text-[11px] text-gray-400 block font-medium">
                      Quantity available
                    </span>
                    <span className="font-bold text-gray-800">{listing.quantity}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-400 block font-medium">
                      Current status
                    </span>
                    <span className={`font-bold ${listing.statusClass}`}>
                      {listing.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 flex items-center justify-between gap-2">
                <button
                  onClick={() => setInspectItem(listing)}
                  className="px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Inspect listing
                </button>

                {listing.status === 'Available' ? (
                  <button
                    onClick={() => setSosModalItem(listing)}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold shadow-2xs flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Broadcast SOS</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setJourneyItem(listing)}
                    className="text-xs font-semibold text-gray-600 hover:text-gray-900 hover:underline px-2 py-2"
                  >
                    View journey
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ======================= INSPECT LISTING MODAL ======================= */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Food Listing Inspection</h3>
              <button
                onClick={() => setInspectItem(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div className="flex items-center space-x-3">
                <img
                  src={getFoodImageUrl(inspectItem.imageUrl, inspectItem.category)}
                  alt={inspectItem.title}
                  onError={(e) => handleImageError(e, inspectItem.category)}
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{inspectItem.title}</h4>
                  <p className="text-gray-500 font-medium">{inspectItem.donor}</p>
                  <span className="text-[11px] font-semibold text-[#2E7D32]">
                    {inspectItem.category} • {inspectItem.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
                <div className="flex justify-between">
                  <span className="text-gray-500">Pickup Address:</span>
                  <span className="font-semibold text-gray-800">{inspectItem.city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Packaging Type:</span>
                  <span className="font-semibold text-gray-800">{inspectItem.packaging}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Portions / Weight:</span>
                  <span className="font-semibold text-gray-800">{inspectItem.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Expiration Time:</span>
                  <span className="font-semibold text-red-600">{inspectItem.expiryLabel}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-gray-600 block mb-1">
                  Preparation & Safety Notes:
                </span>
                <p className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-gray-700 leading-relaxed">
                  {inspectItem.specialInstructions}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => handleDeleteListing(inspectItem.id, inspectItem.title)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 flex items-center space-x-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Cancel Listing</span>
              </button>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setInspectItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setToastMessage(`✓ Listing verified & approved for active distribution!`)
                    setInspectItem(null)
                    setTimeout(() => setToastMessage(null), 3000)
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#2E7D32] hover:bg-[#1B5E20] text-white"
                >
                  Verify & Endorse
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================= BROADCAST SOS MODAL ======================= */}
      {sosModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center space-x-2.5 text-amber-600 pb-2">
              <Radio className="w-5 h-5 animate-pulse" />
              <h3 className="text-base font-bold text-gray-900">Broadcast Urgent SOS</h3>
            </div>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              This food item (<strong>{sosModalItem.title}</strong>) is expiring soon (
              {sosModalItem.expiryLabel}). Broadcasting will send high-priority push notifications
              to all verified NGOs and available volunteers within a 10 km radius.
            </p>

            <div className="mt-4 p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-[#2E7D32] space-y-1">
              <p className="font-bold">Estimated Coverage:</p>
              <p>• 14 Verified Shelters & Community Kitchens</p>
              <p>• 22 On-Duty Volunteer Couriers</p>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-2">
              <button
                onClick={() => setSosModalItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleBroadcastSOS}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#2E7D32] hover:bg-[#1B5E20] text-white flex items-center space-x-1.5 shadow-2xs"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Confirm Broadcast</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= VIEW JOURNEY MODAL ======================= */}
      {journeyItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Delivery Lifecycle Journey</h3>
              <button
                onClick={() => setJourneyItem(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="flex items-start space-x-3">
                <span className="w-3 h-3 rounded-full bg-[#2E7D32] mt-1 shrink-0" />
                <div>
                  <p className="font-bold text-gray-900">Food Listed by {journeyItem.donor}</p>
                  <p className="text-[11px] text-gray-400">Today at 1:15 PM</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="w-3 h-3 rounded-full bg-[#2E7D32] mt-1 shrink-0" />
                <div>
                  <p className="font-bold text-gray-900">Claim Request Confirmed</p>
                  <p className="text-[11px] text-gray-400">Claimed by verified shelter</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="w-3 h-3 rounded-full bg-[#1565C0] mt-1 shrink-0" />
                <div>
                  <p className="font-bold text-gray-900">Volunteer In Transit</p>
                  <p className="text-[11px] text-gray-400">Currently en route for final delivery</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setJourneyItem(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1F2937] text-white text-xs font-semibold px-5 py-3 rounded-full shadow-xl animate-in fade-in">
          {toastMessage}
        </div>
      )}
    </div>
  )
}
