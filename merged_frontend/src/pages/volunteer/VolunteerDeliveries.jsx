import { useState, useEffect } from 'react'
import { useSearchParams, useOutletContext } from 'react-router-dom'
import {
  Truck,
  Package,
  MapPin,
  Phone,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Clock,
  ArrowRight,
  RefreshCw,
  KeyRound,
  Check,
  Bike,
  ChevronDown,
  Navigation,
} from 'lucide-react'
import { volunteerService } from '../../services/volunteerService'
import LiveTrackingMap from '../../components/common/LiveTrackingMap'
import PhoneContactModal from '../../components/volunteer/PhoneContactModal'
import {
  formatQuantityUnit,
  getPackageWeightKg,
  getFoodHeading,
  getCombinedFoodTitle,
  isCombinedBasket,
  getOrderItems,
  getTotalUnits,
} from '../../utils/unitHelper'
import CombinedItemsBreakdown from '../../components/common/CombinedItemsBreakdown'

export default function VolunteerDeliveries() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { onRefreshCounts } = useOutletContext() || {}

  const initialTab = searchParams.get('tab') === 'upcoming' ? 'upcoming' : searchParams.get('tab') === 'completed' ? 'completed' : 'active'
  const [activeTab, setActiveTab] = useState(initialTab)

  const [activeDeliveries, setActiveDeliveries] = useState([])
  const [completedDeliveries, setCompletedDeliveries] = useState([])
  const [availableList, setAvailableList] = useState([])
  const [loading, setLoading] = useState(true)
  const [phoneModal, setPhoneModal] = useState(null)

  // Verification Code inputs
  // 4 digit inputs for pickup code
  const [pickupDigits, setPickupDigits] = useState(['', '', '', ''])
  // 4 digit inputs for delivery code
  const [deliveryDigits, setDeliveryDigits] = useState(['', '', '', ''])

  const [pickupSubmitting, setPickupSubmitting] = useState(false)
  const [deliverySubmitting, setDeliverySubmitting] = useState(false)
  const [claimLoadingId, setClaimLoadingId] = useState(null)
  const [transitLoading, setTransitLoading] = useState(false)

  // Vehicle Switcher States (Task-specific, does not modify volunteer profile)
  const [switchingVehicle, setSwitchingVehicle] = useState(false)
  const [isVehicleSwitcherOpen, setIsVehicleSwitcherOpen] = useState(false)
  const [selectedVehicleByTask, setSelectedVehicleByTask] = useState({})

  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const loadData = async () => {
    try {
      setLoading(true)
      setErrorMessage('')
      const [myDelivsRes, availRes] = await Promise.all([
        volunteerService.getMyDeliveries('all').catch(() => null),
        volunteerService.getAvailableDeliveries().catch(() => null),
      ])

      const allMy = myDelivsRes?.data?.deliveries || []
      const activeOnly = allMy
        .filter((d) =>
          ['volunteer_assigned', 'picked_up_by_volunteer', 'picked_up', 'out_for_delivery', 'in_transit'].includes(
            d.status
          )
        )
        .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))

      // Recently completed deliveries at the top, older ones at the bottom
      const compOnly = allMy
        .filter((d) => ['completed', 'delivered'].includes(d.status))
        .sort((a, b) => new Date(b.deliveredAt || b.updatedAt || b.createdAt || 0) - new Date(a.deliveredAt || a.updatedAt || a.createdAt || 0))

      const availOnly = (availRes?.data?.deliveries || []).sort(
        (a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0)
      )

      setActiveDeliveries(activeOnly)
      setCompletedDeliveries(compOnly)
      setAvailableList(availOnly)
    } catch (err) {
      console.error('Error fetching deliveries:', err)
      setErrorMessage('Failed to load deliveries. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Auto-dismiss toast alerts
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  // Handle Digit changes
  const handleDigitChange = (index, value, type) => {
    const clean = value.replace(/[^0-9]/g, '').slice(-1)
    if (type === 'pickup') {
      const newDigits = [...pickupDigits]
      newDigits[index] = clean
      setPickupDigits(newDigits)
      if (clean && index < 3) {
        document.getElementById(`p-digit-${index + 1}`)?.focus()
      }
    } else {
      const newDigits = [...deliveryDigits]
      newDigits[index] = clean
      setDeliveryDigits(newDigits)
      if (clean && index < 3) {
        document.getElementById(`d-digit-${index + 1}`)?.focus()
      }
    }
  }

  const handleDigitKeyDown = (index, e, type) => {
    if (e.key === 'Backspace') {
      if (type === 'pickup' && !pickupDigits[index] && index > 0) {
        document.getElementById(`p-digit-${index - 1}`)?.focus()
      } else if (type === 'delivery' && !deliveryDigits[index] && index > 0) {
        document.getElementById(`d-digit-${index - 1}`)?.focus()
      }
    }
  }

  // Submit Donor Pickup Code
  const handleVerifyPickup = async (e, deliveryId) => {
    e.preventDefault()
    const entered = pickupDigits.join('').trim()
    if (entered.length !== 4) {
      setErrorMessage('Please enter all 4 digits of the donor pickup code.')
      return
    }

    try {
      setPickupSubmitting(true)
      setErrorMessage('')
      await volunteerService.verifyPickup(deliveryId, entered)
      setSuccessMessage('Food pickup verified successfully! Food is now in your custody.')
      setPickupDigits(['', '', '', ''])
      if (onRefreshCounts) onRefreshCounts()
      await loadData()
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message ||
          'Invalid verification code. Please ask the donor for the correct code.'
      )
    } finally {
      setPickupSubmitting(false)
    }
  }

  // Start Transit / Out for delivery
  const handleStartTransit = async (deliveryId) => {
    try {
      setTransitLoading(true)
      setErrorMessage('')
      await volunteerService.startDelivery(deliveryId)
      setSuccessMessage('Status updated: You are now en route to the receiver!')
      if (onRefreshCounts) onRefreshCounts()
      await loadData()
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to update delivery status.')
    } finally {
      setTransitLoading(false)
    }
  }

  // Submit Receiver Delivery Code
  const handleVerifyDelivery = async (e, deliveryId) => {
    e.preventDefault()
    const entered = deliveryDigits.join('').trim()
    if (entered.length !== 4) {
      setErrorMessage('Please enter all 4 digits of the receiver delivery code.')
      return
    }

    try {
      setDeliverySubmitting(true)
      setErrorMessage('')
      await volunteerService.verifyDelivery(deliveryId, entered)
      setSuccessMessage('Exchange completed successfully! Thank you for delivering meals to the community.')
      setDeliveryDigits(['', '', '', ''])
      if (onRefreshCounts) onRefreshCounts()
      await loadData()
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message ||
          'Invalid verification code. Please ask the receiver for the correct code.'
      )
    } finally {
      setDeliverySubmitting(false)
    }
  }

  // Claim Available Task from Pool (Supports task-specific vehicle selection & live location)
  const handleAcceptTask = async (deliveryId, transportType = 'bicycle') => {
    try {
      setClaimLoadingId(deliveryId)
      setErrorMessage('')
      const acceptPayload = { transportType }
      if (volunteerLiveCoords?.lat != null && volunteerLiveCoords?.lng != null) {
        acceptPayload.lat = volunteerLiveCoords.lat
        acceptPayload.lng = volunteerLiveCoords.lng
      }
      await volunteerService.acceptDelivery(deliveryId, acceptPayload)
      setSuccessMessage(
        `Task claimed with ${transportType.charAt(0).toUpperCase() + transportType.slice(1)}! Please proceed to pickup.`
      )
      setActiveTab('active')
      if (onRefreshCounts) onRefreshCounts()
      await loadData()
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'This task was already claimed or is no longer available.'
      )
    } finally {
      setClaimLoadingId(null)
    }
  }

  // Switch Vehicle for Active Delivery Only (Does not modify volunteer permanent profile)
  const handleSwitchActiveTransport = async (newVehicle) => {
    if (!currentRun?._id || newVehicle === currentRun.volunteerInfo?.transportType) {
      setIsVehicleSwitcherOpen(false)
      return
    }
    try {
      setSwitchingVehicle(true)
      setErrorMessage('')
      await volunteerService.switchDeliveryTransport(currentRun._id, newVehicle)
      setSuccessMessage(
        `Delivery vehicle updated to ${newVehicle.charAt(0).toUpperCase() + newVehicle.slice(1)} for this task! Your profile default remains unchanged.`
      )
      if (currentRun.volunteerInfo) {
        currentRun.volunteerInfo.transportType = newVehicle
      }
      await loadData()
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to switch vehicle for this delivery.')
    } finally {
      setSwitchingVehicle(false)
      setIsVehicleSwitcherOpen(false)
    }
  }

  const currentRun = activeDeliveries.length > 0 ? activeDeliveries[0] : null
  const [volunteerLiveCoords, setVolunteerLiveCoords] = useState(null)

  useEffect(() => {
    if (!currentRun?._id) return

    let watchId = null
    if (typeof window !== 'undefined' && navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6)),
            heading: pos.coords.heading,
          }
          setVolunteerLiveCoords(coords)
          volunteerService.updateLocation(currentRun._id, coords).catch(() => {})
        },
        () => {},
        { enableHighAccuracy: true, timeout: 6000 }
      )

      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coords = {
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6)),
            heading: pos.coords.heading,
          }
          setVolunteerLiveCoords(coords)
          volunteerService.updateLocation(currentRun._id, coords).catch(() => {})
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 8000, timeout: 10000 }
      )
    }

    return () => {
      if (watchId != null && navigator?.geolocation) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [currentRun?._id])

  const isPickedUp =
    currentRun &&
    ['picked_up_by_volunteer', 'picked_up', 'out_for_delivery', 'in_transit'].includes(
      currentRun.status
    )
  const isEnRoute =
    currentRun &&
    (['out_for_delivery', 'in_transit'].includes(currentRun.status) ||
      currentRun.volunteerStatus === 'in_transit' ||
      currentRun.status === 'picked_up_by_volunteer')

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight">
            My Deliveries
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Manage your active food rescue run and available volunteer pool tasks
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 self-start sm:self-auto px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors shadow-2xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'active'
              ? 'bg-[#2E7D32] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Active Run</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full ${
              activeTab === 'active' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {activeDeliveries.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'upcoming'
              ? 'bg-[#2E7D32] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Upcoming / Queued</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full ${
              activeTab === 'upcoming' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {availableList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'completed'
              ? 'bg-[#2E7D32] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          <span>Completed</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full ${
              activeTab === 'completed' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-800'
            }`}
          >
            {completedDeliveries.length}
          </span>
        </button>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
          <button onClick={() => setErrorMessage('')} className="text-red-400 hover:text-red-600">
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-[#2E7D32] shrink-0 mt-0.5" />
          <div className="flex-1">{successMessage}</div>
          <button
            onClick={() => setSuccessMessage('')}
            className="text-emerald-400 hover:text-emerald-600"
          >
            ×
          </button>
        </div>
      )}

      {/* Tab 1: Active Run */}
      {activeTab === 'active' && (
        <div>
          {currentRun ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 sm:p-8 space-y-7">
              {/* Top Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-gray-400 uppercase">
                      IN PROGRESS · #{currentRun.orderNo || currentRun._id.slice(-6).toUpperCase()}
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      {isEnRoute
                        ? 'En Route to Receiver'
                        : isPickedUp
                        ? 'Food Picked Up — Ready for Transit'
                        : 'Pickup Verification In-Progress'}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-1.5">
                    {getFoodHeading(currentRun, 'volunteer')}
                  </h3>
                  <CombinedItemsBreakdown items={getOrderItems(currentRun)} />
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isPickedUp ? 'Deliver food to recipient shelter' : 'Collect food package from donor'}
                  </p>

                  {/* Task-Specific Vehicle Badge & Live Switcher (Change 3) */}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                      <span className="text-gray-500 font-medium">Task Vehicle:</span>
                      <span className="font-bold text-gray-800 flex items-center gap-1">
                        {currentRun.volunteerInfo?.transportType === 'car'
                          ? '🚗 Car'
                          : currentRun.volunteerInfo?.transportType === 'motorcycle'
                          ? '🛵 Motorcycle'
                          : currentRun.volunteerInfo?.transportType === 'walking'
                          ? '🚶 Walking'
                          : '🚲 Bicycle'}
                      </span>
                    </div>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsVehicleSwitcherOpen(!isVehicleSwitcherOpen)}
                        disabled={switchingVehicle}
                        className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 hover:border-[#2E7D32] hover:text-[#2E7D32] text-xs font-semibold text-gray-700 transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                        title="Switch vehicle for this delivery task only"
                      >
                        <Bike className="w-3.5 h-3.5 text-[#2E7D32]" />
                        <span>{switchingVehicle ? 'Updating...' : 'Switch Vehicle for this Task'}</span>
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      </button>

                      {isVehicleSwitcherOpen && (
                        <div className="absolute left-0 mt-1.5 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-30 animate-in fade-in zoom-in-95 duration-100">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
                            Switch Vehicle (This Task)
                          </p>
                          <div className="space-y-1">
                            {[
                              { id: 'bicycle', label: 'Bicycle', icon: '🚲', hint: 'Short range' },
                              { id: 'motorcycle', label: 'Motorcycle', icon: '🛵', hint: 'Medium / fast' },
                              { id: 'car', label: 'Car / Auto', icon: '🚗', hint: 'Long range (e.g. >15km)' },
                              { id: 'walking', label: 'Walking', icon: '🚶', hint: 'Within 1-2 km' },
                            ].map((v) => (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() => handleSwitchActiveTransport(v.id)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                                  currentRun.volunteerInfo?.transportType === v.id
                                    ? 'bg-emerald-50 text-[#2E7D32] font-bold'
                                    : 'hover:bg-gray-50 text-gray-700'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-base">{v.icon}</span>
                                  <span>{v.label}</span>
                                </div>
                                <span className="text-[10px] text-gray-400">{v.hint}</span>
                              </button>
                            ))}
                          </div>
                          <p className="text-[9px] text-gray-400 px-2 pt-2 border-t border-gray-100 mt-1">
                            Permanent profile vehicle remains unchanged.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Upper Route Button: Opens overall exchange route from Donor to Receiver using EXACT GPS coordinates */}
                {(() => {
                  const pLat = currentRun.pickupCoords?.lat ?? currentRun.donation?.lat
                  const pLng = currentRun.pickupCoords?.lng ?? currentRun.donation?.lng
                  const dLat = currentRun.dropoffCoords?.lat
                  const dLng = currentRun.dropoffCoords?.lng

                  const donorAddress =
                    currentRun.pickupAddress ||
                    currentRun.donation?.pickupAddress ||
                    currentRun.donor?.address ||
                    ''
                  const receiverAddress =
                    currentRun.dropoffAddress ||
                    currentRun.receiver?.address ||
                    ''

                  const originParam = (pLat != null && pLng != null)
                    ? `${pLat},${pLng}`
                    : encodeURIComponent(donorAddress || 'Sector 4 Bhilai')

                  const destParam = (dLat != null && dLng != null)
                    ? `${dLat},${dLng}`
                    : encodeURIComponent(receiverAddress || 'Tikrapara Raipur')

                  const activeTransport = currentRun.volunteerInfo?.transportType || 'bicycle'
                  const travelMode =
                    activeTransport === 'walking'
                      ? 'walking'
                      : activeTransport === 'bicycle'
                      ? 'bicycling'
                      : activeTransport === 'motorcycle'
                      ? 'two_wheeler'
                      : 'driving'

                  const routeUrl = `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destParam}&travelmode=${travelMode}`

                  return (
                    <a
                      href={routeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
                      title="Open full exchange route from exact Donor coordinates to exact Receiver coordinates"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                      <span>Open Route</span>
                    </a>
                  )
                })()}
              </div>

              {/* LIVE MAP TRACKING (Leaflet & OpenStreetMap) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800">
                      Live Delivery Route & Map
                    </h4>
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium">
                    OpenStreetMap Live Tracking
                  </span>
                </div>
                <LiveTrackingMap
                  pickupCoords={currentRun.pickupCoords || (currentRun.donation?.lat ? { lat: currentRun.donation.lat, lng: currentRun.donation.lng } : null)}
                  dropoffCoords={currentRun.dropoffCoords}
                  volunteerCoords={volunteerLiveCoords || currentRun.volunteerCoords}
                  pickupAddress={currentRun.pickupAddress || currentRun.donation?.pickupAddress || currentRun.donor?.address || 'Donor Pickup'}
                  dropoffAddress={currentRun.dropoffAddress || currentRun.receiver?.address || 'Receiver Drop-off'}
                  volunteerName={currentRun.volunteerInfo?.name || 'Volunteer Courier'}
                  volunteerTransport={currentRun.volunteerInfo?.transportType || 'bicycle'}
                  status={currentRun.status}
                  height="380px"
                  showExternalNav={true}
                  userRole="volunteer"
                />
              </div>

              {/* Two Blocks: Donor & Receiver */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Block A: Donor */}
                <div className="p-5 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-[#2E7D32] flex items-center justify-center font-bold text-xs">
                        A
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Pickup Location
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const dPhone = currentRun.donor?.phone || currentRun.donation?.donorPhone || '+91 98200 44321'
                        const dName = currentRun.donation?.donorOrganization || currentRun.donor?.fullName || 'Donor Partner'
                        setPhoneModal({
                          isOpen: true,
                          title: 'Call Donor',
                          name: dName,
                          phone: dPhone,
                          role: 'Donor',
                        })
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-2xs cursor-pointer"
                      title="View and copy donor phone number"
                    >
                      <Phone className="w-3 h-3 text-gray-400" />
                      <span>Call Donor</span>
                    </button>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      {currentRun.donation?.donorOrganization || currentRun.donor?.fullName || 'Green Table Restaurant'}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {currentRun.pickupAddress || currentRun.donation?.pickupAddress || currentRun.donor?.address || 'Pickup Location'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Contact: {currentRun.donor?.phone || 'No phone recorded'}</p>
                  </div>
                </div>

                {/* Block B: Receiver */}
                <div className="p-5 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        B
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Drop-off Location
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const rPhone = currentRun.receiver?.phone || '+91 98201 12345'
                        const rName = currentRun.receiver?.organizationName || currentRun.receiver?.fullName || 'Receiver Partner'
                        setPhoneModal({
                          isOpen: true,
                          title: 'Call Receiver',
                          name: rName,
                          phone: rPhone,
                          role: 'Receiver',
                        })
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-2xs cursor-pointer"
                      title="View and copy receiver phone number"
                    >
                      <Phone className="w-3 h-3 text-gray-400" />
                      <span>Call Receiver</span>
                    </button>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      {currentRun.receiver?.organizationName || currentRun.receiver?.fullName || 'Receiver Partner'}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {currentRun.dropoffAddress || currentRun.receiver?.address || 'Drop-off Address'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Contact: {currentRun.receiver?.phone || 'No phone recorded'}</p>
                    <div className="mt-2 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900">
                      <strong>Drop-off Instructions:</strong> Use the service entrance, ask for the on-duty coordinator upon arrival.
                    </div>
                  </div>
                </div>
              </div>

              {/* Package Details Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100 text-xs text-gray-700 flex items-center gap-3">
                <Package className="w-5 h-5 text-[#2E7D32] shrink-0" />
                <div>
                  <span className="font-bold text-gray-900">Package Details:</span>{' '}
                  {isCombinedBasket(currentRun)
                    ? `${getCombinedFoodTitle(currentRun)} (~${getPackageWeightKg(getTotalUnits(currentRun), 'Servings')} kg package). Handle with care. Keep containers upright during transit.`
                    : `${formatQuantityUnit(currentRun.donation?.quantity || 1, currentRun.donation?.unit || 'Servings')} of ${currentRun.donation?.title || 'Food Donation'} (~${getPackageWeightKg(currentRun.donation?.quantity, currentRun.donation?.unit)} kg package). Handle with care. Keep containers upright during transit.`}
                </div>
              </div>

              {/* VERIFICATION CODE ENTRY SECTION (STRICT SECURITY RULE 8 & 23) */}
              <div className="pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
                  Handover Verification Codes
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Step 1: Donor Pickup Verification */}
                  <div
                    className={`p-5 rounded-2xl border transition-all ${
                      !isPickedUp
                        ? 'bg-white border-emerald-300 ring-2 ring-emerald-500/10'
                        : 'bg-gray-50 border-gray-200 opacity-90'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-gray-900">Enter Donor Pickup Code</span>
                      </div>
                      {isPickedUp && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                          Pickup Confirmed ✓
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-gray-500 mb-4">
                      {isPickedUp
                        ? 'Food has been verified and collected from the donor.'
                        : 'Ask the donor for their 4-digit pickup code when collecting the food.'}
                    </p>

                    {!isPickedUp ? (
                      <form
                        onSubmit={(e) => handleVerifyPickup(e, currentRun._id)}
                        className="space-y-4"
                      >
                        <div className="flex gap-2.5">
                          {pickupDigits.map((d, i) => (
                            <input
                              key={i}
                              id={`p-digit-${i}`}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={d}
                              onChange={(e) => handleDigitChange(i, e.target.value, 'pickup')}
                              onKeyDown={(e) => handleDigitKeyDown(i, e, 'pickup')}
                              className="w-12 h-13 text-center text-xl font-bold rounded-xl border border-gray-300 focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20 outline-none transition-all"
                            />
                          ))}
                        </div>

                        <button
                          type="submit"
                          disabled={pickupSubmitting || pickupDigits.join('').length !== 4}
                          className="w-full py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#256828] text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {pickupSubmitting ? 'Verifying Pickup...' : 'Confirm Pickup'}
                        </button>
                      </form>
                    ) : (
                      /* When picked up, button to start transit */
                      <div className="pt-2">
                        {!isEnRoute ? (
                          <button
                            onClick={() => handleStartTransit(currentRun._id)}
                            disabled={transitLoading}
                            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                          >
                            <Truck className="w-4 h-4" />
                            <span>{transitLoading ? 'Starting Transit...' : 'Start Transit (En Route)'}</span>
                          </button>
                        ) : (
                          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-800 text-xs font-semibold text-center">
                            En Route to Recipient 🚀
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Step 2: Receiver Delivery Verification */}
                  <div
                    className={`p-5 rounded-2xl border transition-all ${
                      isPickedUp
                        ? 'bg-white border-purple-300 ring-2 ring-purple-500/10'
                        : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-bold text-gray-900">Enter Receiver Drop-off Code</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-gray-500 mb-4">
                      {!isPickedUp
                        ? 'Locked until donor pickup is verified.'
                        : 'Ask the receiver for their 4-digit delivery code upon physical drop-off.'}
                    </p>

                    <form
                      onSubmit={(e) => handleVerifyDelivery(e, currentRun._id)}
                      className="space-y-4"
                    >
                      <div className="flex gap-2.5">
                        {deliveryDigits.map((d, i) => (
                          <input
                            key={i}
                            id={`d-digit-${i}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            disabled={!isPickedUp}
                            value={d}
                            onChange={(e) => handleDigitChange(i, e.target.value, 'delivery')}
                            onKeyDown={(e) => handleDigitKeyDown(i, e, 'delivery')}
                            className="w-12 h-13 text-center text-xl font-bold rounded-xl border border-gray-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                          />
                        ))}
                      </div>

                      <button
                        type="submit"
                        disabled={!isPickedUp || deliverySubmitting || deliveryDigits.join('').length !== 4}
                        className="w-full py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#256828] text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-40 cursor-pointer"
                      >
                        {deliverySubmitting ? 'Completing Exchange...' : 'Confirm Delivery'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State for Active Run */
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-10 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800">No ongoing delivery run</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  You are not currently delivering an order. Check the Upcoming / Queued tab to claim available community tasks.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('upcoming')}
                className="px-5 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#256828] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Browse Available Tasks ({availableList.length})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Upcoming / Queued (Available Task Pool) */}
      {activeTab === 'upcoming' && (
        <div className="space-y-4">
          {availableList.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-10 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-800">No available tasks in pool</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                All food rescue requests are currently assigned or completed. New donor donations will appear here immediately!
              </p>
            </div>
          ) : (
            availableList.map((item) => {
              const donorName = item.donation?.donorOrganization || item.donor?.fullName || 'Food Donor'
              const receiverName = item.receiver?.fullName || 'Community Food Bank'
              const servings = item.donation?.quantity || 25
              const title = item.donation?.title || 'Cooked Meals'

              return (
                <div
                  key={item._id}
                  className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs hover:border-gray-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-gray-400">
                        #{item.orderNo || item._id.slice(-6).toUpperCase()}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        Needs Courier
                      </span>
                      {item.distance && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          ~{item.distance}
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-gray-900">
                      {getFoodHeading(item, 'volunteer')}
                    </h4>
                    <CombinedItemsBreakdown items={getOrderItems(item)} />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-600 pt-1">
                      <div>
                        <span className="font-bold text-gray-800">Pickup:</span>{' '}
                        {item.donor?.address || item.pickupAddress || 'Address available on accept'}
                      </div>
                      <div>
                        <span className="font-bold text-gray-800">Drop-off:</span>{' '}
                        {item.receiver?.address || item.dropoffAddress || 'Address available on accept'}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-400 pt-1">
                      <span>Donor: {donorName}</span>
                      <span>•</span>
                      <span>Recipient: {receiverName}</span>
                    </div>

                    {/* Task Vehicle Selection (Change 3) */}
                    <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold text-gray-600">Vehicle for this task:</span>
                      <div className="inline-flex p-0.5 bg-gray-100 rounded-xl gap-1">
                        {[
                          { id: 'bicycle', label: 'Bicycle', icon: '🚲' },
                          { id: 'motorcycle', label: 'Motorcycle', icon: '🛵' },
                          { id: 'car', label: 'Car', icon: '🚗' },
                          { id: 'walking', label: 'Walking', icon: '🚶' },
                        ].map((veh) => {
                          const isSelected =
                            (selectedVehicleByTask[item._id] || item.suggestedTransport || 'bicycle') === veh.id
                          return (
                            <button
                              key={veh.id}
                              type="button"
                              onClick={() =>
                                setSelectedVehicleByTask((prev) => ({ ...prev, [item._id]: veh.id }))
                              }
                              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                isSelected
                                  ? 'bg-white text-[#2E7D32] shadow-2xs'
                                  : 'text-gray-500 hover:text-gray-800'
                              }`}
                            >
                              <span>{veh.icon}</span>
                              <span>{veh.label}</span>
                            </button>
                          )
                        })}
                      </div>
                      <span className="text-[10px] text-gray-400">
                        (Profile default remains unchanged)
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center">
                    <button
                      onClick={() =>
                        handleAcceptTask(
                          item._id,
                          selectedVehicleByTask[item._id] || item.suggestedTransport || 'bicycle'
                        )
                      }
                      disabled={claimLoadingId === item._id}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#256828] text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>{claimLoadingId === item._id ? 'Accepting...' : 'Accept Task'}</span>
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Tab 3: Completed Deliveries */}
      {activeTab === 'completed' && (
        <div className="space-y-4">
          {completedDeliveries.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-10 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-[#2E7D32] flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-gray-800">No Completed Deliveries Yet</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Completed deliveries will appear here with delivery details, recipient confirmation, and the completed status tag.
              </p>
              <button
                onClick={() => setActiveTab('upcoming')}
                className="mt-2 px-5 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#256828] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Package className="w-3.5 h-3.5" />
                <span>Browse Available Tasks</span>
              </button>
            </div>
          ) : (
            completedDeliveries.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs hover:border-gray-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-gray-400">
                      #{item.orderNo || item._id.slice(-6).toUpperCase()}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-[#2E7D32] border border-emerald-200">
                      <CheckCircle className="w-3 h-3" />
                      Completed
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-gray-900">
                    {getFoodHeading(item, 'volunteer')}
                  </h4>
                  <CombinedItemsBreakdown items={getOrderItems(item)} />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-600 pt-1">
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <span className="font-bold text-gray-800 block text-[10px] text-gray-400 uppercase">Pickup Location:</span>
                      <p className="font-bold text-gray-800 mt-0.5">
                        {item.donation?.donorOrganization || item.donor?.fullName || 'Donor Partner'}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {item.donor?.address || item.pickupAddress || 'Pickup Location'}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <span className="font-bold text-gray-800 block text-[10px] text-gray-400 uppercase">Drop-off Recipient:</span>
                      <p className="font-bold text-gray-800 mt-0.5">
                        {item.receiver?.organizationName || item.receiver?.fullName || 'Community Receiver'}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {item.receiver?.address || item.dropoffAddress || 'Drop-off Location'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex sm:flex-col items-end justify-center text-right">
                  <span className="text-xs font-bold text-[#2E7D32] bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                    Handover Verified ✓
                  </span>
                  <span className="text-[10px] text-gray-500 mt-1 font-medium">
                    {item.deliveredAt || item.updatedAt
                      ? `Delivered ${new Date(item.deliveredAt || item.updatedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}`
                      : 'Delivered successfully'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Phone Contact Modal (Copy Phone Option) */}
      <PhoneContactModal
        isOpen={Boolean(phoneModal)}
        onClose={() => setPhoneModal(null)}
        title={phoneModal?.title}
        name={phoneModal?.name}
        phone={phoneModal?.phone}
        role={phoneModal?.role}
      />
    </div>
  )
}
