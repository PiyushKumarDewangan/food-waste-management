import { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import {
  Truck,
  CheckCircle,
  Utensils,
  Star,
  MapPin,
  Phone,
  AlertTriangle,
  ArrowRight,
  KeyRound,
  X,
  ExternalLink,
  ShieldCheck,
  Package,
  Calendar,
} from 'lucide-react'
import { volunteerService } from '../../services/volunteerService'
import ReportIssueModal from '../../components/volunteer/ReportIssueModal'
import IncomingDispatchModal from '../../components/volunteer/IncomingDispatchModal'
import VolunteerReviewsModal from '../../components/volunteer/VolunteerReviewsModal'
import PhoneContactModal from '../../components/volunteer/PhoneContactModal'
import { formatQuantityUnit, getFoodHeading, getOrderItems } from '../../utils/unitHelper'
import CombinedItemsBreakdown from '../../components/common/CombinedItemsBreakdown'

export default function VolunteerDashboard() {
  const navigate = useNavigate()
  const { onRefreshCounts, isOnDuty } = useOutletContext() || {}

  const [activeDelivery, setActiveDelivery] = useState(null)
  const [completedDeliveries, setCompletedDeliveries] = useState([])
  const [deliveryViewTab, setDeliveryViewTab] = useState('active') // 'active' | 'completed'
  const [phoneModal, setPhoneModal] = useState(null)
  const [stats, setStats] = useState({
    activeDeliveries: 0,
    completedDeliveries: 0,
    mealsTransported: 0,
    volunteerRating: 0,
    reviewsCount: 0,
  })
  const [availablePool, setAvailablePool] = useState([])
  const [loading, setLoading] = useState(true)

  // Modals & alerts
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false)
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false)
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false)
  const [verifyDigits, setVerifyDigits] = useState(['', '', '', ''])
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifyError, setVerifyError] = useState('')
  const [dashboardAlert, setDashboardAlert] = useState('')
  const [simulatedDelivery, setSimulatedDelivery] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [myDelivsRes, availRes, profileRes, compDelivsRes] = await Promise.all([
        volunteerService.getMyDeliveries('active').catch(() => null),
        volunteerService.getAvailableDeliveries().catch(() => null),
        volunteerService.getProfile().catch(() => null),
        volunteerService.getMyDeliveries('completed').catch(() => null),
      ])

      const activeList = (myDelivsRes?.data?.deliveries || []).sort(
        (a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
      )
      const currentActive = activeList.length > 0 ? activeList[0] : null
      setActiveDelivery(currentActive)

      const compList = (compDelivsRes?.data?.deliveries || []).sort(
        (a, b) => new Date(b.deliveredAt || b.updatedAt || b.createdAt || 0) - new Date(a.deliveredAt || a.updatedAt || a.createdAt || 0)
      )
      setCompletedDeliveries(compList)

      const availableList = (availRes?.data?.deliveries || []).sort(
        (a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0)
      )
      setAvailablePool(availableList)

      const profileStats = profileRes?.data?.stats || {}
      const profileData = profileRes?.data?.profile || {}

      setStats({
        activeDeliveries: activeList.length,
        completedDeliveries: profileStats.totalDeliveriesCompleted || profileData.totalDeliveriesCompleted || compList.length || 0,
        mealsTransported: profileStats.totalMealsDelivered || profileData.totalMealsDelivered || 0,
        volunteerRating: profileStats.rating || profileData.rating || 0,
        reviewsCount: profileStats.reviewsCount || 0,
      })
    } catch (err) {
      console.error('Error loading volunteer dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [isOnDuty])

  // Automatically close dispatch modal if volunteer switches to Off-Duty
  useEffect(() => {
    if (!isOnDuty && isDispatchModalOpen) {
      setIsDispatchModalOpen(false)
    }
  }, [isOnDuty])

  // Handle reporting issue and reassigning
  const handleReportIssue = async ({ reason, note }) => {
    if (!activeDelivery) return
    try {
      setActionLoading(true)
      await volunteerService.reportIssue(activeDelivery._id, { reason, note })
      setIsReportModalOpen(false)
      if (onRefreshCounts) onRefreshCounts()
      await loadDashboardData()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to report issue.')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle accepting simulated / incoming dispatch
  const handleAcceptIncoming = async (deliveryId, transportType) => {
    if (!deliveryId) return
    try {
      setActionLoading(true)
      if (simulatedDelivery?.isDonationOnly) {
        setIsDispatchModalOpen(false)
        alert(
          `Delivery request for "${simulatedDelivery.donation?.title || 'Food'}" noted! Once a receiver requests courier delivery, this order will appear in your live tasks.`
        )
        return
      }
      await volunteerService.acceptDelivery(deliveryId, transportType ? { transportType } : {})
      setIsDispatchModalOpen(false)
      if (onRefreshCounts) onRefreshCounts()
      await loadDashboardData()
      navigate('/volunteer/deliveries')
    } catch (err) {
      const msg = err.response?.data?.message || ''
      if (msg.includes('off-duty')) {
        alert(msg)
        return
      }
      // If delivery is already accepted or in history, update state and navigate
      setIsDispatchModalOpen(false)
      if (onRefreshCounts) onRefreshCounts()
      await loadDashboardData()
      navigate('/volunteer/deliveries')
    } finally {
      setActionLoading(false)
    }
  }

  // Trigger Incoming Dispatch with Real Data & 10-Minute Timer
  const handleTriggerSimulate = async () => {
    // 0. If currently off-duty, strictly do not show incoming dispatch
    if (!isOnDuty) {
      alert(
        'You are currently Off-Duty. Switch your status to On-Duty in the header above to receive incoming delivery dispatches.'
      )
      return
    }

    // 1. If there is a real unassigned delivery in the pool, use it
    if (availablePool.length > 0) {
      setSimulatedDelivery(availablePool[0])
      setIsDispatchModalOpen(true)
      return
    }

    try {
      setActionLoading(true)
      // 2. Fetch latest genuine dispatch request from backend
      const res = await volunteerService.getLatestDispatchRequest()
      if (res?.data?.delivery) {
        setSimulatedDelivery(res.data.delivery)
        setIsDispatchModalOpen(true)
        return
      }

      // 3. Check real deliveries from volunteer's history
      const historyRes = await volunteerService.getMyDeliveries('all').catch(() => null)
      const realDeliveries = historyRes?.data?.deliveries || []

      if (realDeliveries.length > 0) {
        setSimulatedDelivery(realDeliveries[0])
        setIsDispatchModalOpen(true)
        return
      }
    } catch (e) {
      console.error('Error fetching dispatch request:', e)
    } finally {
      setActionLoading(false)
    }

    // 4. Fallback if no delivery or donation exists in database
    alert(
      'No delivery requests found in the pool yet. When a receiver requests food from a donor with volunteer delivery, it will automatically appear here!'
    )
  }

  // Determine stage for active delivery 4-step progress line
  // 1. Head to Donor
  // 2. Collect Food & Enter Code
  // 3. En Route to Receiver
  // 4. Handover & Drop-off
  const getActiveStepIndex = (status) => {
    if (status === 'volunteer_assigned') return 1 // Head to donor / collect
    if (['picked_up_by_volunteer', 'picked_up', 'out_for_delivery', 'in_transit'].includes(status)) return 3 // En route to receiver
    if (status === 'completed') return 4 // Done
    return 1
  }

  const activeStepIdx = activeDelivery ? getActiveStepIndex(activeDelivery.status) : 1
  const isEnRouteOrDropoff = activeStepIdx >= 3

  // Verification Code entry handlers
  const handleDigitChange = (index, value) => {
    const clean = value.replace(/[^0-9]/g, '').slice(-1)
    const newDigits = [...verifyDigits]
    newDigits[index] = clean
    setVerifyDigits(newDigits)
    if (clean && index < 3) {
      document.getElementById(`dash-v-digit-${index + 1}`)?.focus()
    }
  }

  const handleDigitKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !verifyDigits[index] && index > 0) {
      document.getElementById(`dash-v-digit-${index - 1}`)?.focus()
    }
  }

  const handleVerifyCodeSubmit = async (e) => {
    e.preventDefault()
    if (!activeDelivery) return
    const code = verifyDigits.join('').trim()
    if (code.length !== 4) {
      setVerifyError('Please enter all 4 digits of the verification code.')
      return
    }

    try {
      setVerifyLoading(true)
      setVerifyError('')
      if (!isEnRouteOrDropoff) {
        // Step 1: Donor Pickup Code
        await volunteerService.verifyPickup(activeDelivery._id, code)
        setDashboardAlert('Donor pickup verified! Delivery is now En Route to Receiver.')
      } else {
        // Step 2: Receiver Delivery Code
        await volunteerService.verifyDelivery(activeDelivery._id, code)
        setDashboardAlert('Receiver handover verified and delivery completed! Thank you.')
      }
      setIsVerifyModalOpen(false)
      setVerifyDigits(['', '', '', ''])
      if (onRefreshCounts) onRefreshCounts()
      await loadDashboardData()
    } catch (err) {
      setVerifyError(
        err.response?.data?.message ||
          'Invalid verification code. Please check with donor or receiver.'
      )
    } finally {
      setVerifyLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Deliveries */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-gray-500">Active Deliveries</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
              {stats.activeDeliveries}
            </div>
            <span className="text-[10px] text-emerald-700 font-medium">ongoing run</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* Completed Deliveries */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-gray-500">Completed Deliveries</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
              {stats.completedDeliveries}
            </div>
            <span className="text-[10px] text-gray-400 font-medium">all time</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Meals Transported */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-gray-500">Meals Transported</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
              {stats.mealsTransported}
            </div>
            <span className="text-[10px] text-emerald-700 font-medium">servings rescued</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#2E7D32] flex items-center justify-center">
            <Utensils className="w-5 h-5" />
          </div>
        </div>

        {/* Volunteer Rating Card - Clickable to View Reviews */}
        <div
          onClick={() => setIsReviewsModalOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setIsReviewsModalOpen(true)}
          className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-amber-300 shadow-xs hover:shadow-md transition-all flex items-center justify-between cursor-pointer group"
          title="Click to view detailed ratings and reviews"
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-gray-500">Volunteer Rating</span>
              <span className="text-[10px] text-amber-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                View reviews →
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 flex items-center gap-1.5">
              <span>★ {stats.volunteerRating > 0 ? stats.volunteerRating.toFixed(1) : '0.0'}</span>
            </div>
            <span className="text-[10px] text-amber-600 font-medium">
              {stats.reviewsCount > 0 ? `${stats.reviewsCount} reviews` : '0 reviews'}
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 group-hover:bg-amber-100 text-amber-600 flex items-center justify-center transition-colors">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          </div>
        </div>
      </div>

      {/* Dashboard Alert Notice */}
      {dashboardAlert && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#2E7D32]" />
            <span>{dashboardAlert}</span>
          </div>
          <button
            onClick={() => setDashboardAlert('')}
            className="text-emerald-700 hover:text-emerald-900 p-1 text-sm font-bold cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Delivery Section (Tabs: Active Run | Completed Runs) */}
      <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
        <button
          onClick={() => setDeliveryViewTab('active')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            deliveryViewTab === 'active'
              ? 'bg-[#2E7D32] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Active Run</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full ${
              deliveryViewTab === 'active' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {activeDelivery ? 1 : 0}
          </span>
        </button>

        <button
          onClick={() => setDeliveryViewTab('completed')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            deliveryViewTab === 'completed'
              ? 'bg-[#2E7D32] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          <span>Completed</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full ${
              deliveryViewTab === 'completed'
                ? 'bg-white/20 text-white'
                : 'bg-emerald-50 text-emerald-800'
            }`}
          >
            {completedDeliveries.length || stats.completedDeliveries}
          </span>
        </button>
      </div>

      {/* Active Delivery Section (Full Width) */}
      <div className="w-full space-y-6">
        {deliveryViewTab === 'completed' ? (
          /* Completed Deliveries View */
          <div className="space-y-4">
            {completedDeliveries.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-10 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-[#2E7D32] flex items-center justify-center">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-gray-800">No Completed Deliveries Yet</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  When you complete community food rescue runs and verify receiver drop-off codes, they will appear here with the completed status.
                </p>
                <button
                  onClick={() => navigate('/volunteer/deliveries?tab=upcoming')}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#256828] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Browse Available Tasks</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {completedDeliveries.map((item) => (
                  <div
                    key={item._id}
                    className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs hover:shadow-md transition-shadow space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-gray-400">
                            #{item.orderNo || item._id.slice(-6).toUpperCase()}
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-[#2E7D32] border border-emerald-200">
                            <CheckCircle className="w-3 h-3" />
                            Completed
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-gray-900 mt-1">
                          {getFoodHeading(item, 'volunteer')}
                        </h4>
                        <CombinedItemsBreakdown items={getOrderItems(item)} />
                      </div>
                      <span className="text-xs text-gray-400 font-medium">
                        Delivered successfully
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Picked Up From:</span>
                        <p className="font-bold text-gray-800 mt-0.5">
                          {item.donation?.donorOrganization || item.donor?.fullName || 'Donor Partner'}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate">
                          {item.pickupAddress || item.donation?.pickupAddress || 'Pickup Location'}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Delivered To:</span>
                        <p className="font-bold text-gray-800 mt-0.5">
                          {item.receiver?.organizationName || item.receiver?.fullName || 'Community Receiver'}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate">
                          {item.dropoffAddress || item.receiver?.address || 'Drop-off Address'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeDelivery ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 sm:p-7 space-y-6">
            {/* Header Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {isEnRouteOrDropoff ? 'En Route to Receiver' : 'Active Pickup Run'}
                  </span>
                  <span className="text-xs font-mono text-gray-400">
                    #{activeDelivery.orderNo || activeDelivery._id.slice(-6).toUpperCase()}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mt-1.5">
                  {getFoodHeading(activeDelivery, 'volunteer')}
                </h3>
                <CombinedItemsBreakdown items={getOrderItems(activeDelivery)} />
                <p className="text-xs text-gray-500 mt-0.5">
                  {activeDelivery.donation?.donorOrganization || activeDelivery.donor?.fullName || 'Donor'} →{' '}
                  {activeDelivery.receiver?.organizationName || activeDelivery.receiver?.fullName || 'Receiver Shelter'}
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="px-3 py-1 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700">
                  {activeDelivery.distance || '~3.8 km'}
                </span>
              </div>
            </div>

            {/* 4-Step Progress Line */}
            <div className="py-2">
              <div className="relative flex items-center justify-between">
                {/* Line */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2 z-0" />
                <div
                  className="absolute top-1/2 left-0 h-0.5 bg-[#2E7D32] -translate-y-1/2 z-0 transition-all duration-500"
                  style={{ width: `${((activeStepIdx - 1) / 3) * 100}%` }}
                />

                {/* 4 Steps */}
                {[
                  { title: 'Head to Donor', sub: 'estimated 10-12 min' },
                  { title: 'Collect Food & Enter Code', sub: 'Ask donor for code' },
                  { title: 'En Route to Receiver', sub: '15-18 min transit' },
                  { title: 'Handover & Drop-off', sub: 'Verify drop-off code' },
                ].map((s, idx) => {
                  const stepNum = idx + 1
                  const isDone = stepNum < activeStepIdx
                  const isCurrent = stepNum === activeStepIdx

                  return (
                    <div key={s.title} className="relative z-10 flex flex-col items-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isDone
                            ? 'bg-[#2E7D32] text-white'
                            : isCurrent
                            ? 'bg-[#2E7D32] text-white ring-4 ring-emerald-100'
                            : 'bg-white border-2 border-gray-300 text-gray-400'
                        }`}
                      >
                        {isDone ? '✓' : stepNum}
                      </div>
                      <span
                        className={`text-[10px] sm:text-[11px] font-semibold mt-2 text-center max-w-[70px] sm:max-w-[90px] leading-tight ${
                          isCurrent
                            ? 'text-[#2E7D32] font-bold'
                            : isDone
                            ? 'text-gray-800'
                            : 'text-gray-400'
                        }`}
                      >
                        {s.title}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Location Card & Directions (Accurate Donor Pickup OR Receiver Drop-off) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                    isEnRouteOrDropoff
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-emerald-100 text-[#2E7D32]'
                  }`}
                >
                  {isEnRouteOrDropoff ? 'B' : 'A'}
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {isEnRouteOrDropoff ? 'Drop-off Location (Receiver)' : 'Pickup Location (Donor)'}
                  </span>
                  <h4 className="text-sm font-bold text-gray-900">
                    {isEnRouteOrDropoff
                      ? activeDelivery.receiver?.organizationName || activeDelivery.receiver?.fullName || 'Receiver Partner'
                      : activeDelivery.donation?.donorOrganization || activeDelivery.donor?.fullName || 'Donor Partner'}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isEnRouteOrDropoff
                      ? activeDelivery.dropoffAddress || activeDelivery.receiver?.address || 'Drop-off Address'
                      : activeDelivery.pickupAddress || activeDelivery.donation?.pickupAddress || activeDelivery.donor?.address || 'Pickup Location'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Contact:{' '}
                    {isEnRouteOrDropoff
                      ? activeDelivery.receiver?.phone || 'No phone recorded'
                      : activeDelivery.donor?.phone || 'No phone recorded'}
                  </p>
                </div>
              </div>

              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${
                  isEnRouteOrDropoff
                    ? activeDelivery.dropoffCoords?.lat
                      ? `${activeDelivery.dropoffCoords.lat},${activeDelivery.dropoffCoords.lng}`
                      : encodeURIComponent(activeDelivery.dropoffAddress || activeDelivery.receiver?.address || 'Indore')
                    : activeDelivery.pickupCoords?.lat
                    ? `${activeDelivery.pickupCoords.lat},${activeDelivery.pickupCoords.lng}`
                    : encodeURIComponent(activeDelivery.pickupAddress || activeDelivery.donation?.pickupAddress || activeDelivery.donor?.address || 'Indore')
                }`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2E7D32] text-white text-xs font-bold hover:bg-[#256828] transition-colors shadow-2xs shrink-0 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Get Directions</span>
              </a>
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const donorPhone = activeDelivery.donor?.phone || activeDelivery.donation?.donorPhone || '+91 98200 44321'
                    const donorName = activeDelivery.donation?.donorOrganization || activeDelivery.donor?.fullName || 'Donor'
                    setPhoneModal({
                      isOpen: true,
                      title: 'Call Donor',
                      name: donorName,
                      phone: donorPhone,
                      role: 'Donor',
                    })
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer shadow-2xs"
                  title="View and copy donor contact number"
                >
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span>Call Donor</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const receiverPhone = activeDelivery.receiver?.phone || '+91 98201 12345'
                    const receiverName = activeDelivery.receiver?.organizationName || activeDelivery.receiver?.fullName || 'Receiver'
                    setPhoneModal({
                      isOpen: true,
                      title: 'Call Receiver',
                      name: receiverName,
                      phone: receiverPhone,
                      role: 'Receiver',
                    })
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer shadow-2xs"
                  title="View and copy receiver contact number"
                >
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span>Call Receiver</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Report an issue</span>
                </button>

                <button
                  onClick={() => {
                    setVerifyError('')
                    setVerifyDigits(['', '', '', ''])
                    setIsVerifyModalOpen(true)
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2E7D32] text-white text-xs font-bold hover:bg-[#256828] transition-colors shadow-xs cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Manage Run & Verify Code</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Empty State: Ready for new dispatches */
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-8 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-[#2E7D32] flex items-center justify-center">
              <Truck className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {isOnDuty ? 'No Active Delivery Right Now' : 'You are currently Off-Duty'}
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                {isOnDuty
                  ? 'You are active on-duty and ready for community dispatches. You can check available pool requests or test a simulated dispatch.'
                  : 'Switch your status to On-Duty in the header above to become available for new deliveries.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => navigate('/volunteer/deliveries?tab=upcoming')}
                className="px-5 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#256828] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                View Available Tasks ({availablePool.length})
              </button>
              {isOnDuty ? (
                <button
                  onClick={handleTriggerSimulate}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Simulate Incoming Dispatch
                </button>
              ) : (
                <button
                  onClick={() =>
                    alert(
                      'You are currently Off-Duty. Switch your status to On-Duty in the header above to receive incoming delivery dispatches.'
                    )
                  }
                  className="px-5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-400 text-xs font-semibold cursor-not-allowed opacity-80"
                  title="Switch to On-Duty in the header to receive dispatches"
                >
                  Simulate Incoming Dispatch (Off-Duty)
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Report Issue Modal */}
      <ReportIssueModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onConfirm={handleReportIssue}
        loading={actionLoading}
      />

      {/* Incoming Dispatch Modal - Strictly only shown when On-Duty */}
      <IncomingDispatchModal
        isOpen={isDispatchModalOpen && Boolean(isOnDuty)}
        onClose={() => setIsDispatchModalOpen(false)}
        onAccept={handleAcceptIncoming}
        delivery={simulatedDelivery}
        loading={actionLoading}
      />

      {/* Volunteer Reviews Modal */}
      <VolunteerReviewsModal
        isOpen={isReviewsModalOpen}
        onClose={() => setIsReviewsModalOpen(false)}
      />

      {/* Code Verification Modal */}
      {isVerifyModalOpen && activeDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#2E7D32] flex items-center justify-center font-bold">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {isEnRouteOrDropoff ? 'Verify Receiver Delivery Code' : 'Verify Donor Pickup Code'}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Order #{activeDelivery.orderNo || activeDelivery._id.slice(-6).toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsVerifyModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              {isEnRouteOrDropoff
                ? 'Ask the receiver for their 4-digit handover code upon delivering the food package.'
                : 'Ask the donor for their 4-digit pickup code when collecting the food containers.'}
            </p>

            {verifyError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{verifyError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyCodeSubmit} className="space-y-4">
              <div className="flex justify-center gap-3 py-1">
                {verifyDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`dash-v-digit-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                    className="w-12 h-14 text-center text-2xl font-bold rounded-2xl border border-gray-300 focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20 outline-none transition-all"
                  />
                ))}
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="submit"
                  disabled={verifyLoading || verifyDigits.join('').length !== 4}
                  className="w-full py-3 rounded-xl bg-[#2E7D32] hover:bg-[#256828] text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {verifyLoading
                      ? 'Validating Code...'
                      : isEnRouteOrDropoff
                      ? 'Confirm & Complete Handover'
                      : 'Confirm Food Pickup'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsVerifyModalOpen(false)
                    navigate('/volunteer/deliveries')
                  }}
                  className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                  <span>Open Full Route in My Deliveries</span>
                </button>
              </div>
            </form>
          </div>
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
