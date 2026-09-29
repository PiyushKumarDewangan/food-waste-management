import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Truck,
  HeartHandshake,
  Clock,
  MapPin,
  Utensils,
  AlertCircle,
} from 'lucide-react'
import donorService from '../../services/donorService'

export default function Requests() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('new')
  const [requests, setRequests] = useState([])
  const [counts, setCounts] = useState({ all: 0, new: 0, accepted: 0, declined: 0 })
  const [loading, setLoading] = useState(true)
  const [actionModal, setActionModal] = useState(null)
  const [deliveryType, setDeliveryType] = useState('volunteer_delivery')
  const [submitting, setSubmitting] = useState(false)

  const loadRequests = async (tab = activeTab) => {
    try {
      setLoading(true)
      const res = await donorService.getRequests(tab)
      if (res.data) {
        setRequests(res.data.requests || [])
        if (res.data.counts) setCounts(res.data.counts)
      }
    } catch (err) {
      console.error('Failed to load requests:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests(activeTab)
  }, [activeTab])

  const handleAction = async () => {
    if (!actionModal) return
    try {
      setSubmitting(true)
      await donorService.respondToRequest(
        actionModal.request._id,
        actionModal.action,
        deliveryType
      )
      setActionModal(null)
      await loadRequests(activeTab)
      if (actionModal.action === 'accept') {
        navigate('/donor/exchanges')
      }
    } catch (err) {
      alert(err.message || 'Action failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const tabs = [
    { key: 'new', label: `New (${counts.new || 0})` },
    { key: 'accepted', label: `Accepted (${counts.accepted || 0})` },
    { key: 'declined', label: `Declined (${counts.declined || 0})` },
    { key: 'all', label: `All (${counts.all || 0})` },
  ]

  return (
    <div className="space-y-6">
      {/* Header (Page 7 in PDF) */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          Requests ({counts.new || requests.length})
        </h1>
        <p className="text-xs text-gray-500 font-medium mt-0.5">
          Review and respond to food requests from your community.
        </p>
      </div>

      {/* Filter Tabs (Page 7 in PDF) */}
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

      {/* Requests List */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#2E7D32] flex items-center justify-center mx-auto mb-3">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No requests in this view</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            When receivers in your community request your food donations, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const receiverName =
              req.receiverName || req.receiver?.fullName || 'Community Receiver'
            const initials = receiverName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .substring(0, 2)
              .toUpperCase()

            return (
              <div
                key={req._id}
                className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-xs hover:shadow-md transition-shadow space-y-4"
              >
                {/* Top: Receiver info, Requested Food & Time */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#2E7D32]/10 text-[#2E7D32] font-bold flex items-center justify-center text-sm shrink-0">
                      {initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-900">{receiverName}</h3>
                        <span className="text-[11px] text-gray-400 font-medium">
                          • {req.receiverExchangesCount || 4} exchanges
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">
                          Requested:{' '}
                          <strong className="text-gray-900">
                            {req.donation?.title}
                          </strong>{' '}
                          ({req.requestedQuantity} {req.requestedUnit})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {new Date(req.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </span>
                    {req.status !== 'pending' && (
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          req.status === 'accepted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {req.status}
                      </span>
                    )}
                  </div>
                </div>

                {/* Receiver Message Box (Page 7 in PDF) */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100/80">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Message
                  </p>
                  <p className="text-xs text-gray-700 leading-relaxed italic">
                    "{req.message}"
                  </p>
                </div>

                {/* Bottom Actions if Pending */}
                {req.status === 'pending' && (
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => setActionModal({ request: req, action: 'decline' })}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-red-600 transition-colors"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => setActionModal({ request: req, action: 'accept' })}
                      className="px-5 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#256428] text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      Accept Request
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Accept / Decline Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-gray-900">
              {actionModal.action === 'accept' ? 'Accept Food Request' : 'Decline Request'}
            </h3>

            {actionModal.action === 'accept' ? (
              <div className="space-y-4">
                <p className="text-xs text-gray-600">
                  You are accepting this request from{' '}
                  <strong>
                    {actionModal.request.receiverName || actionModal.request.receiver?.fullName}
                  </strong>
                  . Please choose the fulfillment method:
                </p>

                <div className="space-y-2">
                  <label
                    onClick={() => setDeliveryType('volunteer_delivery')}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      deliveryType === 'volunteer_delivery'
                        ? 'border-[#2E7D32] bg-emerald-50/50 ring-1 ring-[#2E7D32]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Truck className="w-5 h-5 text-[#2E7D32] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-gray-900">
                        Assign Volunteer Courier (Recommended)
                      </p>
                      <p className="text-[11px] text-gray-500">
                        A verified community volunteer will pick up the food from your address and transport it safely to the receiver.
                      </p>
                    </div>
                  </label>

                  <label
                    onClick={() => setDeliveryType('direct_pickup')}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      deliveryType === 'direct_pickup'
                        ? 'border-[#2E7D32] bg-emerald-50/50 ring-1 ring-[#2E7D32]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <HeartHandshake className="w-5 h-5 text-gray-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-gray-900">Direct Receiver Pickup</p>
                      <p className="text-[11px] text-gray-500">
                        The receiver will come directly to your doorstep for pickup.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                Are you sure you want to decline this food request?
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleAction}
                className={`px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-xs ${
                  actionModal.action === 'accept'
                    ? 'bg-[#2E7D32] hover:bg-[#256428]'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {submitting
                  ? 'Processing...'
                  : actionModal.action === 'accept'
                  ? 'Confirm & Create Exchange'
                  : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
