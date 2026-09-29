import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Clock,
  Calendar,
  Package,
  Users,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Truck,
  HeartHandshake,
} from 'lucide-react'
import donorService from '../../services/donorService'
import { getFoodImageUrl, handleImageError } from '../../utils/imageHelper'
import { getExpiryCountdown } from '../../utils/dateHelper'

export default function DonationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [donation, setDonation] = useState(null)
  const [interestedReceivers, setInterestedReceivers] = useState([])
  const [actionModal, setActionModal] = useState(null) // { request, action: 'accept' | 'decline' }
  const [deliveryType, setDeliveryType] = useState('volunteer_delivery')
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await donorService.getDonationById(id)
      if (res.data) {
        setDonation(res.data.donation)
        setInterestedReceivers(res.data.interestedReceivers || [])
      }
    } catch (err) {
      console.error('Failed to load donation detail:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

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
      await loadData()
      if (actionModal.action === 'accept') {
        navigate('/donor/exchanges')
      }
    } catch (err) {
      alert(err.message || 'Action failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!donation) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 p-8">
        <p className="text-gray-500 text-sm">Donation listing not found.</p>
        <button
          onClick={() => navigate('/donor/my-food')}
          className="mt-3 px-4 py-2 bg-[#2E7D32] text-white text-xs font-semibold rounded-xl"
        >
          Back to donations
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button (Page 5 in PDF) */}
      <div>
        <button
          onClick={() => navigate('/donor/my-food')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to donations</span>
        </button>
        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight mt-1">
          Donation Detail
        </h1>
      </div>

      {/* Main Detail Container */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {/* Large Food Photo Banner (Page 5 in PDF) */}
        <div className="relative w-full h-64 sm:h-80 bg-gray-100">
          <img
            src={getFoodImageUrl(donation.imageUrl, donation.category)}
            alt={donation.title}
            onError={(e) => handleImageError(e, donation.category)}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-black/60 backdrop-blur-md text-white">
              {donation.category}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-600/90 backdrop-blur-md text-white capitalize">
              {donation.status}
            </span>
            {(() => {
              const expiry = getExpiryCountdown(donation.bestBefore)
              if (!expiry) return null
              return (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/95 backdrop-blur-md shadow-xs text-gray-900 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${expiry.dotClass}`} />
                  <span>{expiry.label}</span>
                </span>
              )
            })()}
          </div>
        </div>

        {/* Content details */}
        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              {donation.title}
            </h2>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              {donation.description}
            </p>

            {/* Dietary Tags */}
            {donation.tags && donation.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {donation.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 4-Item Details Grid (Page 5 in PDF) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-gray-50/70 border border-gray-100">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase text-gray-400">
                Quantity
              </span>
              <p className="text-sm font-bold text-gray-900">
                {donation.quantity} {donation.unit}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase text-gray-400">
                Pickup Window
              </span>
              <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>{donation.pickupWindow}</span>
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase text-gray-400">
                Pickup Address
              </span>
              <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>{donation.pickupAddress}</span>
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase text-gray-400">
                Best Before / Expiry
              </span>
              <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>
                  {new Date(donation.bestBefore).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </p>
            </div>
          </div>

          {/* Pickup Instructions Alert Box (Page 5 in PDF) */}
          {donation.pickupInstructions && (
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
              <h4 className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider mb-1">
                Pickup Instructions
              </h4>
              <p className="text-xs text-emerald-800 leading-relaxed">
                {donation.pickupInstructions}
              </p>
            </div>
          )}

          {/* Interested Receivers (Pages 5 & 6 in PDF) */}
          <div className="space-y-4 pt-2">
            <h3 className="text-base font-bold text-gray-900">
              Interested Receivers ({interestedReceivers.length})
            </h3>

            {interestedReceivers.length === 0 ? (
              <p className="text-xs text-gray-400 italic">
                No receiver requests submitted for this donation yet.
              </p>
            ) : (
              <div className="space-y-3">
                {interestedReceivers.map((req) => {
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
                      className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#2E7D32]/10 text-[#2E7D32] font-bold flex items-center justify-center text-xs">
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-900">
                                {receiverName}
                              </span>
                              <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                                {req.receiverExchangesCount || 4} exchanges
                              </span>
                            </div>
                            <span className="text-[11px] text-gray-400">
                              {new Date(req.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>

                        {req.status === 'pending' ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setActionModal({ request: req, action: 'accept' })}
                              className="px-3 py-1.5 rounded-lg bg-[#2E7D32] hover:bg-[#256428] text-white text-xs font-semibold shadow-2xs"
                            >
                              Accept Request
                            </button>
                            <button
                              onClick={() => setActionModal({ request: req, action: 'decline' })}
                              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 text-xs font-semibold"
                            >
                              Decline
                            </button>
                          </div>
                        ) : (
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

                      <p className="text-xs text-gray-600 bg-white p-3 rounded-lg border border-gray-100 italic">
                        "{req.message}"
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Donation Status Footer Bar (Page 6 in PDF) */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Donation Status: <strong className="capitalize text-gray-800">{donation.status}</strong></span>
            </span>
            <span>
              Created{' '}
              {new Date(donation.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

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
                  Accept request from{' '}
                  <strong>
                    {actionModal.request.receiverName || actionModal.request.receiver?.fullName}
                  </strong>
                  . How will this food exchange be transported?
                </p>

                {/* Handover Method Selection */}
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
                        Dispatch Community Volunteer (Recommended)
                      </p>
                      <p className="text-[11px] text-gray-500">
                        A verified volunteer courier will pick up from your doorstep and deliver to the receiver.
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
                        The receiver will personally arrive at your pickup address.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                Are you sure you want to decline this request? The receiver will be notified.
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
                  ? 'Confirm & Schedule Exchange'
                  : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
