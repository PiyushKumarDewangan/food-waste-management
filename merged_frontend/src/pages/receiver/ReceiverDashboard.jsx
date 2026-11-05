import { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import {
  Utensils,
  Truck,
  Users,
  CheckCircle2,
  Clock,
  Phone,
  AlertCircle,
  KeyRound,
  MapPin,
  X,
} from 'lucide-react'
import receiverService from '../../services/receiverService'
import { OrderDetailsModal } from '../../components/receiver/ReceiverModals'

export default function ReceiverDashboard() {
  const navigate = useNavigate()
  const { refreshBadges } = useOutletContext() || {}

  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState(null)
  const [error, setError] = useState('')

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [verifyModalOpen, setVerifyModalOpen] = useState(false)
  const [confirmingReceipt, setConfirmingReceipt] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const res = await receiverService.getDashboard()
      if (res.data) {
        setDashboardData(res.data)
      }
    } catch (err) {
      setError('Unable to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const handleConfirmReceived = async (orderId) => {
    try {
      setConfirmingReceipt(true)
      await receiverService.markOrderReceived(orderId)
      setToastMessage('Order confirmed as delivered and received! Added to History.')
      setTimeout(() => setToastMessage(''), 4500)
      if (refreshBadges) refreshBadges()
      await loadDashboard()
    } catch (err) {
      alert(err.message || 'Failed to confirm delivery.')
    } finally {
      setConfirmingReceipt(false)
    }
  }

  // Determine dynamic greeting
  const getGreeting = () => {
    const hours = new Date().getHours()
    if (hours < 12) return 'Good Morning'
    if (hours < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded-md w-64 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-gray-200 animate-pulse" />
          ))}
        </div>
        <div className="h-72 bg-white rounded-2xl border border-gray-200 animate-pulse" />
      </div>
    )
  }

  const stats = {
    mealsReceived: dashboardData?.stats?.mealsReceived ?? dashboardData?.stats?.mealsThisWeek ?? 0,
    activeDeliveries: dashboardData?.stats?.activeDeliveries ?? 0,
    pendingRequests: dashboardData?.stats?.pendingRequests ?? 0,
    volunteerAssistance: dashboardData?.stats?.volunteerAssistance ?? dashboardData?.stats?.volunteersDeployed ?? 0,
  }

  const activeDelivery = dashboardData?.activeDelivery

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-[#2E7D32] text-white rounded-xl shadow-xl text-xs font-semibold animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. 4 Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Meals Received */}
        <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#2E7D32]">
              {stats.mealsReceived}
            </span>
            <p className="text-xs font-bold text-gray-800 mt-1">Meals Received</p>
            <p className="text-[11px] text-gray-400 font-medium">servings</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#2E7D32] flex items-center justify-center shrink-0">
            <Utensils className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Active Deliveries */}
        <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#1565C0]">
              {stats.activeDeliveries}
            </span>
            <p className="text-xs font-bold text-gray-800 mt-1">Active Deliveries</p>
            <p className="text-[11px] text-gray-400 font-medium">ongoing</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1565C0] flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Pending Requests */}
        <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#E65100]">
              {stats.pendingRequests}
            </span>
            <p className="text-xs font-bold text-gray-800 mt-1">Pending Requests</p>
            <p className="text-[11px] text-gray-400 font-medium">awaiting approval</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#E65100] flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Volunteer Assistance */}
        <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#6A1B9A]">
              {stats.volunteerAssistance}
            </span>
            <p className="text-xs font-bold text-gray-800 mt-1">Volunteer Assistance</p>
            <p className="text-[11px] text-gray-400 font-medium">active couriers</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#6A1B9A] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Active Delivery Tracking */}
      <div className="w-full bg-white rounded-2xl p-5 sm:p-6 border border-[#E5E7EB] shadow-xs flex flex-col justify-between">
          {activeDelivery ? (
            <div className="space-y-5">
              {/* Header info */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-gray-900">
                    {activeDelivery.isDirectPickup
                      ? 'Active Pickup Tracking (Direct Self-Pickup)'
                      : 'Active Delivery Tracking (Volunteer Courier)'}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    Order #{activeDelivery.orderNo} · {activeDelivery.donorName} →{' '}
                    {activeDelivery.receiverOrg}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-[#E65100] border border-orange-200">
                    {activeDelivery.isDirectPickup ? 'Self-Pickup' : 'Volunteer Courier'}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-[#2E7D32]">
                    {activeDelivery.status || 'In Transit'}
                  </span>
                </div>
              </div>

              {/* Progress Stepper */}
              <div className="py-2">
                {activeDelivery.isDirectPickup ? (
                  <Stepper
                    steps={[
                      { label: 'Order Placed', stepNumber: 1 },
                      { label: 'Ready for Collection', stepNumber: 2 },
                      { label: 'Handover Verified', stepNumber: 3 },
                      { label: 'Delivered', stepNumber: 4 },
                    ]}
                    currentStep={
                      activeDelivery.status === 'completed'
                        ? 4
                        : activeDelivery.status === 'picked_up'
                        ? 3
                        : activeDelivery.status === 'ready_for_pickup'
                        ? 2
                        : 1
                    }
                  />
                ) : (
                  <Stepper currentStep={activeDelivery.stage || 4} />
                )}
              </div>

              {/* Specific Section: Direct Pickup Box vs Courier Row */}
              {activeDelivery.isDirectPickup ? (
                <div className="p-4 rounded-xl bg-[#E8F5E9]/50 border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#2E7D32] shrink-0" />
                      <span>{activeDelivery.pickupAddress}</span>
                    </p>
                    <p className="text-[11px] text-gray-600 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>Pickup Window: {activeDelivery.pickupWindow}</span>
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Ask the donor for their 4-digit pickup code when you arrive.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    {activeDelivery.status !== 'completed' ? (
                      <button
                        onClick={() => {
                          setSelectedOrder(activeDelivery)
                          setVerifyModalOpen(true)
                        }}
                        className="px-4 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
                      >
                        <KeyRound className="w-4 h-4" />
                        <span>Verify Pickup</span>
                      </button>
                    ) : (
                      <div className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-xs font-bold text-[#2E7D32]">
                        Pickup Verified ✓
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setSelectedOrder(activeDelivery)
                        setDetailsModalOpen(true)
                      }}
                      className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Details
                    </button>
                  </div>
                </div>
              ) : (
                /* Courier Row */
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#2E7D32] flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                        {activeDelivery.courier?.avatar ? (
                          <img
                            src={activeDelivery.courier.avatar}
                            alt={activeDelivery.courier.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          activeDelivery.courier?.name ? activeDelivery.courier.name.slice(0, 2).toUpperCase() : <Truck className="w-5 h-5 text-emerald-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-gray-900">
                          {activeDelivery.courier?.name || 'Searching for Volunteer Courier...'}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {activeDelivery.courier
                            ? `${activeDelivery.courier.transport || 'Courier'} · ETA ${activeDelivery.courier.eta || '~15 mins'} · ★ ${activeDelivery.courier.rating || 5.0}`
                            : 'Dispatching community volunteer courier...'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {activeDelivery.courier?.phone && (
                        <a
                          href={`tel:${activeDelivery.courier.phone}`}
                          className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:text-emerald-800 hover:bg-white transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Phone className="w-3.5 h-3.5 text-[#2E7D32]" />
                          Call Courier
                        </a>
                      )}
                      <button
                        onClick={() => {
                          setSelectedOrder(activeDelivery)
                          setDetailsModalOpen(true)
                        }}
                        className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        View Details
                      </button>
                    </div>
                  </div>

                  {/* Delivery Verification Code Box (Visible only after volunteer picked up food) */}
                  {['picked_up_by_volunteer', 'picked_up', 'out_for_delivery', 'in_transit'].includes(activeDelivery.status) && activeDelivery.deliveryCode && (
                    <div className="p-3.5 rounded-xl border-2 border-dashed border-[#2E7D32]/50 bg-[#E8F5E9]/30 text-center space-y-1">
                      <p className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider">
                        Delivery Verification Code
                      </p>
                      <p className="text-xl sm:text-2xl font-extrabold text-[#2E7D32] tracking-wider font-mono">
                        #{activeDelivery.deliveryCode}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Share this code with the volunteer when your food arrives.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">
              <Truck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-700">No Active Pickups or Deliveries Right Now</p>
              <p className="text-xs text-gray-400 mt-1">
                Approved direct pickups and volunteer deliveries will appear here with live tracking.
              </p>
            </div>
          )}
        </div>

      {/* Order Details Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
      />

      {/* Verify Direct Pickup Modal */}
      <VerifyPickupModal
        order={selectedOrder}
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        onVerified={async () => {
          setToastMessage('Pickup verified successfully! Food collected.')
          setTimeout(() => setToastMessage(''), 4500)
          if (refreshBadges) refreshBadges()
          await loadDashboard()
        }}
      />
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
      setError(err.message || 'Incorrect verification code. Please ask the donor for the correct code.')
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
            {order.donationTitle || order.title} · {order.donorName || order.donor}
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

// Dynamic Stepper Component
function Stepper({ steps, currentStep = 4 }) {
  const activeSteps = steps || [
    { label: 'Order Placed', stepNumber: 1 },
    { label: 'Preparing Food', stepNumber: 2 },
    { label: 'Picked Up', stepNumber: 3 },
    { label: 'In Transit', stepNumber: 4 },
    { label: 'Delivered', stepNumber: 5 },
  ]
  const totalSteps = activeSteps.length

  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Background Connecting Lines */}
        <div className="absolute left-6 right-6 top-3 -translate-y-1/2 h-0.5 bg-gray-200 z-0" />
        <div
          className="absolute left-6 top-3 -translate-y-1/2 h-0.5 bg-[#2E7D32] transition-all duration-300 z-0"
          style={{
            width: `${((Math.min(currentStep, totalSteps) - 1) / (Math.max(totalSteps - 1, 1))) * 92}%`,
          }}
        />

        {/* Steps */}
        {activeSteps.map((st) => {
          const isDone = st.stepNumber < currentStep
          const isCurrent = st.stepNumber === currentStep
          const isFuture = st.stepNumber > currentStep

          return (
            <div
              key={st.stepNumber}
              className="flex flex-col items-center relative z-10 text-center flex-1"
            >
              {/* Circle Icon */}
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

              {/* Label */}
              <span
                className={`text-[10px] sm:text-[11px] mt-1.5 transition-colors ${
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
