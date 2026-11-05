import { useState, useEffect } from 'react'
import { Bell, MapPin, Package, Clock, X, Check } from 'lucide-react'

export default function IncomingDispatchModal({ isOpen, onClose, onAccept, delivery, loading }) {
  const [timeLeft, setTimeLeft] = useState(45)

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(45)
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          onClose()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen, onClose])

  if (!isOpen || !delivery) return null

  const formatSeconds = (sec) => {
    const s = sec < 10 ? `0${sec}` : sec
    return `00:${s}`
  }

  const donorName = delivery.donation?.donorOrganization || delivery.donor?.fullName || 'Local Donor'
  const receiverName = delivery.receiver?.fullName || 'Community Food Bank'
  const servings = delivery.donation?.quantity || delivery.servings || 25
  const title = delivery.donation?.title || 'Cooked Meals'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#2E7D32] flex items-center justify-center shadow-xs">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              Nearby Request
            </span>
            <h3 className="text-lg font-bold text-gray-900 mt-0.5">New Delivery Request!</h3>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="mb-5 bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-900 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              Time remaining to accept:
            </span>
            <span className="font-mono text-sm font-bold text-amber-900">
              {formatSeconds(timeLeft)}
            </span>
          </div>
          <div className="w-full bg-amber-200/60 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-500 h-1.5 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${(timeLeft / 45) * 100}%` }}
            />
          </div>
        </div>

        {/* Route Details */}
        <div className="space-y-3 mb-5">
          {/* Pickup */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-[#2E7D32] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              A
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Pickup</span>
                <span className="text-xs font-semibold text-gray-600">~1.2 km away</span>
              </div>
              <h4 className="text-sm font-bold text-gray-900 truncate">{donorName}</h4>
              <p className="text-xs text-gray-500 truncate">
                {delivery.donor?.address || delivery.pickupAddress || 'Address available upon accepting'}
              </p>
            </div>
          </div>

          {/* Drop-off */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              B
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Drop-off</span>
                <span className="text-xs font-semibold text-gray-600">~4.5 km away</span>
              </div>
              <h4 className="text-sm font-bold text-gray-900 truncate">{receiverName}</h4>
              <p className="text-xs text-gray-500 truncate">
                {delivery.receiver?.address || delivery.dropoffAddress || 'Address available upon accepting'}
              </p>
            </div>
          </div>

          {/* Package details */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-100 text-xs">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[#2E7D32]" />
              <span className="font-bold text-gray-800">{servings} Servings · {title}</span>
            </div>
            <span className="font-semibold text-emerald-800">~8 kg Package</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onAccept(delivery._id)}
            disabled={loading}
            className="flex-1 py-3 rounded-2xl bg-[#2E7D32] hover:bg-[#256828] text-white text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{loading ? 'Claiming Delivery...' : 'Accept Delivery'}</span>
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="py-3 px-4 rounded-2xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold transition-colors cursor-pointer"
          >
            Decline · Pass to Next Volunteer
          </button>
        </div>
      </div>
    </div>
  )
}
