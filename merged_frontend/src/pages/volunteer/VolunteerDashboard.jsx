import { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import {
  Truck,
  CheckCircle,
  Utensils,
  Star,
  MapPin,
  Clock,
  Phone,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Sliders,
  History,
  TrendingUp,
  Volume2,
} from 'lucide-react'
import { volunteerService } from '../../services/volunteerService'
import ReportIssueModal from '../../components/volunteer/ReportIssueModal'
import IncomingDispatchModal from '../../components/volunteer/IncomingDispatchModal'
import VolunteerReviewsModal from '../../components/volunteer/VolunteerReviewsModal'

export default function VolunteerDashboard() {
  const navigate = useNavigate()
  const { onRefreshCounts, isOnDuty } = useOutletContext() || {}

  const [activeDelivery, setActiveDelivery] = useState(null)
  const [stats, setStats] = useState({
    activeDeliveries: 0,
    completedDeliveries: 0,
    mealsTransported: 0,
    volunteerRating: 0,
    reviewsCount: 0,
  })
  const [availablePool, setAvailablePool] = useState([])
  const [loading, setLoading] = useState(true)

  // Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false)
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false)
  const [simulatedDelivery, setSimulatedDelivery] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [myDelivsRes, availRes, profileRes] = await Promise.all([
        volunteerService.getMyDeliveries('active').catch(() => null),
        volunteerService.getAvailableDeliveries().catch(() => null),
        volunteerService.getProfile().catch(() => null),
      ])

      const activeList = myDelivsRes?.data?.deliveries || []
      const currentActive = activeList.length > 0 ? activeList[0] : null
      setActiveDelivery(currentActive)

      const availableList = availRes?.data?.deliveries || []
      setAvailablePool(availableList)

      const profileStats = profileRes?.data?.stats || {}
      const profileData = profileRes?.data?.profile || {}

      setStats({
        activeDeliveries: activeList.length,
        completedDeliveries: profileStats.totalDeliveriesCompleted || profileData.totalDeliveriesCompleted || 0,
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
  }, [])

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
  const handleAcceptIncoming = async (deliveryId) => {
    try {
      setActionLoading(true)
      await volunteerService.acceptDelivery(deliveryId)
      setIsDispatchModalOpen(false)
      if (onRefreshCounts) onRefreshCounts()
      await loadDashboardData()
      navigate('/volunteer/deliveries')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to claim delivery.')
    } finally {
      setActionLoading(false)
    }
  }

  // Trigger Incoming Dispatch Simulator
  const handleTriggerSimulate = () => {
    if (availablePool.length > 0) {
      setSimulatedDelivery(availablePool[0])
    } else {
      setSimulatedDelivery({
        _id: 'mock-dispatch-' + Date.now(),
        donation: {
          title: '30 Meal Boxes — Vegetable Curry & Rice',
          donorOrganization: 'City Bistro Indore',
          quantity: 30,
          category: 'Cooked Meals',
        },
        donor: {
          fullName: 'City Bistro',
          address: '14 M.G. Road, South Tukoganj, Indore',
          phone: '+91 98260 11223',
        },
        receiver: {
          fullName: 'Grace Food Bank & Shelter',
          address: '42 River View Road, Indore',
          phone: '+91 98930 44556',
        },
      })
    }
    setIsDispatchModalOpen(true)
  }

  // Determine stage for active delivery 4-step progress line
  // 1. Head to Donor
  // 2. Collect Food & Enter Code
  // 3. En Route to Receiver
  // 4. Handover & Drop-off
  const getActiveStepIndex = (status) => {
    if (status === 'volunteer_assigned') return 1 // Step 1/2: heading to donor / enter code
    if (status === 'picked_up_by_volunteer' || status === 'picked_up') return 2 // Step 2 complete, ready for transit
    if (status === 'out_for_delivery' || status === 'in_transit') return 3 // Step 3: en route to receiver
    if (status === 'completed') return 4 // Done
    return 1
  }

  const activeStepIdx = activeDelivery ? getActiveStepIndex(activeDelivery.status) : 1

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

      {/* Main Grid: Active Delivery (Left 2/3) + Quick Actions (Right 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Delivery Card */}
        <div className="lg:col-span-2 space-y-6">
          {activeDelivery ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 sm:p-7 space-y-6">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Active Delivery
                    </span>
                    <span className="text-xs font-mono text-gray-400">
                      #{activeDelivery.orderNo || activeDelivery._id.slice(-6).toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mt-1.5">
                    {activeDelivery.donation?.quantity || 25} Servings of{' '}
                    {activeDelivery.donation?.title || 'Cooked Meals'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {activeDelivery.donation?.donorOrganization || activeDelivery.donor?.fullName || 'Donor'} →{' '}
                    {activeDelivery.receiver?.fullName || 'Receiver Shelter'}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="px-3 py-1 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700">
                    ~4.2 km
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

              {/* Location Card & Directions */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#2E7D32] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    A
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Pickup Location
                    </span>
                    <h4 className="text-sm font-bold text-gray-900">
                      {activeDelivery.donation?.donorOrganization || activeDelivery.donor?.fullName || 'Green Table Restaurant'}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {activeDelivery.donor?.address || activeDelivery.pickupAddress || '14 Park Street, Indore, Madhya Pradesh'}
                    </p>
                  </div>
                </div>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    activeDelivery.donor?.address || activeDelivery.pickupAddress || 'Indore'
                  )}`}
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
                  {activeDelivery.donor?.phone && (
                    <a
                      href={`tel:${activeDelivery.donor.phone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span>Call Donor</span>
                    </a>
                  )}

                  {activeDelivery.receiver?.phone && (
                    <a
                      href={`tel:${activeDelivery.receiver.phone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span>Call Receiver</span>
                    </a>
                  )}
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
                    onClick={() => navigate('/volunteer/deliveries')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2E7D32] text-white text-xs font-bold hover:bg-[#256828] transition-colors shadow-xs cursor-pointer"
                  >
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
                <h3 className="text-lg font-bold text-gray-900">No Active Delivery Right Now</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                  You are active on-duty and ready for community dispatches. You can check available pool requests or test a simulated dispatch.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => navigate('/volunteer/deliveries?tab=upcoming')}
                  className="px-5 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#256828] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  View Available Tasks ({availablePool.length})
                </button>
                <button
                  onClick={handleTriggerSimulate}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Simulate Incoming Dispatch
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Quick Actions Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-gray-900">Quick Actions</h4>
              <p className="text-[11px] text-gray-400 mt-0.5">Everything you need, one tap away</p>
            </div>

            <div className="space-y-1.5">
              <button
                onClick={() => navigate('/volunteer/deliveries')}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors text-left text-xs font-semibold text-gray-700 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>View Active Delivery Route</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>

              <button
                onClick={() => navigate('/volunteer/history')}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors text-left text-xs font-semibold text-gray-700 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <History className="w-4 h-4 text-blue-600" />
                  <span>Check Delivery History</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>

              <button
                onClick={() => navigate('/volunteer/impact')}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors text-left text-xs font-semibold text-gray-700 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span>See My Impact & Badges</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>

              <button
                onClick={() => navigate('/volunteer/profile')}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors text-left text-xs font-semibold text-gray-700 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Sliders className="w-4 h-4 text-amber-600" />
                  <span>Vehicle & Distance Settings</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>

              <button
                onClick={() => {
                  if (activeDelivery) {
                    setIsReportModalOpen(true)
                  } else {
                    alert('You currently have no active delivery to report an issue for.')
                  }
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-red-50/60 transition-colors text-left text-xs font-semibold text-red-600 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span>Report a Delivery Issue</span>
                </div>
                <ChevronRight className="w-4 h-4 text-red-300" />
              </button>
            </div>

            {/* Simulator Box (Page 7) */}
            <div className="pt-3 border-t border-gray-100">
              <button
                onClick={handleTriggerSimulate}
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50/50 border border-emerald-100 text-left hover:border-emerald-300 transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#2E7D32] text-white flex items-center justify-center font-bold text-xs">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900">Simulate Incoming Dispatch</div>
                    <div className="text-[10px] text-emerald-800">Preview dispatch popup</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-700" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Issue Modal */}
      <ReportIssueModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onConfirm={handleReportIssue}
        loading={actionLoading}
      />

      {/* Incoming Dispatch Modal */}
      <IncomingDispatchModal
        isOpen={isDispatchModalOpen}
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
    </div>
  )
}
