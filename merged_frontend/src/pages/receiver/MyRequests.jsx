import { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import {
  Calendar,
  Bike,
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Inbox,
  ArrowRight,
} from 'lucide-react'
import receiverService from '../../services/receiverService'
import { getFoodImageUrl, handleImageError } from '../../utils/imageHelper'
import { formatQuantityUnit, getFoodHeading, getOrderItems } from '../../utils/unitHelper'
import CombinedItemsBreakdown from '../../components/common/CombinedItemsBreakdown'

export default function MyRequests() {
  const navigate = useNavigate()
  const { refreshBadges } = useOutletContext() || {}

  const [activeTab, setActiveTab] = useState('all')
  const [requests, setRequests] = useState([])
  const [counts, setCounts] = useState({ all: 0, pending: 0, completed: 0, declined: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancellingId, setCancellingId] = useState(null)
  const [toastMessage, setToastMessage] = useState('')

  const loadRequests = async (tab = activeTab) => {
    try {
      setLoading(true)
      const res = await receiverService.getRequests('all')
      if (res.data) {
        let reqs = res.data.requests || []
        // Treat accepted / approved / completed / delivered as completed
        reqs = reqs.map((r) => {
          if (['completed', 'delivered', 'approved', 'accepted'].includes(r.status)) {
            return { ...r, status: 'completed' }
          }
          return r
        })

        const pendingCount = reqs.filter((r) => r.status === 'pending').length
        const completedCount = reqs.filter((r) => ['completed', 'delivered'].includes(r.status)).length
        const declinedCount = reqs.filter((r) => ['declined', 'cancelled'].includes(r.status)).length

        setCounts({
          all: reqs.length,
          pending: pendingCount,
          completed: completedCount,
          declined: declinedCount,
        })

        if (tab === 'pending') {
          reqs = reqs.filter((r) => r.status === 'pending')
        } else if (tab === 'completed') {
          reqs = reqs.filter((r) => ['completed', 'delivered'].includes(r.status))
        } else if (tab === 'declined') {
          reqs = reqs.filter((r) => ['declined', 'cancelled'].includes(r.status))
        }

        const sortedReqs = [...reqs].sort((a, b) => {
          const timeB = new Date(b.updatedAt || b.createdAt || b.date || 0).getTime()
          const timeA = new Date(a.updatedAt || a.createdAt || a.date || 0).getTime()
          return timeB - timeA
        })

        setRequests(sortedReqs)
      }
    } catch (err) {
      setError('Unable to load requests.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests(activeTab)
  }, [activeTab])

  const handleCancelRequest = async (requestId) => {
    const confirmed = window.confirm(
      'Are you sure you want to cancel this food request? This action cannot be undone.'
    )
    if (!confirmed) return

    try {
      setCancellingId(requestId)
      await receiverService.cancelRequest(requestId)
      setToastMessage('Request has been cancelled.')
      setTimeout(() => setToastMessage(''), 4500)
      if (refreshBadges) refreshBadges()
      await loadRequests(activeTab)
    } catch (err) {
      alert(err.message || 'Failed to cancel request.')
    } finally {
      setCancellingId(null)
    }
  }

  const tabs = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'pending', label: 'Pending', count: counts.pending },
    { id: 'completed', label: 'Completed', count: counts.completed },
    { id: 'declined', label: 'Declined', count: counts.declined },
  ]

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-[#2E7D32] text-white rounded-xl shadow-xl text-xs font-semibold animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Tab Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#2E7D32] text-white shadow-2xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                ({tab.count ?? 0})
              </span>
            </button>
          )
        })}
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 border border-gray-200 h-28 animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-red-100">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-800">{error}</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-200">
          <Inbox className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">No {activeTab} requests found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            You don't have any food donation requests under this status.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {requests.map((req) => (
            <RequestRowCard
              key={req._id}
              request={req}
              onCancel={() => handleCancelRequest(req._id)}
              cancelling={cancellingId === req._id}
              onViewPickups={() => navigate('/receiver/pickups')}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function RequestRowCard({ request, onCancel, cancelling, onViewPickups }) {
  const isPending = request.status === 'pending'
  const isCompleted = ['completed', 'delivered', 'approved', 'accepted'].includes(request.status)
  const isDeclined = request.status === 'declined'
  const isCancelled = request.status === 'cancelled'

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5E7EB] shadow-xs hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Left Column: Thumbnail + Details */}
      <div className="flex items-center gap-4 min-w-0">
        <img
          src={getFoodImageUrl(request.imageUrl, request.category)}
          alt={request.title}
          className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl object-cover border border-gray-100 shrink-0"
          onError={(e) => handleImageError(e, request.category)}
        />

        <div className="min-w-0 space-y-1">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">
            {getFoodHeading(request, 'with_servings_suffix')}
          </h3>
          <p className="text-xs font-semibold text-gray-600">
            {request.donor}
          </p>

          {/* Meta row: Date · Method · Category */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-[11px] text-gray-500 pt-0.5">
            <span className="flex items-center gap-1 font-medium">
              <Calendar className="w-3 h-3 text-gray-400" />
              {request.date}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1 font-medium">
              {request.method === 'Volunteer Courier' ? (
                <Bike className="w-3.5 h-3.5 text-[#1565C0]" />
              ) : (
                <UserCheck className="w-3.5 h-3.5 text-[#E65100]" />
              )}
              {request.method}
            </span>
            <span>·</span>
            <span className="font-medium text-gray-500">{request.category}</span>
          </div>

          {/* If combined basket, show breakdown of items */}
          <CombinedItemsBreakdown items={getOrderItems(request)} />

          {/* Action buttons inside card */}
          <div className="pt-2">
            {isPending && (
              <button
                onClick={onCancel}
                disabled={cancelling}
                className="px-3 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Request'}
              </button>
            )}

            {isCompleted && (
              <button
                onClick={onViewPickups}
                className="px-3.5 py-1.5 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <span>View Pickups</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Status Badges */}
      <div className="flex sm:flex-col items-end justify-between sm:justify-center shrink-0">
        {isPending && (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF3CD] text-[#F59E0B] border border-amber-200/60 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Pending Review
          </span>
        )}

        {isCompleted && (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-[#2E7D32] border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </span>
        )}

        {isDeclined && (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" />
            Declined
          </span>
        )}

        {isCancelled && (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
            Cancelled
          </span>
        )}
      </div>
    </div>
  )
}
