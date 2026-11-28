import { useState, useEffect } from 'react'
import {
  ArrowLeftRight,
  Truck,
  HeartHandshake,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Phone,
  Star,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ShieldCheck,
  Bike,
  Car,
  Footprints,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  KeyRound,
  Copy,
  Check,
  X,
} from 'lucide-react'
import donorService from '../../services/donorService'
import { getFoodImageUrl, handleImageError } from '../../utils/imageHelper'
import {
  formatQuantityUnit,
  getCombinedFoodTitle,
  isCombinedBasket,
  getTotalUnits,
  getOrderItems,
} from '../../utils/unitHelper'
import CombinedItemsBreakdown from '../../components/common/CombinedItemsBreakdown'
import { useIsMobile } from '../../utils/deviceHelper'
import LiveTrackingMap from '../../components/common/LiveTrackingMap'

export default function Exchanges() {
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState('in_progress')
  const [typeFilter, setTypeFilter] = useState('all') // 'all' | 'volunteer' | 'direct'
  const [exchanges, setExchanges] = useState([])
  const [counts, setCounts] = useState({ all: 0, in_progress: 0, completed: 0 })
  const [loading, setLoading] = useState(true)
  const [expandedTimelineId, setExpandedTimelineId] = useState(null)
  const [feedbackModal, setFeedbackModal] = useState(null) // exchange item
  const [feedbackRating, setFeedbackRating] = useState(5)
  const [feedbackComment, setFeedbackComment] = useState('')
  const [submittingActionId, setSubmittingActionId] = useState(null)
  const [copiedCodeId, setCopiedCodeId] = useState(null)
  const [copiedPhoneId, setCopiedPhoneId] = useState(null)
  const [phoneToast, setPhoneToast] = useState('')

  const loadExchanges = async (tab = activeTab, silent = false) => {
    try {
      if (!silent) setLoading(true)
      const res = await donorService.getExchanges(tab)
      if (res.data) {
        const sorted = (res.data.exchanges || []).sort((a, b) => {
          const timeB = new Date(b.deliveredAt || b.cancelledAt || b.updatedAt || b.createdAt || 0).getTime()
          const timeA = new Date(a.deliveredAt || a.cancelledAt || a.updatedAt || a.createdAt || 0).getTime()
          return timeB - timeA
        })
        setExchanges(sorted)
        if (res.data.counts) setCounts(res.data.counts)
      }
    } catch (err) {
      console.error('Failed to load exchanges:', err)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    loadExchanges(activeTab, false)
    if (activeTab === 'in_progress') {
      const timer = setInterval(() => {
        loadExchanges(activeTab, true)
      }, 10000)
      return () => clearInterval(timer)
    }
  }, [activeTab])

  // Handle donor action buttons: "Mark as Ready for Pickup", "Confirm Handover to Volunteer"
  const handleUpdateStatus = async (exchangeId, nextStatus, note = '', verificationCode = '') => {
    try {
      setSubmittingActionId(exchangeId)
      await donorService.updateExchangeStatus(exchangeId, nextStatus, note, verificationCode)
      await loadExchanges(activeTab)
    } catch (err) {
      alert(err.message || 'Failed to update status.')
    } finally {
      setSubmittingActionId(null)
    }
  }

  const handleCopyCode = (code, id) => {
    if (!code) return
    navigator.clipboard?.writeText(code)
    setCopiedCodeId(id)
    setTimeout(() => setCopiedCodeId(null), 2000)
  }

  const handleCopyPhone = (phoneNumber, exchangeId) => {
    if (!phoneNumber) return
    const textToCopy = phoneNumber.trim()
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopiedPhoneId(exchangeId)
        setPhoneToast(`Volunteer phone number copied: ${textToCopy}`)
        setTimeout(() => setCopiedPhoneId(null), 3000)
        setTimeout(() => setPhoneToast(''), 4000)
      }).catch(() => {
        fallbackCopyText(textToCopy, exchangeId)
      })
    } else {
      fallbackCopyText(textToCopy, exchangeId)
    }
  }

  const fallbackCopyText = (text, exchangeId) => {
    try {
      const el = document.createElement('textarea')
      el.value = text
      el.style.position = 'fixed'
      el.style.left = '-9999px'
      document.body.appendChild(el)
      el.focus()
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopiedPhoneId(exchangeId)
      setPhoneToast(`Volunteer phone number copied: ${text}`)
      setTimeout(() => setCopiedPhoneId(null), 3000)
      setTimeout(() => setPhoneToast(''), 4000)
    } catch {
      alert(`Volunteer phone number: ${text}`)
    }
  }

  // Handle feedback submission
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault()
    if (!feedbackModal) return
    try {
      await donorService.submitFeedback(feedbackModal._id, feedbackRating, feedbackComment)
      setFeedbackModal(null)
      setFeedbackComment('')
      await loadExchanges(activeTab)
    } catch (err) {
      alert(err.message || 'Failed to submit feedback.')
    }
  }

  // Filter exchanges by handover type if selected
  const filteredExchanges = exchanges
    .filter((ex) => {
      if (typeFilter === 'volunteer') return ex.deliveryType === 'volunteer_delivery'
      if (typeFilter === 'direct') return ex.deliveryType === 'direct_pickup'
      return true
    })
    .sort((a, b) => {
      // Recent at the top, older at the bottom
      const timeB = new Date(b.deliveredAt || b.cancelledAt || b.updatedAt || b.createdAt || 0).getTime()
      const timeA = new Date(a.deliveredAt || a.cancelledAt || a.updatedAt || a.createdAt || 0).getTime()
      return timeB - timeA
    })

  // Helper for volunteer transport icon
  const getTransportIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'bicycle':
        return <Bike className="w-3.5 h-3.5" />
      case 'walking':
        return <Footprints className="w-3.5 h-3.5" />
      default:
        return <Car className="w-3.5 h-3.5" />
    }
  }

  const tabs = [
    { key: 'in_progress', label: `In Progress (${counts.in_progress || 0})` },
    { key: 'completed', label: `Completed (${counts.completed || 0})` },
    { key: 'all', label: `All (${counts.all || 0})` },
  ]

  return (
    <div className="space-y-6 relative">
      {/* Phone Copied Toast */}
      {phoneToast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-[#1F2937] text-white rounded-xl shadow-xl text-xs font-semibold animate-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{phoneToast}</span>
        </div>
      )}

      {/* Header (Pages 8 & 9 in PDF) */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Exchanges</h1>
        <p className="text-xs text-gray-500 font-medium mt-0.5">
          Track the status of your active and completed exchanges.
        </p>
      </div>

      {/* Volunteer Role Callout Banner — Addressing User's Exact Requirement */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2E7D32] text-white flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span>Three-Party Exchange System</span>
              <span className="text-[11px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                Donor • Volunteer • Receiver
              </span>
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              Verified community volunteers provide scheduled pickup from donors and safe delivery to receivers, ensuring contactless and reliable food redistribution.
            </p>
          </div>
        </div>

        {/* Handover Type Filter Pills */}
        <div className="flex items-center gap-1.5 self-start md:self-auto shrink-0 bg-white p-1 rounded-xl border border-emerald-100">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              typeFilter === 'all'
                ? 'bg-[#2E7D32] text-white shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setTypeFilter('volunteer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              typeFilter === 'volunteer'
                ? 'bg-[#2E7D32] text-white shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Volunteer Delivery</span>
          </button>
          <button
            onClick={() => setTypeFilter('direct')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              typeFilter === 'direct'
                ? 'bg-[#2E7D32] text-white shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Direct Pickup</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs (Page 8 in PDF) */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-1 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#2E7D32] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Exchanges List */}
      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredExchanges.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#2E7D32] flex items-center justify-center mx-auto mb-3">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No exchanges found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Active and completed food exchanges will appear here once requests are accepted.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredExchanges.map((exchange) => {
            const isVolunteerDelivery = exchange.deliveryType === 'volunteer_delivery'
            const isCompleted = exchange.status === 'completed'
            const isExpanded = expandedTimelineId === exchange._id
            const donation = exchange.donation || {}
            const receiverName =
              exchange.receiverInfo?.name || exchange.receiver?.fullName || 'Community Receiver'
            const volunteer = exchange.volunteerInfo || {}

            // Calculate stepper progress indices
            // 5 visible steps for volunteer-based exchange:
            // 1. Accepted, 2. Searching Volunteer, 3. Volunteer Assigned, 4. Food Picked Up, 5. Completed
            const volunteerSteps = [
              { key: 'accepted', label: 'Accepted' },
              { key: 'searching_volunteer', label: 'Searching Volunteer' },
              { key: 'volunteer_assigned', label: 'Volunteer Assigned' },
              { key: 'picked_up', label: 'Food Picked Up' },
              { key: 'completed', label: 'Completed' },
            ]

            const directSteps = [
              { key: 'accepted', label: 'Accepted' },
              { key: 'ready_for_pickup', label: 'Ready for Pickup' },
              { key: 'completed', label: 'Completed' },
            ]

            const activeSteps = isVolunteerDelivery ? volunteerSteps : directSteps

            // Determine status index
            let currentStepIdx = 0
            if (isCompleted) {
              currentStepIdx = activeSteps.length - 1
            } else if (isVolunteerDelivery) {
              if (['picked_up_by_volunteer', 'picked_up', 'out_for_delivery', 'in_transit'].includes(exchange.status)) {
                currentStepIdx = 3
              } else if (exchange.status === 'volunteer_assigned') {
                currentStepIdx = 2
              } else if (exchange.status === 'searching_for_volunteer') {
                currentStepIdx = 1
              } else {
                currentStepIdx = 0
              }
            } else {
              if (exchange.status === 'ready_for_pickup') {
                currentStepIdx = 1
              } else {
                currentStepIdx = 0
              }
            }

            return (
              <div
                key={exchange._id}
                className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs hover:shadow-md transition-shadow space-y-6"
              >
                {/* Header row: Food Info, Receiver & Delivery Mode */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src={getFoodImageUrl(donation.imageUrl, donation.category)}
                      alt={donation.title}
                      onError={(e) => handleImageError(e, donation.category)}
                      className="w-14 h-14 rounded-xl object-cover border border-gray-100 shadow-2xs shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-gray-900 truncate">
                          {isCombinedBasket(exchange)
                            ? getCombinedFoodTitle(exchange)
                            : (donation.title || 'Food Donation')}
                        </h3>
                        <span className="text-xs text-gray-500 font-medium shrink-0">
                          • {isCombinedBasket(exchange)
                            ? `${getTotalUnits(exchange)} Servings`
                            : formatQuantityUnit(donation.quantity, donation.unit)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">
                        to <strong className="text-gray-900">{receiverName}</strong>
                        {exchange.receiverInfo?.organization && (
                          <span className="text-gray-400">
                            {' '}
                            ({exchange.receiverInfo.organization})
                          </span>
                        )}
                      </p>
                      <CombinedItemsBreakdown items={getOrderItems(exchange)} />
                    </div>
                  </div>

                  {/* Mode Badge & Status Tag */}
                  <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
                    {isVolunteerDelivery ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#2E7D32] border border-emerald-200">
                        <Truck className="w-3.5 h-3.5" />
                        <span>Volunteer Delivery</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        <HeartHandshake className="w-3.5 h-3.5" />
                        <span>Direct Pickup</span>
                      </span>
                    )}

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                        isCompleted
                          ? 'bg-gray-100 text-gray-700 border border-gray-200'
                          : exchange.status === 'cancelled'
                          ? 'bg-red-50 text-red-800 border border-red-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {exchange.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* VOLUNTEER SECTION */}
                {exchange.status === 'cancelled' ? (
                  <div className="p-4 rounded-xl bg-red-50/70 border border-red-200 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 text-red-800 flex items-center justify-center font-bold text-xs shrink-0">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-gray-900">Exchange Cancelled</h4>
                      <p className="text-xs text-red-700 mt-0.5">
                        This delivery was cancelled because the food reached its safe consumption limit or courier reported an issue. Please safely discard expired food.
                      </p>
                    </div>
                  </div>
                ) : isVolunteerDelivery && (
                  exchange.status === 'searching_for_volunteer' || !exchange.volunteer ? (
                    <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0 animate-pulse">
                        <Truck className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-900">Searching for Volunteer Courier...</h4>
                          <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                            Awaiting Courier
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">
                          No volunteer has accepted this delivery yet. Your pickup code will appear once an authenticated volunteer accepts.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-[#2E7D32] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                          {volunteer.name ? volunteer.name[0] : (exchange.volunteer?.fullName ? exchange.volunteer.fullName[0] : 'V')}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-gray-900">
                              {volunteer.name || exchange.volunteer?.fullName || 'Assigned Courier'}
                            </h4>
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                              <ShieldCheck className="w-3 h-3 text-[#2E7D32]" />
                              <span>Verified Volunteer Courier</span>
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
                            {volunteer.rating && Number(volunteer.rating) > 0 ? (
                              <span className="flex items-center gap-1 text-amber-600 font-semibold">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span>{Number(volunteer.rating).toFixed(1)}</span>
                                <span className="text-gray-400 font-normal">
                                  ({volunteer.deliveriesCompleted || 0} {(volunteer.deliveriesCompleted || 0) === 1 ? 'delivery' : 'deliveries'})
                                </span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-gray-500 font-medium">
                                <Star className="w-3.5 h-3.5 text-gray-300" />
                                <span>Not rated yet</span>
                                <span className="text-gray-400 font-normal">
                                  ({volunteer.deliveriesCompleted || 0} {(volunteer.deliveriesCompleted || 0) === 1 ? 'delivery' : 'deliveries'})
                                </span>
                              </span>
                            )}
                            <span>•</span>
                            <span className="flex items-center gap-1 font-medium text-gray-700">
                              {getTransportIcon(volunteer.transportType)}
                              <span className="capitalize">
                                {volunteer.transportType || 'Courier'}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        {(volunteer.phone || exchange.courierPhone) && (
                          isMobile ? (
                            <a
                              href={`tel:${volunteer.phone || exchange.courierPhone}`}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors shadow-2xs"
                              title="Call Volunteer"
                            >
                              <Phone className="w-3.5 h-3.5 text-gray-400" />
                              <span>Call Volunteer</span>
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleCopyPhone(volunteer.phone || exchange.courierPhone, exchange._id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors shadow-2xs cursor-pointer"
                              title="Copy volunteer's phone number"
                            >
                              {copiedPhoneId === exchange._id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-700 font-bold">Phone Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-gray-400" />
                                  <span>Copy Phone Number</span>
                                </>
                              )}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )
                )}

                {/* Pickup Verification Code Card for Donor */}
                {/* 1. Direct Pickup Flow */}
                {!isVolunteerDelivery && (
                  !isCompleted ? (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50/60 border border-emerald-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#2E7D32] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                          <KeyRound className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900">
                              Pickup Verification Code
                            </span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                              Direct Pickup
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-600 mt-0.5">
                            Share this 4-digit code with the receiver upon pickup to confirm physical handover.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        <div className="flex items-center tracking-widest font-mono text-base font-extrabold px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-[#2E7D32] shadow-2xs">
                          #{exchange.pickupCode}
                        </div>
                        <button
                          onClick={() => handleCopyCode(exchange.pickupCode, exchange._id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:text-[#2E7D32] hover:bg-emerald-50 transition-colors shadow-2xs cursor-pointer text-xs font-semibold"
                        >
                          {copiedCodeId === exchange._id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700 font-bold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Code</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>✓ Pickup Verified & Handover Completed</span>
                      </div>
                      <span className="text-[11px] text-emerald-700 font-medium">Completed</span>
                    </div>
                  )
                )}

                {/* 2. Volunteer Delivery Flow */}
                {isVolunteerDelivery && (
                  exchange.status === 'volunteer_assigned' && exchange.volunteer ? (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50/60 border border-emerald-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#2E7D32] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                          <KeyRound className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900">
                              Pickup Verification Code
                            </span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                              Volunteer Handover
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-600 mt-0.5">
                            Share this 4-digit code with the volunteer courier upon pickup to confirm physical handover.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        <div className="flex items-center tracking-widest font-mono text-base font-extrabold px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-[#2E7D32] shadow-2xs">
                          #{exchange.pickupCode}
                        </div>
                        <button
                          onClick={() => handleCopyCode(exchange.pickupCode, exchange._id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:text-[#2E7D32] hover:bg-emerald-50 transition-colors shadow-2xs cursor-pointer text-xs font-semibold"
                        >
                          {copiedCodeId === exchange._id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700 font-bold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Code</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : ['picked_up_by_volunteer', 'picked_up', 'out_for_delivery', 'in_transit'].includes(exchange.status) ? (
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Picked Up by Volunteer ({exchange.volunteerInfo?.name || exchange.volunteer?.fullName || 'Courier'})</span>
                      </div>
                      <span className="text-[11px] text-emerald-700 font-medium">In Transit to Receiver</span>
                    </div>
                  ) : isCompleted ? (
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Delivered to Receiver & Completed ✓</span>
                      </div>
                      <span className="text-[11px] text-emerald-700 font-medium">Completed</span>
                    </div>
                  ) : null
                )}

                {/* Live Route Map (Leaflet & OpenStreetMap) */}
                {!isCompleted && (
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Live Delivery Route & Map
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">OpenStreetMap Live</span>
                    </div>
                    <LiveTrackingMap
                      pickupCoords={exchange.pickupCoords || (donation.lat ? { lat: donation.lat, lng: donation.lng } : null)}
                      dropoffCoords={exchange.dropoffCoords}
                      volunteerCoords={exchange.volunteerCoords}
                      pickupAddress={exchange.pickupAddress || donation.pickupAddress || 'Donor Pickup'}
                      dropoffAddress={
                        exchange.dropoffAddress &&
                        exchange.dropoffAddress.trim().toLowerCase() !== (exchange.receiver?.fullName || '').trim().toLowerCase() &&
                        !['receiver address', 'receiver delivery address', 'indore'].includes(exchange.dropoffAddress.trim().toLowerCase())
                          ? exchange.dropoffAddress
                          : exchange.receiver?.address && !['indore'].includes(exchange.receiver.address.trim().toLowerCase())
                          ? exchange.receiver.address
                          : 'Tikrapara, Raipur'
                      }
                      volunteerName={volunteer.name || exchange.volunteer?.fullName || 'Volunteer Courier'}
                      volunteerTransport={volunteer.transportType || 'bicycle'}
                      status={exchange.status}
                      height="380px"
                      showExternalNav={false}
                      userRole="donor"
                    />
                  </div>
                )}

                {/* Visual Progress Stepper (Pages 8 & 9 in PDF) */}
                <div className="py-2">
                  <div className="relative flex items-center justify-between">
                    {/* Background line */}
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2 z-0" />
                    {/* Active filled line */}
                    <div
                      className="absolute top-1/2 left-0 h-0.5 bg-[#2E7D32] -translate-y-1/2 z-0 transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          (currentStepIdx / (activeSteps.length - 1)) * 100
                        )}%`,
                      }}
                    />

                    {/* Step Nodes */}
                    {activeSteps.map((step, idx) => {
                      const isPast = isCompleted ? true : idx < currentStepIdx
                      const isCurrent = !isCompleted && idx === currentStepIdx

                      return (
                        <div key={step.key} className="relative z-10 flex flex-col items-center">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                              isPast
                                ? 'bg-[#2E7D32] text-white ring-4 ring-emerald-50'
                                : isCurrent
                                ? 'bg-white border-2 border-[#2E7D32] text-[#2E7D32] ring-4 ring-emerald-100 font-bold'
                                : 'bg-gray-100 border-2 border-gray-300 text-gray-400'
                            }`}
                          >
                            {isPast ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <span className="text-[11px] font-bold">{idx + 1}</span>
                            )}
                          </div>
                          <span
                            className={`text-[10px] sm:text-[11px] font-semibold mt-2 text-center max-w-[68px] sm:max-w-[90px] leading-tight ${
                              isCurrent
                                ? 'text-[#2E7D32] font-bold'
                                : isPast
                                ? 'text-gray-800'
                                : 'text-gray-400'
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Pickup & Window Details */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 pt-2 border-t border-gray-100">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span>{exchange.pickupAddress}</span>
                    </span>
                    {exchange.pickupWindow && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>{exchange.pickupWindow}</span>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() =>
                      setExpandedTimelineId(isExpanded ? null : exchange._id)
                    }
                    className="flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
                  >
                    <span>{isExpanded ? 'Hide Details' : 'Details'}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Collapsible Detailed Timeline */}
                {isExpanded && (
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 space-y-3">
                    <h5 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Exchange Activity Log
                    </h5>
                    <div className="space-y-2">
                      {exchange.timeline?.map((entry, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 text-xs border-l-2 border-emerald-400 pl-3 py-1"
                        >
                          <div>
                            <p className="font-bold text-gray-900">
                              {entry.title}{' '}
                              <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-sm font-normal ml-1">
                                {entry.actor}
                              </span>
                            </p>
                            {entry.note && (
                              <p className="text-gray-500 text-[11px] mt-0.5">{entry.note}</p>
                            )}
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {new Date(entry.time).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons for the Donor */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  {/* For Direct Pickup: When Accepted -> Donor Marks Ready */}
                  {!isVolunteerDelivery && exchange.status === 'accepted' && (
                    <button
                      disabled={submittingActionId === exchange._id}
                      onClick={() =>
                        handleUpdateStatus(
                          exchange._id,
                          'ready_for_pickup',
                          'Food packaged and ready for receiver pickup'
                        )
                      }
                      className="px-5 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#256428] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      {submittingActionId === exchange._id
                        ? 'Updating...'
                        : 'Mark Ready for Pickup'}
                    </button>
                  )}

                  {/* When In Transit or Picked Up -> Informational badge */}
                  {(exchange.status === 'picked_up_by_volunteer' || exchange.status === 'picked_up' || exchange.status === 'in_transit') && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-[#2E7D32] flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                        <Truck className="w-3.5 h-3.5 animate-pulse" />
                        <span>
                          {isVolunteerDelivery
                            ? 'Courier En Route to Receiver'
                            : 'Food Handover Verified & Collected'}
                        </span>
                      </span>
                    </div>
                  )}

                  {/* Completed -> Leave Feedback */}
                  {isCompleted && (
                    <button
                      onClick={() => {
                        setFeedbackModal(exchange)
                        setFeedbackRating(exchange.feedback?.rating || 5)
                        setFeedbackComment(exchange.feedback?.comment || '')
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition-colors"
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>
                        {exchange.feedback?.rating ? 'View / Edit Feedback' : 'Leave Feedback'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-gray-900">Exchange Feedback</h3>
            <p className="text-xs text-gray-500">
              Share your experience with the volunteer courier and this exchange.
            </p>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= feedbackRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Comments
                </label>
                <textarea
                  rows={3}
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="e.g. Volunteer arrived right on time and was very courteous!"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-[#2E7D32] outline-hidden resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFeedbackModal(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#256428] text-white text-xs font-semibold shadow-xs"
                >
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
