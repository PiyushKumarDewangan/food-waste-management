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
  Plus,
  Edit2,
  Save,
  Check,
  ChevronRight,
  Phone,
  Sparkles,
} from 'lucide-react'
import { adminService, MOCK_FOOD_LISTINGS } from '../../services/adminService'
import { getFoodImageUrl, handleImageError } from '../../utils/imageHelper'

export default function AdminFood() {
  const [foodListings, setFoodListings] = useState(MOCK_FOOD_LISTINGS)
  const [stats, setStats] = useState({ active: 0, expiringSoon: 0, rescuedTodayKg: 0, totalDivertedKg: 0 })
  const [categoryFilter, setCategoryFilter] = useState('all') // 'all' | 'Cooked Meals' | 'Packaged Groceries' | 'Bakery / Dairy' | 'Fresh Produce'
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'available' | 'claimed' | 'completed' | 'cancelled'
  const [vegOnly, setVegOnly] = useState(false)
  const [inspectItem, setInspectItem] = useState(null)
  const [sosModalItem, setSosModalItem] = useState(null)
  const [journeyItem, setJourneyItem] = useState(null)
  const [journeyData, setJourneyData] = useState(null)
  const [loadingJourney, setLoadingJourney] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  // Add Food Modal state
  const [isAddFoodOpen, setIsAddFoodOpen] = useState(false)
  const [submittingFood, setSubmittingFood] = useState(false)
  const [addFoodForm, setAddFoodForm] = useState({
    title: '',
    category: 'Cooked Meals',
    quantity: 20,
    unit: 'Servings',
    isVeg: true,
    expiryHours: 4,
    pickupAddress: 'Sector-4 Community Center, Main Road',
    pickupWindow: '11:00 AM - 5:00 PM',
    pickupInstructions: 'Please bring insulated thermal carriers.',
    imageUrl: '',
  })

  // Quantity and Status edit state for inspect modal
  const [editQuantityMode, setEditQuantityMode] = useState(false)
  const [editQuantityVal, setEditQuantityVal] = useState('')
  const [editStatusVal, setEditStatusVal] = useState('')
  const [isSavingListing, setIsSavingListing] = useState(false)

  const loadFoodListings = async () => {
    try {
      setLoading(true)
      const data = await adminService.getFoodListings({
        category: categoryFilter,
        status: statusFilter,
        vegOnly,
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
  }, [categoryFilter, statusFilter, vegOnly])

  // Filter listings by category, status, and veg
  const filteredListings = foodListings.filter((item) => {
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false
    if (statusFilter !== 'all') {
      const itemStatus = (item.status || '').toLowerCase()
      if (statusFilter === 'available' && itemStatus !== 'available') return false
      if (statusFilter === 'claimed' && !['claimed', 'in_progress', 'requested'].includes(itemStatus)) return false
      if (statusFilter === 'completed' && itemStatus !== 'completed') return false
      if (statusFilter === 'cancelled' && !['cancelled', 'expired'].includes(itemStatus)) return false
    }
    if (vegOnly && !item.isVeg) return false
    return true
  })

  // Open Inspect Modal
  const handleOpenInspect = (listing) => {
    setInspectItem(listing)
    // Extract numerical portions from quantity string (e.g. "20 Servings" -> 20)
    const num = parseInt(listing.quantity, 10) || listing.servings || 10
    setEditQuantityVal(num)
    setEditStatusVal((listing.status || 'Available').toLowerCase())
    setEditQuantityMode(false)
  }

  // Open Real Journey Modal
  const handleOpenJourney = async (listing) => {
    setJourneyItem(listing)
    setLoadingJourney(true)
    setJourneyData(null)
    try {
      const data = await adminService.getFoodJourney(listing.id || listing._id)
      setJourneyData(data)
    } catch (err) {
      console.warn('Failed to fetch food journey:', err)
      // Fallback journey representation
      setJourneyData({
        title: listing.title,
        donor: listing.donor,
        currentStatus: listing.status,
        stages: [
          {
            step: 1,
            title: `Food Listed by ${listing.donor}`,
            description: `${listing.quantity} of "${listing.title}" verified and posted.`,
            time: 'Earlier today',
            date: 'Today',
            status: 'completed',
            actor: listing.donor,
          },
          {
            step: 2,
            title: 'Active in Community Pool',
            description: 'Listed in community feed available for local NGOs and verified shelters.',
            time: 'Active',
            status: 'completed',
            actor: 'Platform Engine',
          },
          {
            step: 3,
            title: listing.status === 'Available' ? 'Awaiting Receiver Claim' : 'Claim Request Confirmed',
            description: listing.status === 'Available'
              ? 'Waiting for nearby NGO or community kitchen request.'
              : 'Claimed by registered NGO.',
            time: listing.status === 'Available' ? 'Current Stage' : 'Confirmed',
            status: listing.status === 'Available' ? 'in_progress' : 'completed',
            actor: 'Receiver Queue',
          },
          {
            step: 4,
            title: 'Courier Dispatch',
            description: listing.status === 'Available'
              ? 'Courier dispatch triggers immediately when claimed.'
              : 'Volunteer assigned for pickup.',
            time: 'Pending',
            status: 'pending',
            actor: 'Volunteer Fleet',
          },
          {
            step: 5,
            title: 'Final Handover & Verification',
            description: 'Final delivery verification & nutritional impact log.',
            time: 'Pending',
            status: 'pending',
            actor: 'Both Parties',
          },
        ],
      })
    } finally {
      setLoadingJourney(false)
    }
  }

  // Handle Add Food Form Submit
  const handleAddFoodSubmit = async (e) => {
    e.preventDefault()
    if (!addFoodForm.title.trim()) {
      alert('Please enter a food title.')
      return
    }
    if (Number(addFoodForm.quantity) <= 0) {
      alert('Quantity must be greater than 0.')
      return
    }

    try {
      setSubmittingFood(true)
      await adminService.createFoodListing(addFoodForm)
      setToastMessage(`✓ New food listing "${addFoodForm.title}" added with ${addFoodForm.quantity} ${addFoodForm.unit}!`)
      setIsAddFoodOpen(false)
      // Reset form
      setAddFoodForm({
        title: '',
        category: 'Cooked Meals',
        quantity: 20,
        unit: 'Servings',
        isVeg: true,
        expiryHours: 4,
        pickupAddress: 'Sector-4 Community Center, Main Road',
        pickupWindow: '11:00 AM - 5:00 PM',
        pickupInstructions: 'Please bring insulated thermal carriers.',
        imageUrl: '',
      })
      loadFoodListings()
    } catch (err) {
      setToastMessage(`Failed to add food listing: ${err.message}`)
    } finally {
      setSubmittingFood(false)
      setTimeout(() => setToastMessage(null), 4000)
    }
  }

  // Handle Save Quantity / Status from Inspect Modal
  const handleSaveListingUpdates = async () => {
    if (!inspectItem) return
    try {
      setIsSavingListing(true)
      const payload = {
        quantity: Number(editQuantityVal) || inspectItem.servings || 1,
        status: editStatusVal,
      }
      await adminService.updateFoodListing(inspectItem.id || inspectItem._id, payload)
      setToastMessage(`✓ Listing "${inspectItem.title}" updated: ${editQuantityVal} portions, status: ${editStatusVal}.`)
      setInspectItem((prev) => ({
        ...prev,
        quantity: `${editQuantityVal} ${prev.unit || 'Servings'}`,
        servings: Number(editQuantityVal),
        status: editStatusVal.charAt(0).toUpperCase() + editStatusVal.slice(1),
        statusClass: editStatusVal === 'available' ? 'text-[#2E7D32]' : 'text-[#E65100]',
      }))
      setEditQuantityMode(false)
      loadFoodListings()
    } catch (err) {
      setToastMessage(`Failed to update listing: ${err.message}`)
    } finally {
      setIsSavingListing(false)
      setTimeout(() => setToastMessage(null), 3500)
    }
  }

  // Handle Verify & Endorse Listing
  const handleVerifyAndEndorse = async () => {
    if (!inspectItem) return
    try {
      await adminService.updateFoodListing(inspectItem.id || inspectItem._id, {
        isEndorsed: true,
        status: 'available',
      })
      setToastMessage(`✓ Listing "${inspectItem.title}" officially endorsed and marked active!`)
      setInspectItem((prev) => ({
        ...prev,
        status: 'Available',
        statusClass: 'text-[#2E7D32]',
      }))
      loadFoodListings()
    } catch (err) {
      setToastMessage(`Failed to endorse listing: ${err.message}`)
    }
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Handle SOS Broadcast
  const handleBroadcastSOS = async () => {
    if (!sosModalItem) return
    try {
      await adminService.broadcastFoodSOS(sosModalItem.id || sosModalItem._id)
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

  // Helper status color classes
  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase()
    if (s === 'available') {
      return 'bg-emerald-50 text-[#2E7D32] border border-emerald-200/80'
    }
    if (s === 'claimed' || s === 'requested') {
      return 'bg-blue-50 text-[#1565C0] border border-blue-200/80'
    }
    if (s === 'in_progress' || s === 'in transit') {
      return 'bg-amber-50 text-amber-700 border border-amber-200/80'
    }
    if (s === 'completed') {
      return 'bg-purple-50 text-[#6A1B9A] border border-purple-200/80'
    }
    return 'bg-red-50 text-red-700 border border-red-200/80'
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ======================= HEADER ======================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1F2937] tracking-tight">
            Food Management & Inventory
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Track surplus listings, adjust portions, inspect safety, and view real delivery journeys
          </p>
        </div>
        <button
          onClick={() => setIsAddFoodOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold shadow-sm shadow-emerald-900/10 flex items-center justify-center space-x-1.5 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Food Listing</span>
        </button>
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
            <Clock className="w-5 h-5" />
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
            <Scale className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Total Diverted */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
              Total Diverted
            </span>
            <h3 className="text-3xl font-extrabold text-[#1F2937] mt-1">
              {(stats.totalDivertedKg ?? 0).toLocaleString()} kg
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#6A1B9A] flex items-center justify-center">
            <Leaf className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ======================= CATEGORY & STATUS FILTERS ======================= */}
      <div className="space-y-3 pt-1">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">Category:</span>
          {['all', 'Cooked Meals', 'Bakery', 'Fresh Produce', 'Dairy & Eggs', 'Packaged Goods'].map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-[#2E7D32] text-white shadow-xs'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {cat === 'all' ? 'All Categories' : cat}
              </button>
            )
          )}
        </div>

        {/* Status Filter & Diet Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">Status:</span>
            {[
              { id: 'all', label: 'All Status' },
              { id: 'available', label: 'Available' },
              { id: 'claimed', label: 'Claimed / In Transit' },
              { id: 'completed', label: 'Completed' },
              { id: 'cancelled', label: 'Cancelled / Expired' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === st.id
                    ? 'bg-gray-800 text-white shadow-2xs'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Veg / Non-Veg Toggle Pills */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setVegOnly(true)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                vegOnly
                  ? 'bg-emerald-100 text-[#2E7D32] border border-emerald-300'
                  : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              🌱 Veg Only
            </button>
            <button
              onClick={() => setVegOnly(false)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                !vegOnly
                  ? 'bg-emerald-100 text-[#2E7D32] border border-emerald-300'
                  : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              All Diets
            </button>
          </div>
        </div>
      </div>

      {/* ======================= 3-COLUMN FOOD CARD GRID ======================= */}
      {filteredListings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Leaf className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-gray-800">No Food Listings Found</h3>
          <p className="text-xs text-gray-500 mt-1">
            Try adjusting your category, status, or diet filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <div
              key={listing.id || listing._id}
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
                {/* Dietary badge */}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
                  {listing.isVeg ? '🌱 Veg' : '🍗 Non-Veg'}
                </div>
              </div>

              {/* Content Details */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-1">
                    {listing.title}
                  </h3>
                  <p className="text-xs text-gray-400 font-medium mt-0.5 truncate">{listing.donor}</p>

                  {/* Sub-grid of quantity & current status */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100 text-xs">
                    <div>
                      <span className="text-[11px] text-gray-400 block font-medium">
                        Quantity available
                      </span>
                      <span className="font-bold text-gray-900 text-sm">{listing.quantity}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-gray-400 block font-medium">
                        Current status
                      </span>
                      <span
                        className={`inline-block font-bold text-[11px] px-2 py-0.5 rounded-md mt-0.5 ${getStatusBadge(
                          listing.status
                        )}`}
                      >
                        {listing.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-5 pt-3 border-t border-gray-50 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenInspect(listing)}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Inspect listing
                  </button>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleOpenJourney(listing)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                      title="View real-time delivery journey"
                    >
                      View journey
                    </button>

                    {(listing.status || '').toLowerCase() === 'available' && (
                      <button
                        onClick={() => setSosModalItem(listing)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-2xs flex items-center space-x-1 transition-colors cursor-pointer"
                        title="Broadcast urgent SOS alert to nearby NGOs"
                      >
                        <Radio className="w-3.5 h-3.5" />
                        <span>SOS</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================= ADD FOOD LISTING MODAL ======================= */}
      {isAddFoodOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#2E7D32] flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Add Food Listing</h3>
                  <p className="text-xs text-gray-500">Register surplus food donation for community distribution</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddFoodOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddFoodSubmit} className="mt-4 space-y-4 text-xs">
              {/* Food Title */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Food Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cooked Rice & Dal, Assorted Bread, Fresh Apples"
                  value={addFoodForm.title}
                  onChange={(e) => setAddFoodForm({ ...addFoodForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#2E7D32] outline-none"
                />
              </div>

              {/* Category & Diet */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Category *</label>
                  <select
                    value={addFoodForm.category}
                    onChange={(e) => setAddFoodForm({ ...addFoodForm, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#2E7D32] outline-none bg-white"
                  >
                    <option value="Cooked Meals">Cooked Meals</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Fresh Produce">Fresh Produce</option>
                    <option value="Dairy & Eggs">Dairy & Eggs</option>
                    <option value="Packaged & Canned">Packaged & Canned</option>
                    <option value="Beverages & Other">Beverages & Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Dietary Type *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAddFoodForm({ ...addFoodForm, isVeg: true })}
                      className={`p-2 rounded-xl text-xs font-bold border ${
                        addFoodForm.isVeg
                          ? 'bg-emerald-50 text-[#2E7D32] border-emerald-300'
                          : 'bg-white text-gray-600 border-gray-200'
                      }`}
                    >
                      🌱 Veg
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddFoodForm({ ...addFoodForm, isVeg: false })}
                      className={`p-2 rounded-xl text-xs font-bold border ${
                        !addFoodForm.isVeg
                          ? 'bg-emerald-50 text-[#2E7D32] border-emerald-300'
                          : 'bg-white text-gray-600 border-gray-200'
                      }`}
                    >
                      🍗 Non-Veg
                    </button>
                  </div>
                </div>
              </div>

              {/* Quantity & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Quantity Available *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={addFoodForm.quantity}
                    onChange={(e) => setAddFoodForm({ ...addFoodForm, quantity: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#2E7D32] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Unit of Measure *</label>
                  <select
                    value={addFoodForm.unit}
                    onChange={(e) => setAddFoodForm({ ...addFoodForm, unit: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#2E7D32] outline-none bg-white"
                  >
                    <option value="Servings">Servings</option>
                    <option value="kg">kg (Kilograms)</option>
                    <option value="Boxes">Boxes</option>
                    <option value="Packets">Packets</option>
                    <option value="Meals">Meals</option>
                  </select>
                </div>
              </div>

              {/* Expiry / Best Before Hours */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Best Before / Expiry Window *</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[2, 4, 8, 24, 48].map((hrs) => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => setAddFoodForm({ ...addFoodForm, expiryHours: hrs })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center border ${
                        addFoodForm.expiryHours === hrs
                          ? 'bg-[#2E7D32] text-white border-[#2E7D32]'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {hrs < 24 ? `${hrs}h` : `${hrs / 24}d`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pickup Address & Window */}
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Pickup Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VIP Road Kitchen, Raipur"
                    value={addFoodForm.pickupAddress}
                    onChange={(e) => setAddFoodForm({ ...addFoodForm, pickupAddress: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#2E7D32] outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Pickup Window</label>
                    <input
                      type="text"
                      placeholder="e.g. 10:00 AM - 4:00 PM"
                      value={addFoodForm.pickupWindow}
                      onChange={(e) => setAddFoodForm({ ...addFoodForm, pickupWindow: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#2E7D32] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Image URL (Optional)</label>
                    <input
                      type="text"
                      placeholder="Paste online image link"
                      value={addFoodForm.imageUrl}
                      onChange={(e) => setAddFoodForm({ ...addFoodForm, imageUrl: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#2E7D32] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Preparation & Handling Instructions</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Keep warm until pickup. Packed in food-grade aluminum foils."
                    value={addFoodForm.pickupInstructions}
                    onChange={(e) => setAddFoodForm({ ...addFoodForm, pickupInstructions: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#2E7D32] outline-none"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddFoodOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingFood}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#2E7D32] hover:bg-[#1B5E20] text-white shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submittingFood ? 'Publishing...' : 'Publish Food Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= INSPECT LISTING MODAL ======================= */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Food Listing Inspection</h3>
              <button
                onClick={() => setInspectItem(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Image & Header */}
              <div className="flex items-center space-x-3.5">
                <img
                  src={getFoodImageUrl(inspectItem.imageUrl, inspectItem.category)}
                  alt={inspectItem.title}
                  onError={(e) => handleImageError(e, inspectItem.category)}
                  className="w-20 h-20 rounded-xl object-cover border border-gray-200 shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-base font-bold text-gray-900 leading-snug">{inspectItem.title}</h4>
                  <p className="text-gray-500 font-medium text-xs mt-0.5">{inspectItem.donor}</p>
                  <div className="flex items-center space-x-2 mt-1.5">
                    <span className="text-[11px] font-semibold text-[#2E7D32] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {inspectItem.category} • {inspectItem.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${getStatusBadge(inspectItem.status)}`}>
                      {inspectItem.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Editable Quantity & Status Box */}
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800 text-xs">Manage Quantity & Current Status:</span>
                  {!editQuantityMode && (
                    <button
                      onClick={() => setEditQuantityMode(true)}
                      className="text-xs font-bold text-[#2E7D32] hover:underline flex items-center space-x-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Portion / Status</span>
                    </button>
                  )}
                </div>

                {editQuantityMode ? (
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                          Quantity (Servings):
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={editQuantityVal}
                          onChange={(e) => setEditQuantityVal(e.target.value)}
                          className="w-full p-2 bg-white rounded-lg border border-gray-300 text-xs font-bold outline-none focus:ring-2 focus:ring-[#2E7D32]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                          Current Status:
                        </label>
                        <select
                          value={editStatusVal}
                          onChange={(e) => setEditStatusVal(e.target.value)}
                          className="w-full p-2 bg-white rounded-lg border border-gray-300 text-xs font-bold outline-none focus:ring-2 focus:ring-[#2E7D32]"
                        >
                          <option value="available">Available</option>
                          <option value="claimed">Claimed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center justify-end space-x-2 pt-1">
                      <button
                        onClick={() => setEditQuantityMode(false)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveListingUpdates}
                        disabled={isSavingListing}
                        className="px-3.5 py-1 rounded-lg text-xs font-bold bg-[#2E7D32] hover:bg-[#1B5E20] text-white flex items-center space-x-1"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSavingListing ? 'Saving...' : 'Save Updates'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500 block text-[11px]">Recorded Quantity:</span>
                      <span className="font-extrabold text-gray-900 text-sm">{inspectItem.quantity}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[11px]">System Status:</span>
                      <span className="font-extrabold text-gray-900 text-sm">{inspectItem.status}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Details table */}
              <div className="p-3.5 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
                <div className="flex justify-between">
                  <span className="text-gray-500">Pickup Address:</span>
                  <span className="font-semibold text-gray-800 text-right">{inspectItem.city || inspectItem.pickupAddress}</span>
                </div>
                {inspectItem.donorPhone && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Donor Phone:</span>
                    <span className="font-semibold text-gray-800">{inspectItem.donorPhone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Packaging Type:</span>
                  <span className="font-semibold text-gray-800">{inspectItem.packaging}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Expiration Time:</span>
                  <span className="font-semibold text-red-600">{inspectItem.expiryLabel}</span>
                </div>
              </div>

              {/* Instructions */}
              <div>
                <span className="font-bold text-gray-700 block mb-1">
                  Preparation & Safety Instructions:
                </span>
                <p className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-gray-700 leading-relaxed text-xs">
                  {inspectItem.specialInstructions}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between pt-3 border-t border-gray-100">
              <button
                onClick={() => handleDeleteListing(inspectItem.id || inspectItem._id, inspectItem.title)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 flex items-center space-x-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Cancel Listing</span>
              </button>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setInspectItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={handleVerifyAndEndorse}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#2E7D32] hover:bg-[#1B5E20] text-white flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify & Endorse</span>
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
              <p>• Verified Shelters & Community Kitchens in Range</p>
              <p>• On-Duty Volunteer Couriers</p>
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
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#2E7D32] hover:bg-[#1B5E20] text-white flex items-center space-x-1.5 shadow-2xs cursor-pointer"
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
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1565C0] flex items-center justify-center font-bold">
                  <Navigation className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Food Lifecycle & Delivery Journey</h3>
                  <p className="text-xs text-gray-500">{journeyItem.title}</p>
                </div>
              </div>
              <button
                onClick={() => setJourneyItem(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingJourney ? (
              <div className="py-12 text-center text-xs text-gray-400">
                Loading real-time delivery journey...
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {/* Status overview pill */}
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-gray-400 block text-[11px]">Current Status:</span>
                    <span className="font-bold text-gray-900">{journeyData?.currentStatus || journeyItem.status}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Quantity:</span>
                    <span className="font-bold text-[#2E7D32]">{journeyData?.quantity || journeyItem.quantity}</span>
                  </div>
                  {journeyData?.volunteer && (
                    <div>
                      <span className="text-gray-400 block text-[11px]">Courier:</span>
                      <span className="font-bold text-gray-800">{journeyData.volunteer}</span>
                    </div>
                  )}
                </div>

                {/* Vertical Step Timeline */}
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                  {(journeyData?.stages || []).map((st, idx) => {
                    const isCompleted = st.status === 'completed'
                    const isInProgress = st.status === 'in_progress'

                    return (
                      <div key={idx} className="relative">
                        {/* Dot indicator */}
                        <div
                          className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isCompleted
                              ? 'bg-[#2E7D32] text-white ring-4 ring-emerald-50'
                              : isInProgress
                              ? 'bg-blue-600 text-white ring-4 ring-blue-50 animate-pulse'
                              : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {isCompleted ? '✓' : idx + 1}
                        </div>

                        {/* Stage details */}
                        <div className="text-xs">
                          <div className="flex items-center justify-between">
                            <h4
                              className={`font-bold ${
                                isCompleted
                                  ? 'text-gray-900'
                                  : isInProgress
                                  ? 'text-blue-700'
                                  : 'text-gray-400'
                              }`}
                            >
                              {st.title}
                            </h4>
                            <span className="text-[10px] text-gray-400 font-mono">{st.time}</span>
                          </div>
                          <p className="text-gray-500 mt-0.5 leading-relaxed">{st.description}</p>
                          {st.actor && (
                            <span className="inline-block text-[10px] font-semibold text-gray-400 mt-1">
                              Logged by: {st.actor}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end pt-3 border-t border-gray-100">
              <button
                onClick={() => setJourneyItem(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
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
