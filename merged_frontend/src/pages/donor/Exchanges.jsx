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
  Sparkles,
  KeyRound,
  Copy,
  Check,
} from 'lucide-react'
import donorService from '../../services/donorService'
import { getFoodImageUrl, handleImageError } from '../../utils/imageHelper'

export default function Exchanges() {
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
  const [handoverModal, setHandoverModal] = useState(null)
  const [inputCode, setInputCode] = useState('')
  const [handoverError, setHandoverError] = useState('')

  const loadExchanges = async (tab = activeTab) => {
    try {
      setLoading(true)
      const res = await donorService.getExchanges(tab)
      if (res.data) {
        setExchanges(res.data.exchanges || [])
        if (res.data.counts) setCounts(res.data.counts)
      }
    } catch (err) {
      console.error('Failed to load exchanges:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExchanges(activeTab)
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

  const handleOpenHandover = (exchange) => {
    setHandoverModal(exchange)
    setInputCode(exchange.pickupCode || '')
    setHandoverError('')
  }

  const handleConfirmHandoverWithCode = async (e) => {
    e.preventDefault()
    if (!handoverModal) return
    const isVolunteer = handoverModal.deliveryType === 'volunteer_delivery'
    const note = isVolunteer
      ? `Handed food over to Volunteer ${handoverModal.volunteerInfo?.name || 'Courier'} (Verified with code #${inputCode})`
      : `Handed food over to Receiver (Verified with code #${inputCode})`

    try {
      setSubmittingActionId(handoverModal._id)
      await donorService.updateExchangeStatus(handoverModal._id, 'picked_up', note, inputCode)
      setHandoverModal(null)
      await loadExchanges(activeTab)
    } catch (err) {
      setHandoverError(err.message || 'Failed to verify handover code.')
    } finally {
      setSubmittingActionId(null)
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
  const filteredExchanges = exchanges.filter((ex) => {
    if (typeFilter === 'volunteer') return ex.deliveryType === 'volunteer_delivery'
    if (typeFilter === 'direct') return ex.deliveryType === 'direct_pickup'
    return true
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
    <div className="space-y-6">
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
            const volunteerSteps = [
              { key: 'accepted', label: 'Accepted' },
              { key: 'ready_for_pickup', label: 'Ready for Pickup' },
              { key: 'volunteer_assigned', label: 'Volunteer Assigned' },
              { key: 'picked_up', label: 'Picked Up by Volunteer' },
              { key: 'completed', label: 'Completed' },
            ]

            const directSteps = [
              { key: 'accepted', label: 'Accepted' },
              { key: 'ready_for_pickup', label: 'Ready for Pickup' },
              { key: 'picked_up', label: 'Picked Up' },
              { key: 'completed', label: 'Completed' },
            ]

            const activeSteps = isVolunteerDelivery ? volunteerSteps : directSteps

            // Determine status index
            let currentStepIdx = 0
            if (exchange.status === 'completed') currentStepIdx = activeSteps.length
            else if (exchange.status === 'picked_up' || exchange.status === 'in_transit') {
              currentStepIdx = isVolunteerDelivery ? 3 : 2
            } else if (exchange.status === 'volunteer_assigned') {
              currentStepIdx = 2
            } else if (exchange.status === 'ready_for_pickup') {
              currentStepIdx = 1
            } else {
              currentStepIdx = 0
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
                          {donation.title || 'Food Donation'}
                        </h3>
                        <span className="text-xs text-gray-500 font-medium">
                          • {donation.quantity} {donation.unit}
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
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {exchange.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* VOLUNTEER SECTION — Addressing the UI omission */}
                {isVolunteerDelivery && (
                  <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-[#2E7D32] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                        {volunteer.name ? volunteer.name[0] : 'V'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-900">
                            {volunteer.name || 'David Kim'}
                          </h4>
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                            <ShieldCheck className="w-3 h-3 text-[#2E7D32]" />
                            <span>Verified Volunteer Courier</span>
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1 text-amber-600 font-semibold">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{volunteer.rating || 4.9}</span>
                            <span className="text-gray-400 font-normal">
                              ({volunteer.deliveriesCompleted || 34} deliveries)
                            </span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-medium text-gray-700">
                            {getTransportIcon(volunteer.transportType)}
                            <span className="capitalize">
                              {volunteer.transportType || 'Car'}
                            </span>
                            {volunteer.vehicleNumber && (
                              <span className="text-gray-400">
                                ({volunteer.vehicleNumber})
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      {volunteer.phone && (
                        <a
                          href={`tel:${volunteer.phone}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors shadow-2xs"
                        >
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span>Call Volunteer</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Pickup Verification Code Card */}
                {!isCompleted && exchange.status !== 'picked_up' && exchange.status !== 'in_transit' ? (
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50/60 border border-emerald-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
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
                            Handover Security
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-600 mt-0.5">
                          Share this 4-digit code with the {isVolunteerDelivery ? 'volunteer courier' : 'receiver'} upon pickup to confirm physical handover.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      <div className="flex items-center tracking-widest font-mono text-base font-extrabold px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-[#2E7D32] shadow-2xs">
                        #{exchange.pickupCode || '4821'}
                      </div>
                      <button
                        onClick={() => handleCopyCode(exchange.pickupCode || '4821', exchange._id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:text-[#2E7D32] hover:bg-emerald-50 transition-colors shadow-2xs cursor-pointer text-xs font-semibold"
                        title="Copy code"
                      >
                        {copiedCodeId === exchange._id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Handover Verified & Authorized (Code #{exchange.pickupCode || '4821'})</span>
                    </div>
                    <span className="text-[11px] text-gray-400">Security Check Passed</span>
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
                      const isPast = idx < currentStepIdx
                      const isCurrent = idx === currentStepIdx

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
                            className={`text-[11px] font-semibold mt-2 text-center max-w-[80px] sm:max-w-none ${
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

                {/* Action Buttons for the Donor (Pages 8 & 9 in PDF) */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  {/* When Accepted -> Donor Marks Ready */}
                  {exchange.status === 'accepted' && (
                    <button
                      disabled={submittingActionId === exchange._id}
                      onClick={() =>
                        handleUpdateStatus(
                          exchange._id,
                          'ready_for_pickup',
                          'Food packaged and ready for courier pickup'
                        )
                      }
                      className="px-5 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#256428] text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      {submittingActionId === exchange._id
                        ? 'Updating...'
                        : 'Confirm Pickup Scheduled'}
                    </button>
                  )}

                  {/* When Ready for Pickup -> Donor Confirms Handover to Volunteer with Code */}
                  {exchange.status === 'ready_for_pickup' && (
                    <button
                      disabled={submittingActionId === exchange._id}
                      onClick={() => handleOpenHandover(exchange)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#256428] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>
                        {isVolunteerDelivery
                          ? `Verify Handover (Code #${exchange.pickupCode || '4821'})`
                          : `Verify Handover (Code #${exchange.pickupCode || '4821'})`}
                      </span>
                    </button>
                  )}

                  {/* When In Transit -> Status display */}
                  {(exchange.status === 'picked_up' || exchange.status === 'in_transit') && (
                    <span className="text-xs font-semibold text-[#2E7D32] flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <Truck className="w-3.5 h-3.5 animate-pulse" />
                      <span>Courier En Route to Receiver</span>
                    </span>
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

      {/* Handover Verification Modal */}
      {handoverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#2E7D32] flex items-center justify-center font-bold">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Verify Pickup Handover</h3>
                  <p className="text-xs text-gray-500">Security check for food release</p>
                </div>
              </div>
              <button
                onClick={() => setHandoverModal(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {handoverError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{handoverError}</span>
              </div>
            )}

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2 text-xs">
              <div className="flex justify-between text-gray-500">
                <span>Food Item:</span>
                <span className="font-semibold text-gray-800">{handoverModal.donation?.title || 'Food Donation'}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Courier / Recipient:</span>
                <span className="font-semibold text-gray-800">
                  {handoverModal.volunteerInfo?.name || handoverModal.receiverInfo?.name || 'Assigned Courier'}
                </span>
              </div>
              <div className="flex justify-between text-gray-500 items-center pt-1 border-t border-gray-200/60">
                <span>Official Verification PIN:</span>
                <span className="font-mono font-bold text-emerald-800 text-base">#{handoverModal.pickupCode || '4821'}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmHandoverWithCode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Enter 4-Digit Pickup PIN from Courier
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder={`e.g. ${handoverModal.pickupCode || '4821'}`}
                  className="w-full tracking-widest text-center font-mono text-xl font-bold py-2.5 px-3 rounded-xl border border-gray-200 focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] outline-hidden bg-white"
                />
                <p className="text-[11px] text-gray-400 text-center mt-1">
                  The courier must provide this code at your door before you release the package.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setHandoverModal(null)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingActionId === handoverModal._id}
                  className="px-5 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#256428] text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {submittingActionId === handoverModal._id ? (
                    'Verifying...'
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Release Food</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
