import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Bike,
  UserCheck,
  Phone,
  CheckCircle2,
  Star,
  AlertTriangle,
  Clock,
  MapPin,
  Check,
  Truck,
  Inbox,
  AlertCircle,
  KeyRound,
  Copy,
  X,
} from 'lucide-react'
import receiverService from '../../services/receiverService'
import { RateModal, ReportIssueModal } from '../../components/receiver/ReceiverModals'
import {
  formatQuantityUnit,
  getFoodHeading,
  getCombinedFoodTitle,
  isCombinedBasket,
  getOrderItems,
  getTotalUnits,
} from '../../utils/unitHelper'
import CombinedItemsBreakdown from '../../components/common/CombinedItemsBreakdown'
import { useIsMobile } from '../../utils/deviceHelper'
import LiveTrackingMap from '../../components/common/LiveTrackingMap'
import PhoneContactModal from '../../components/common/PhoneContactModal'

export default function ActivePickups() {
  const isMobile = useIsMobile()
  const { refreshBadges } = useOutletContext() || {}

  const [activeTab, setActiveTab] = useState('in_progress')
  const [pickups, setPickups] = useState([])
  const [counts, setCounts] = useState({ in_progress: 0, completed: 0, cancelled: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modals state
  const [rateModalOrder, setRateModalOrder] = useState(null)
  const [issueModalOrder, setIssueModalOrder] = useState(null)
  const [verifyModalOrder, setVerifyModalOrder] = useState(null)
  const [submittingRating, setSubmittingRating] = useState(false)
  const [submittingIssue, setSubmittingIssue] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [phoneModal, setPhoneModal] = useState(null)

  const loadPickups = async (tab = activeTab, silent = false) => {
    try {
      if (!silent) setLoading(true)
      const res = await receiverService.getPickups(tab)
      if (res.data) {
        const sorted = (res.data.pickups || []).sort((a, b) => {
          const timeB = new Date(b.deliveredAt || b.cancelledAt || b.updatedAt || b.createdAt || 0).getTime()
          const timeA = new Date(a.deliveredAt || a.cancelledAt || a.updatedAt || a.createdAt || 0).getTime()
          return timeB - timeA
        })
        setPickups(sorted)
        if (res.data.counts) setCounts(res.data.counts)
      }
    } catch (err) {
      if (!silent) setError('Unable to load pickups.')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  // Initial fetch and silent polling every 10 seconds for live order status updates
  useEffect(() => {
    loadPickups(activeTab, false)
    if (activeTab === 'active') {
      const interval = setInterval(() => {
        loadPickups(activeTab, true)
      }, 10000)
      return () => clearInterval(interval)
    }
  }, [activeTab])

  const handleMarkReceived = async (orderId) => {
    try {
      await receiverService.markOrderReceived(orderId)
      setToastMessage('Order confirmed received! Successfully logged to History.')
      setTimeout(() => setToastMessage(''), 4500)
      if (refreshBadges) refreshBadges()
      await loadPickups(activeTab)
    } catch (err) {
      alert(err.message || 'Failed to mark as received.')
    }
  }

  const handleSubmitRating = async (ratingData) => {
    try {
      setSubmittingRating(true)
      await receiverService.rateOrder(rateModalOrder._id, ratingData)
      setRateModalOrder(null)
      setToastMessage('Thank you! Feedback saved successfully.')
      setTimeout(() => setToastMessage(''), 4500)
      await loadPickups(activeTab)
    } catch (err) {
      alert(err.message || 'Failed to submit rating.')
    } finally {
      setSubmittingRating(false)
    }
  }

  const handleSubmitIssue = async (issueData) => {
    try {
      setSubmittingIssue(true)
      await receiverService.reportIssue(issueModalOrder._id, issueData)
      setIssueModalOrder(null)
      setToastMessage('Issue report submitted. Our team is investigating.')
      setTimeout(() => setToastMessage(''), 4500)
    } catch (err) {
      alert(err.message || 'Failed to report issue.')
    } finally {
      setSubmittingIssue(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-[#2E7D32] text-white rounded-xl shadow-xl text-xs font-semibold animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('in_progress')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'in_progress'
              ? 'bg-[#2E7D32] text-white shadow-2xs'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <span>In Progress</span>
          <span
            className={`text-[11px] px-1.5 py-0.2 rounded-full ${
              activeTab === 'in_progress'
                ? 'bg-white/20 text-white'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            ({counts.in_progress ?? 0})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'completed'
              ? 'bg-[#2E7D32] text-white shadow-2xs'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <span>Completed</span>
          <span
            className={`text-[11px] px-1.5 py-0.2 rounded-full ${
              activeTab === 'completed'
                ? 'bg-white/20 text-white'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            ({counts.completed ?? 0})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('cancelled')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'cancelled'
              ? 'bg-[#2E7D32] text-white shadow-2xs'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <span>Cancelled</span>
          <span
            className={`text-[11px] px-1.5 py-0.2 rounded-full ${
              activeTab === 'cancelled'
                ? 'bg-white/20 text-white'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            ({counts.cancelled ?? 0})
          </span>
        </button>
      </div>

      {/* Pickups List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 border border-gray-200 h-64 animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-red-100">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-800">{error}</p>
        </div>
      ) : pickups.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-200">
          <Truck className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">
            No {activeTab === 'in_progress' ? 'ongoing' : 'completed'} pickups found
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {activeTab === 'in_progress'
              ? 'When a food request is approved by a donor, it will appear here.'
              : 'Delivered food pickups will be archived here.'}
          </p>
          {activeTab === 'in_progress' && counts.completed > 0 && (
            <button
              onClick={() => setActiveTab('completed')}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-[#2E7D32] border border-emerald-200 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <span>View Completed Pickups ({counts.completed})</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {pickups.map((pickup) => (
            <PickupCard
              key={pickup._id}
              pickup={pickup}
              isMobile={isMobile}
              onCopyPhone={(phone) => {
                if (!phone) return
                if (navigator.clipboard?.writeText) {
                  navigator.clipboard.writeText(phone)
                }
                setToastMessage(`Volunteer phone copied to clipboard: ${phone}`)
                setTimeout(() => setToastMessage(''), 4000)
              }}
              isCompletedTab={activeTab === 'completed'}
              onMarkReceived={() => handleMarkReceived(pickup._id)}
              onRate={() => setRateModalOrder(pickup)}
              onReportIssue={() => setIssueModalOrder(pickup)}
              onOpenVerifyPickup={() => setVerifyModalOrder(pickup)}
              onOpenPhoneModal={setPhoneModal}
            />
          ))}
        </div>
      )}

      {/* Verify Pickup Modal for Direct Pickup */}
      <VerifyPickupModal
        order={verifyModalOrder}
        isOpen={Boolean(verifyModalOrder)}
        onClose={() => setVerifyModalOrder(null)}
        onVerified={async () => {
          setToastMessage('Pickup verified successfully! Order completed and moved to Completed tab.')
          setTimeout(() => setToastMessage(''), 5000)
          if (refreshBadges) refreshBadges()
          setActiveTab('completed')
          await loadPickups('completed')
        }}
      />

      {/* Rate & Feedback Modal */}
      <RateModal
        order={rateModalOrder}
        isOpen={Boolean(rateModalOrder)}
        onClose={() => setRateModalOrder(null)}
        onSubmit={handleSubmitRating}
        isSubmitting={submittingRating}
      />

      {/* Report Issue Modal */}
      <ReportIssueModal
        order={issueModalOrder}
        isOpen={Boolean(issueModalOrder)}
        onClose={() => setIssueModalOrder(null)}
        onSubmit={handleSubmitIssue}
        isSubmitting={submittingIssue}
      />

      {/* Phone Contact Modal (Call Courier / Dial Pad / Copy Phone Option) */}
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

function PickupCard({
  pickup,
  isMobile,
  onCopyPhone,
  isCompletedTab,
  onMarkReceived,
  onRate,
  onReportIssue,
  onOpenVerifyPickup,
  onOpenPhoneModal,
}) {
  const isVolunteer = pickup.deliveryType === 'volunteer_delivery'

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header Row: Title & Subtitle + Top-Right Delivery & Status Badges */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900">
            {getFoodHeading(pickup, 'with_servings_suffix')}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {pickup.donor} · Order #{pickup.orderNo}
          </p>
          <CombinedItemsBreakdown items={getOrderItems(pickup)} />
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {isVolunteer ? (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#1565C0] border border-blue-100 flex items-center gap-1.5">
              <Bike className="w-3.5 h-3.5" />
              Volunteer Courier
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-[#E65100] border border-orange-100 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              Self-Pickup
            </span>
          )}

          {pickup.status === 'completed' && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-[#2E7D32] border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Completed
            </span>
          )}
          {pickup.status === 'cancelled' && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
              Order Cancelled
            </span>
          )}
          {pickup.status === 'picked_up' && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-[#1565C0] border border-blue-200">
              Handover Verified
            </span>
          )}
          {pickup.status === 'ready_for_pickup' && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
              Ready for Collection
            </span>
          )}
          {pickup.status === 'accepted' && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
              Accepted
            </span>
          )}
        </div>
      </div>

      {/* Specific Section: Courier strip (Volunteer) vs Address/Verification (Self-Pickup) */}
      {isVolunteer ? (
        <div className="space-y-4">
          {/* Volunteer Courier Strip */}
          {pickup.status === 'cancelled' ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50/70 border border-red-200">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-gray-900">
                  Order Cancelled
                </p>
                <p className="text-[11px] text-red-700 mt-0.5">
                  {pickup.cancellationReason || 'Safe consumption window passed or delivery run cancelled for food safety.'}
                </p>
              </div>
            </div>
          ) : pickup.status === 'searching_for_volunteer' || !pickup.courier ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50/70 border border-amber-200">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0 animate-pulse">
                <Truck className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-gray-900">
                  Searching for Volunteer Courier...
                </p>
                <p className="text-[11px] text-gray-600 mt-0.5">
                  We are finding a community volunteer to pick up and deliver your food.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#E8F5E9]/60 border border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2E7D32] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                  {pickup.courier?.avatar ? (
                    <img
                      src={pickup.courier.avatar}
                      alt={pickup.courier.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    pickup.courier?.name ? pickup.courier.name.slice(0, 2).toUpperCase() : 'CO'
                  )}
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-gray-900">
                    {pickup.courier.name}
                  </p>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    {['picked_up_by_volunteer', 'picked_up', 'out_for_delivery', 'in_transit'].includes(pickup.status)
                      ? `${pickup.courier.transport || 'Courier'} · Food is on the way (ETA ${pickup.courier.eta || '~15 min'})`
                      : `${pickup.courier.transport || 'Courier'} · Assigned · Heading to donor for pickup`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const cPhone = pickup.courier?.phone || pickup.courierPhone || '+91 98200 44321'
                    const cName = pickup.courier?.name || 'Volunteer Courier'
                    if (onOpenPhoneModal) {
                      onOpenPhoneModal({
                        isOpen: true,
                        title: 'Call Courier',
                        name: cName,
                        phone: cPhone,
                        role: 'Volunteer Courier',
                      })
                    } else if (onCopyPhone) {
                      onCopyPhone(cPhone)
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 hover:text-emerald-800 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  title="Call or copy courier phone number"
                >
                  <Phone className="w-3.5 h-3.5 text-[#2E7D32]" />
                  <span>Call Courier</span>
                </button>
              </div>
            </div>
          )}

          {/* Delivery Code Box (Receiver's code to share with courier upon arrival) */}
          {['picked_up_by_volunteer', 'picked_up', 'out_for_delivery', 'in_transit'].includes(pickup.status) && (pickup.deliveryCode || pickup.handoverCode) && (
            <div className="p-4 rounded-xl border-2 border-dashed border-[#2E7D32]/50 bg-[#E8F5E9]/30 text-center space-y-1">
              <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                Delivery Verification Code
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#2E7D32] tracking-wider font-mono">
                #{pickup.deliveryCode || pickup.handoverCode}
              </p>
              <p className="text-[11px] text-gray-500">
                Share this code with the volunteer when your food arrives.
              </p>
            </div>
          )}

          {pickup.status === 'completed' && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center text-xs text-emerald-800 font-semibold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Delivered & Completed ✓</span>
            </div>
          )}
        </div>
      ) : (
        /* Direct Self-Pickup Flow */
        <div className="space-y-4">
          {/* Info Box */}
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
              <span>{pickup.pickupAddress}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400 shrink-0" />
              <span>Pickup window: {pickup.pickupWindow}</span>
            </div>
          </div>

          {pickup.status !== 'completed' ? (
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900">Direct Food Collection</span>
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Self-Pickup
                </span>
              </div>
              <p className="text-xs text-gray-600">
                When you arrive at the donor's location, ask the donor for their 4-digit pickup code and verify it below to confirm collection.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={onOpenVerifyPickup}
                  className="px-5 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Verify Pickup</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const dPhone = pickup.donorPhone || '+91 98200 44321'
                    const dName = pickup.donor || 'Donor Partner'
                    if (onOpenPhoneModal) {
                      onOpenPhoneModal({
                        isOpen: true,
                        title: 'Call Donor',
                        name: dName,
                        phone: dPhone,
                        role: 'Food Donor',
                      })
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  title="Call or copy donor phone number"
                >
                  <Phone className="w-3.5 h-3.5 text-[#2E7D32]" />
                  <span>Call Donor</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 text-center space-y-1">
              <p className="text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Pickup Verified & Collected ✓
              </p>
              <p className="text-[11px] text-gray-500">
                Handover was successfully verified with the donor.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Live Map Tracking for In-Progress Pickups */}
      {!isCompletedTab && (
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Route Tracking
            </span>
            <span className="text-[10px] text-gray-400 font-medium">OpenStreetMap Live</span>
          </div>
          <LiveTrackingMap
            pickupCoords={pickup.pickupCoords}
            dropoffCoords={pickup.dropoffCoords}
            volunteerCoords={pickup.volunteerCoords}
            pickupAddress={pickup.pickupAddress}
            dropoffAddress={pickup.dropoffAddress || 'Your Registered Shelter'}
            volunteerName={pickup.courier?.name || 'Volunteer Courier'}
            volunteerTransport={pickup.courier?.transport || 'bicycle'}
            status={pickup.status}
            height="380px"
            showExternalNav={!isVolunteer}
            userRole="receiver"
          />
        </div>
      )}

      {/* Stepper for both Volunteer and Direct Pickup */}
      <div className="py-2">
        {isVolunteer ? (
          <Stepper currentStep={pickup.stage || (pickup.status === 'in_transit' ? 4 : pickup.status === 'completed' ? 5 : 3)} />
        ) : (
          <Stepper
            steps={[
              { label: 'Order Accepted', stepNumber: 1 },
              { label: 'Ready for Collection', stepNumber: 2 },
              { label: 'Handover Verified', stepNumber: 3 },
              { label: 'Completed', stepNumber: 4 },
            ]}
            currentStep={
              pickup.status === 'completed'
                ? 4
                : pickup.status === 'picked_up'
                ? 3
                : pickup.status === 'ready_for_pickup'
                ? 2
                : 1
            }
          />
        )}
      </div>

      {/* Action Buttons Row */}
      {isCompletedTab && (
        <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-gray-100">
          <button
            onClick={onRate}
            className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            Rate & Feedback
          </button>

          <button
            onClick={onReportIssue}
            className="px-4 py-2.5 rounded-xl bg-white border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            Report Issue
          </button>
        </div>
      )}
    </div>
  )
}

function Stepper({ steps, currentStep = 4 }) {
  const activeSteps = steps || [
    { label: 'Order Placed', stepNumber: 1 },
    { label: 'Preparing', stepNumber: 2 },
    { label: 'Picked Up', stepNumber: 3 },
    { label: 'In Transit', stepNumber: 4 },
    { label: 'Delivered', stepNumber: 5 },
  ]
  const totalSteps = activeSteps.length

  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-6 right-6 top-3 -translate-y-1/2 h-0.5 bg-gray-200 z-0" />
        <div
          className="absolute left-6 top-3 -translate-y-1/2 h-0.5 bg-[#2E7D32] transition-all duration-300 z-0"
          style={{
            width: `${((Math.min(currentStep, totalSteps) - 1) / (totalSteps - 1)) * 92}%`,
          }}
        />

        {activeSteps.map((st) => {
          const isDone = st.stepNumber < currentStep
          const isCurrent = st.stepNumber === currentStep

          return (
            <div
              key={st.stepNumber}
              className="flex flex-col items-center relative z-10 text-center flex-1"
            >
              {isDone ? (
                <div className="w-6 h-6 rounded-full bg-[#2E7D32] text-white flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              ) : isCurrent ? (
                <div className="w-6 h-6 rounded-full bg-[#2E7D32] text-white flex items-center justify-center font-bold text-xs ring-4 ring-emerald-100 shadow-xs">
                  {st.stepNumber}
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-300 text-gray-400 flex items-center justify-center text-xs font-semibold">
                  {st.stepNumber}
                </div>
              )}

              <span
                className={`text-[10px] sm:text-[11px] mt-1.5 ${
                  isCurrent
                    ? 'font-bold text-[#2E7D32]'
                    : isDone
                    ? 'font-medium text-gray-700'
                    : 'text-gray-400 font-normal'
                }`}
              >
                {st.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function VerifyPickupModal({ order, isOpen, onClose, onVerified }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen || !order) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      setError('')
      await receiverService.verifyDirectPickup(order._id, code)
      setCode('')
      onVerified()
      onClose()
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Incorrect verification code. Please ask the donor for the correct code.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-gray-100">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#2E7D32] flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Verify Pickup</h3>
              <p className="text-xs text-gray-500">Confirm physical food handover</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="text-center space-y-1">
          <p className="text-xs font-semibold text-gray-700">
            Ask the donor for the 4-digit pickup code.
          </p>
          <p className="text-[11px] text-gray-400">
            {getCombinedFoodTitle(order)} · {order.donor}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              maxLength={4}
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="_ _ _ _"
              className="w-full tracking-widest text-center font-mono text-3xl font-extrabold py-3 px-3 rounded-xl border-2 border-emerald-300 focus:border-[#2E7D32] focus:ring-2 focus:ring-emerald-100 outline-hidden bg-emerald-50/20 text-[#2E7D32]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || code.length !== 4}
              className="px-5 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {submitting ? 'Verifying...' : 'Verify Pickup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
