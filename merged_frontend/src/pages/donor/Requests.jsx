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
import { formatUnit } from '../../utils/unitHelper'

export default function Requests() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('new')
  const [requests, setRequests] = useState([])
  const [counts, setCounts] = useState({ all: 0, new: 0, accepted: 0, declined: 0 })
  const [loading, setLoading] = useState(true)
  const [declineModalRequest, setDeclineModalRequest] = useState(null)
  const [submittingActionId, setSubmittingActionId] = useState(null)
  const [toastMessage, setToastMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

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

  // Direct Accept without method-selection popup (reads method from request)
  const handleAccept = async (req) => {
    try {
      setSubmittingActionId(req._id)
      setErrorMessage('')
      await donorService.respondToRequest(req._id, 'accept')
      setToastMessage('Request accepted! Scheduling exchange...')
      await loadRequests(activeTab)
      setTimeout(() => {
        navigate('/donor/exchanges')
      }, 600)
    } catch (err) {
      setErrorMessage(err.message || 'Failed to accept request.')
      setTimeout(() => setErrorMessage(''), 5000)
    } finally {
      setSubmittingActionId(null)
    }
  }

  // Handle Decline confirmation
  const handleDecline = async () => {
    if (!declineModalRequest) return
    try {
      setSubmittingActionId(declineModalRequest._id)
      setErrorMessage('')
      await donorService.respondToRequest(declineModalRequest._id, 'decline')
      setDeclineModalRequest(null)
      setToastMessage('Request has been declined.')
      setTimeout(() => setToastMessage(''), 4000)
      await loadRequests(activeTab)
    } catch (err) {
      setErrorMessage(err.message || 'Failed to decline request.')
      setTimeout(() => setErrorMessage(''), 5000)
    } finally {
      setSubmittingActionId(null)
    }
  }

  const tabs = [
    { key: 'new', label: `New (${counts.new || 0})` },
    { key: 'accepted', label: `Accepted (${counts.accepted || 0})` },
    { key: 'declined', label: `Declined (${counts.declined || 0})` },
    { key: 'all', label: `All (${counts.all || 0})` },
  ]

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-[#2E7D32] text-white rounded-xl shadow-xl text-xs font-semibold animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

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
                          • {req.receiverExchangesCount ?? 0} {req.receiverExchangesCount === 1 ? 'completed exchange' : 'completed exchanges'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">
                          Requested:{' '}
                          <strong className="text-gray-900">
                            {req.donation?.title}
                          </strong>{' '}
                          ({req.requestedQuantity} {formatUnit(req.requestedUnit)})
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

                {/* Receiver Message Box with Delivery Method Badge */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100/80 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      Message & Delivery Method
                    </p>
                    {(req.deliveryPreference === 'direct_pickup' || req.deliveryMethod === 'direct_pickup') ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#2E7D32] border border-emerald-200">
                        <HeartHandshake className="w-3.5 h-3.5" />
                        <span>Direct Receiver Pickup</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#1565C0] border border-blue-200">
                        <Truck className="w-3.5 h-3.5" />
                        <span>Volunteer Courier</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed italic">
                    "{req.message}"
                  </p>
                </div>

                {/* Bottom Actions if Pending */}
                {req.status === 'pending' && (
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => setDeclineModalRequest(req)}
                      disabled={submittingActionId === req._id}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleAccept(req)}
                      disabled={submittingActionId === req._id}
                      className="px-5 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#256428] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                    >
                      {submittingActionId === req._id ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Accepting...</span>
                        </>
                      ) : (
                        <span>Accept Request</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Decline Confirmation Modal */}
      {declineModalRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-gray-900">
              Decline Food Request
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to decline this request from{' '}
              <strong>
                {declineModalRequest.receiverName || declineModalRequest.receiver?.fullName || 'the receiver'}
              </strong>
              ? They will be notified immediately.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeclineModalRequest(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingActionId === declineModalRequest._id}
                onClick={handleDecline}
                className="px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-xs bg-red-600 hover:bg-red-700 cursor-pointer"
              >
                {submittingActionId === declineModalRequest._id ? 'Declining...' : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
