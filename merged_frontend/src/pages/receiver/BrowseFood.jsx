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
  ArrowLeft,
  Building2,
  ShoppingBag,
  Plus,
  Minus,
  ChevronRight,
} from 'lucide-react'
import receiverService from '../../services/receiverService'
import { RequestFoodModal } from '../../components/receiver/ReceiverModals'
import {
  BasketFloatingButton,
  BasketDrawer,
  SwitchCommunityModal,
} from '../../components/receiver/BasketDrawer'
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

  // Community selection state (null = show all communities)
  const [selectedCommunityId, setSelectedCommunityId] = useState(null)
  const [communitySearchTerm, setCommunitySearchTerm] = useState('')
  const [communityCategory, setCommunityCategory] = useState('All')

  // Request Modal state (for existing individual single-item food claim)
  const [selectedListing, setSelectedListing] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submittingRequest, setSubmittingRequest] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // Multi-item Basket state
  const [basket, setBasket] = useState({
    donorId: null,
    donorName: '',
    items: [], // [{ listing, quantity }]
  })
  const [isBasketOpen, setIsBasketOpen] = useState(false)
  const [pendingSwitchData, setPendingSwitchData] = useState(null)

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

  // Group listings into communities
  const communities = useMemo(() => {
    const map = new Map()
    for (const item of listings) {
      const key = item.donorId || item.donor || 'unknown_community'
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          donorId: item.donorId,
          name: item.donor,
          donorOrganization: item.donorOrganization || item.donor,
          donorAvatar: item.donorAvatar,
          city: item.donorCity,
          pickupAddress: item.pickupAddress,
          distance: item.distance,
          distanceVal: item.distanceVal,
          items: [],
          categories: new Set(),
          deliveryTypes: new Set(),
        })
      }
      const comm = map.get(key)
      comm.items.push(item)
      if (item.category) comm.categories.add(item.category)
      if (item.deliveryType) comm.deliveryTypes.add(item.deliveryType)
    }

    return Array.from(map.values()).map((c) => ({
      ...c,
      categories: Array.from(c.categories),
      deliveryTypes: Array.from(c.deliveryTypes),
      availableCount: c.items.length,
    }))
  }, [listings])

  // Currently selected community object (if any)
  const activeCommunity = useMemo(() => {
    if (!selectedCommunityId) return null
    return communities.find((c) => c.id === selectedCommunityId) || null
  }, [communities, selectedCommunityId])

  // Food items for the selected community with internal search/category filter
  const communityFilteredItems = useMemo(() => {
    if (!activeCommunity) return []
    let items = activeCommunity.items
    if (communityCategory && communityCategory !== 'All') {
      items = items.filter((it) => it.category === communityCategory)
    }
    if (communitySearchTerm && communitySearchTerm.trim()) {
      const q = communitySearchTerm.toLowerCase().trim()
      items = items.filter(
        (it) =>
          it.title?.toLowerCase().includes(q) ||
          it.description?.toLowerCase().includes(q)
      )
    }
    return items
  }, [activeCommunity, communityCategory, communitySearchTerm])

  // --- Basket Management Logic ---
  const handleAddToBasket = (listing, quantityToAdd = 1) => {
    const listingDonorId = listing.donorId || listing.donor
    const listingDonorName = listing.donor

    // If basket has items from a different community, prompt before clearing
    if (
      basket.items.length > 0 &&
      basket.donorId &&
      basket.donorId !== listingDonorId
    ) {
      setPendingSwitchData({ listing, quantityToAdd })
      return
    }

    applyAddToBasket(listing, quantityToAdd)
  }

  const applyAddToBasket = (listing, quantityToAdd = 1) => {
    const listingDonorId = listing.donorId || listing.donor
    const listingDonorName = listing.donor
    const maxServings = listing.servings || listing.quantity || 1

    setBasket((prev) => {
      const existingIdx = prev.items.findIndex(
        (it) => it.listing._id === listing._id
      )
      let newItems = [...prev.items]

      if (existingIdx >= 0) {
        const curQty = newItems[existingIdx].quantity
        const nextQty = Math.min(curQty + quantityToAdd, maxServings)
        newItems[existingIdx] = {
          ...newItems[existingIdx],
          quantity: nextQty,
        }
      } else {
        newItems.push({
          listing,
          quantity: Math.min(quantityToAdd, maxServings),
        })
      }

      return {
        donorId: listingDonorId,
        donorName: listingDonorName,
        items: newItems,
      }
    })

    setToastMessage(`Added "${listing.title}" to basket.`)
    setTimeout(() => setToastMessage(''), 3000)
  }

  const handleConfirmSwitchCommunity = () => {
    if (!pendingSwitchData) return
    const { listing, quantityToAdd } = pendingSwitchData
    setPendingSwitchData(null)

    // Clear basket and add the new item
    const listingDonorId = listing.donorId || listing.donor
    const listingDonorName = listing.donor
    const maxServings = listing.servings || listing.quantity || 1

    setBasket({
      donorId: listingDonorId,
      donorName: listingDonorName,
      items: [
        {
          listing,
          quantity: Math.min(quantityToAdd, maxServings),
        },
      ],
    })

    setToastMessage(`Started a new basket with ${listingDonorName}.`)
    setTimeout(() => setToastMessage(''), 3500)
  }

  const handleUpdateBasketQuantity = (listingId, newQty) => {
    setBasket((prev) => {
      if (newQty <= 0) {
        const remaining = prev.items.filter((it) => it.listing._id !== listingId)
        return {
          ...prev,
          donorId: remaining.length === 0 ? null : prev.donorId,
          donorName: remaining.length === 0 ? '' : prev.donorName,
          items: remaining,
        }
      }

      const updated = prev.items.map((it) => {
        if (it.listing._id === listingId) {
          const maxQty = it.listing.servings || it.listing.quantity || 1
          return { ...it, quantity: Math.min(Math.max(1, newQty), maxQty) }
        }
        return it
      })
      return { ...prev, items: updated }
    })
  }

  const handleRemoveFromBasket = (listingId) => {
    setBasket((prev) => {
      const remaining = prev.items.filter((it) => it.listing._id !== listingId)
      return {
        ...prev,
        donorId: remaining.length === 0 ? null : prev.donorId,
        donorName: remaining.length === 0 ? '' : prev.donorName,
        items: remaining,
      }
    })
  }

  const handleClearBasket = () => {
    setBasket({ donorId: null, donorName: '', items: [] })
    setToastMessage('Basket cleared.')
    setTimeout(() => setToastMessage(''), 2500)
  }

  // Submit combined basket request
  const handleSubmitBasketRequest = async (requestPayload) => {
    try {
      setSubmittingRequest(true)
      await receiverService.createRequest(requestPayload)
      // Clear basket only after successful request creation
      setBasket({ donorId: null, donorName: '', items: [] })
      setIsBasketOpen(false)
      setToastMessage('Combined food request submitted successfully! Awaiting donor review.')
      setTimeout(() => setToastMessage(''), 5000)
      if (refreshBadges) refreshBadges()
      fetchListings()
    } catch (err) {
      alert(err.message || 'Failed to submit basket request.')
    } finally {
      setSubmittingRequest(false)
    }
  }

  // --- Single Food Request (Preserves existing direct claim flow) ---
  const handleOpenRequestModal = (listing) => {
    setSelectedListing(listing)
    setIsModalOpen(true)
  }

  const handleSubmitSingleRequest = async (requestData) => {
    try {
      setSubmittingRequest(true)
      await receiverService.createRequest(requestData)
      setIsModalOpen(false)
      setToastMessage('Food request submitted successfully! Awaiting donor review.')
      setTimeout(() => setToastMessage(''), 4500)
      if (refreshBadges) refreshBadges()
      fetchListings()
    } catch (err) {
      alert(err.message || 'Failed to submit request.')
    } finally {
      setSubmittingRequest(false)
    }
  }

  return (
    <div className="space-y-6 relative pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-[#2E7D32] text-white rounded-xl shadow-xl text-xs font-semibold animate-in slide-in-from-top-4">
          <Check className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Geolocation Notice Banner */}
      {locationDenied && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
          <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Location access is turned off or unavailable. Distances cannot be calculated accurately and will appear as &ldquo;Distance unavailable&rdquo;.
          </span>
        </div>
      )}

      {/* VIEW 1: COMMUNITY LISTING (When no community is selected) */}
      {!selectedCommunityId && (
        <div className="space-y-6">
          {/* Filter Bar: Search + Distance Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search community or food item..."
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

          {/* Header Description */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Communities & Donor Organizations
              </h2>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Select a community to browse available food donations and build your basket.
              </p>
            </div>
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {communities.length} {communities.length === 1 ? 'Community' : 'Communities'}
            </span>
          </div>

          {/* Communities Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-gray-200 h-64 animate-pulse p-5 space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-10 bg-gray-200 rounded-xl" />
                  <div className="h-10 bg-gray-200 rounded-xl" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-red-100">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-800">{error}</p>
              <button
                onClick={fetchListings}
                className="mt-3 px-4 py-2 bg-[#2E7D32] text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : communities.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-gray-200">
              <Building2 className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-800">
                No Communities with Available Food
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Try widening your distance radius or clearing category filters to find communities with active donations.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communities.map((community) => (
                <CommunityCard
                  key={community.id}
                  community={community}
                  onSelect={() => setSelectedCommunityId(community.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: SELECTED COMMUNITY FOOD LISTING */}
      {selectedCommunityId && activeCommunity && (
        <div className="space-y-6">
          {/* Back to Communities Navigation & Community Header */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 sm:p-5 shadow-xs space-y-4">
            <button
              onClick={() => setSelectedCommunityId(null)}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-600 hover:text-[#2E7D32] transition-colors cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>Back to Communities</span>
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <div className="flex items-center gap-3.5">
                {activeCommunity.donorAvatar ? (
                  <img
                    src={activeCommunity.donorAvatar}
                    alt={activeCommunity.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-emerald-100 shadow-2xs"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-[#2E7D32]/10 text-[#2E7D32] font-extrabold text-xl flex items-center justify-center shrink-0 border border-emerald-100">
                    {activeCommunity.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 leading-tight">
                    {activeCommunity.name}
                  </h1>
                  <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>{activeCommunity.distance}</span>
                    {activeCommunity.pickupAddress && (
                      <>
                        <span>•</span>
                        <span className="line-clamp-1">{activeCommunity.pickupAddress}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-[#2E7D32] border border-emerald-200">
                  <Utensils className="w-3.5 h-3.5" />
                  {activeCommunity.availableCount} {activeCommunity.availableCount === 1 ? 'Available Item' : 'Available Items'}
                </span>
              </div>
            </div>
          </div>

          {/* Sub-Search & Category Filters for Selected Community */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={communitySearchTerm}
                onChange={(e) => setCommunitySearchTerm(e.target.value)}
                placeholder={`Search food inside ${activeCommunity.name}...`}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] shadow-2xs transition-all"
              />
            </div>

            {/* Category pills within this community */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {['All', ...activeCommunity.categories].map((cat) => {
                const isActive = communityCategory === cat
                return (
                  <button
                    key={cat}
                    onClick={() => setCommunityCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
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
          </div>

          {/* Community Food Grid */}
          {communityFilteredItems.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-gray-200">
              <Utensils className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-800">
                No matching food items in this community
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Try clearing your search term or selecting another category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communityFilteredItems.map((item) => {
                // Check if this item is currently in the basket
                const basketItem = basket.items.find(
                  (it) => it.listing._id === item._id
                )
                const basketQty = basketItem ? basketItem.quantity : 0

                return (
                  <FoodCard
                    key={item._id}
                    listing={item}
                    now={now}
                    basketQuantity={basketQty}
                    onAddToBasket={() => handleAddToBasket(item, 1)}
                    onUpdateBasketQty={(newQty) =>
                      handleUpdateBasketQuantity(item._id, newQty)
                    }
                    onRequestSingle={() => handleOpenRequestModal(item)}
                  />
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Floating Basket Button (Visible whenever basket has items) */}
      <BasketFloatingButton
        basket={basket}
        onClick={() => setIsBasketOpen(true)}
      />

      {/* Slide-over / Modal Basket Drawer */}
      <BasketDrawer
        isOpen={isBasketOpen}
        onClose={() => setIsBasketOpen(false)}
        basket={basket}
        onUpdateQuantity={handleUpdateBasketQuantity}
        onRemoveItem={handleRemoveFromBasket}
        onClearBasket={handleClearBasket}
        onSubmitRequest={handleSubmitBasketRequest}
        isSubmitting={submittingRequest}
      />

      {/* Switch Community Confirmation Dialog */}
      <SwitchCommunityModal
        isOpen={Boolean(pendingSwitchData)}
        currentCommunityName={basket.donorName}
        newCommunityName={pendingSwitchData?.listing?.donor}
        onConfirmSwitch={handleConfirmSwitchCommunity}
        onCancel={() => setPendingSwitchData(null)}
      />

      {/* Request Food Modal (for individual single-item direct request flow) */}
      <RequestFoodModal
        listing={selectedListing}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitSingleRequest}
        isSubmitting={submittingRequest}
      />
    </div>
  )
}

/**
 * Community Card component displayed on initial browse view
 */
function CommunityCard({ community, onSelect }) {
  const initial = community.name ? community.name.charAt(0).toUpperCase() : 'C'

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
      <div className="space-y-3">
        {/* Top: Avatar/Logo + Name & Distance */}
        <div className="flex items-center gap-3.5">
          {community.donorAvatar ? (
            <img
              src={community.donorAvatar}
              alt={community.name}
              className="w-12 h-12 rounded-xl object-cover border border-emerald-100 shadow-2xs shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-[#2E7D32]/10 text-[#2E7D32] font-bold text-lg flex items-center justify-center shrink-0 border border-emerald-100">
              {initial}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-1">
              {community.name}
            </h3>
            <p className="text-xs font-medium text-gray-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>{community.distance}</span>
            </p>
          </div>
        </div>

        {/* Available Food Count Pill */}
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-[#2E7D32] border border-emerald-200">
            <Utensils className="w-3.5 h-3.5" />
            <span>{community.availableCount} available {community.availableCount === 1 ? 'food item' : 'food items'}</span>
          </span>
        </div>

        {/* Categories preview */}
        {community.categories.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap text-[11px] pt-1">
            {community.categories.slice(0, 3).map((cat, idx) => (
              <span
                key={idx}
                className="px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium"
              >
                {cat}
              </span>
            ))}
            {community.categories.length > 3 && (
              <span className="text-[11px] text-gray-400 font-medium">
                +{community.categories.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* View Food Action Button */}
      <button
        onClick={onSelect}
        className="w-full py-2.5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 group"
      >
        <span>View Food</span>
        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  )
}

/**
 * Enhanced Food Card with Add to Basket and Request Food buttons
 */
function FoodCard({
  listing,
  now,
  basketQuantity,
  onAddToBasket,
  onUpdateBasketQty,
  onRequestSingle,
}) {
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

  const maxServings = listing.servings || listing.quantity || 1

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
            {listing.initialServings && listing.initialServings > listing.servings ? (
              <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                {formatQuantityUnit(listing.servings, listing.unit)} left
              </span>
            ) : listing.servings <= 3 ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-[#2E7D32] border border-emerald-200 font-bold">
                {formatQuantityUnit(listing.servings, listing.unit)} left
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold">
                {formatQuantityUnit(listing.servings, listing.unit)}
              </span>
            )}
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

      {/* Card Action Buttons: Add to Basket + Request Food */}
      <div className="p-4 pt-0 space-y-2">
        {/* Add to Basket Action / Stepper */}
        {basketQuantity > 0 ? (
          <div className="flex items-center justify-between p-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
            <span className="text-xs font-bold text-[#2E7D32] pl-2">
              In Basket: {formatQuantityUnit(basketQuantity, listing.unit)}
            </span>
            <div className="flex items-center gap-1 bg-white border border-emerald-200 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => onUpdateBasketQty(basketQuantity - 1)}
                className="w-6 h-6 flex items-center justify-center text-[#2E7D32] hover:bg-emerald-50 rounded cursor-pointer"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-6 text-center text-xs font-bold text-gray-900">
                {basketQuantity}
              </span>
              <button
                type="button"
                onClick={() => onUpdateBasketQty(basketQuantity + 1)}
                disabled={basketQuantity >= maxServings}
                className="w-6 h-6 flex items-center justify-center text-[#2E7D32] hover:bg-emerald-50 disabled:opacity-30 rounded cursor-pointer"
                aria-label="Increase quantity"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={onAddToBasket}
            disabled={isExpired}
            className="w-full py-2 rounded-xl border border-[#2E7D32] text-[#2E7D32] hover:bg-emerald-50 disabled:border-gray-200 disabled:text-gray-400 text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add to Basket</span>
          </button>
        )}

        {/* Existing direct individual request button */}
        <button
          onClick={onRequestSingle}
          disabled={isExpired}
          className="w-full py-2 bg-[#2E7D32] hover:bg-[#1B5E20] disabled:bg-gray-300 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          Request Food
        </button>
      </div>
    </div>
  )
}
