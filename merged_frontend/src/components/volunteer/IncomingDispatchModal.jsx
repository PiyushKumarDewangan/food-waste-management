import { useState, useEffect } from 'react'
import { Bell, MapPin, Package, Clock, X, Check } from 'lucide-react'
import {
  formatQuantityUnit,
  getPackageWeightKg,
  getFoodHeading,
  getCombinedFoodTitle,
  isCombinedBasket,
  getOrderItems,
  getTotalUnits,
} from '../../utils/unitHelper'
import CombinedItemsBreakdown from '../common/CombinedItemsBreakdown'

export default function IncomingDispatchModal({ isOpen, onClose, onAccept, delivery, loading }) {
  // 10 minutes = 600 seconds
  const [timeLeft, setTimeLeft] = useState(600)
  const [selectedTransport, setSelectedTransport] = useState(delivery?.suggestedTransport || 'bicycle')

  useEffect(() => {
    if (delivery?.suggestedTransport) {
      setSelectedTransport(delivery.suggestedTransport)
    }
  }, [delivery])

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(600)
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

  // Format MM:SS (e.g. 10:00, 09:59, 08:30)
  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60)
    const secs = sec % 60
    const m = mins < 10 ? `0${mins}` : mins
    const s = secs < 10 ? `0${secs}` : secs
    return `${m}:${s}`
  }

  const donorName =
    delivery.donation?.donorOrganization ||
    delivery.donor?.organizationName ||
    delivery.donor?.fullName ||
    delivery.donorName ||
    'Local Donor Partner'

  const pickupAddress =
    delivery.pickupAddress ||
    delivery.donation?.pickupAddress ||
    delivery.donor?.address ||
    'Donor Pickup Address'

  const receiverName =
    delivery.receiver?.organizationName ||
    delivery.receiverInfo?.organization ||
    delivery.receiver?.fullName ||
    delivery.receiverInfo?.name ||
    delivery.receiverOrg ||
    'Community Partner'

  const dropoffAddress =
    delivery.dropoffAddress ||
    delivery.receiver?.address ||
    'Drop-off Destination Address'

  const isCombined = isCombinedBasket(delivery)
  const items = getOrderItems(delivery)
  const servings = isCombined ? getTotalUnits(delivery) : (delivery.donation?.quantity || delivery.servings || 1)
  const unit = isCombined ? 'Servings' : (delivery.donation?.unit || 'Servings')
  const title = isCombined ? getCombinedFoodTitle(delivery) : (delivery.donation?.title || delivery.title || 'Food Donation')
  const pickupDistance = delivery.distance || '~1.5 km away'
  const approxWeight = getPackageWeightKg(servings, unit)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
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

        {/* 10-Minute Countdown Timer */}
        <div className="mb-5 bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-900 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              Time remaining to accept:
            </span>
            <span className="font-mono text-sm font-bold text-amber-900">
              {formatTime(timeLeft)}
            </span>
          </div>
          <div className="w-full bg-amber-200/60 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-500 h-1.5 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${(timeLeft / 600) * 100}%` }}
            />
          </div>
        </div>

        {/* Route Details */}
        <div className="space-y-3 mb-5">
          {/* Pickup A */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-[#2E7D32] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              A
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Pickup</span>
                <span className="text-xs font-semibold text-gray-600">{pickupDistance}</span>
              </div>
              <h4 className="text-sm font-bold text-gray-900 truncate">{donorName}</h4>
              <p className="text-xs text-gray-500 truncate">
                {pickupAddress}
              </p>
            </div>
          </div>

          {/* Drop-off B */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              B
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Drop-off</span>
                <span className="text-xs font-semibold text-gray-600">Recipient</span>
              </div>
              <h4 className="text-sm font-bold text-gray-900 truncate">{receiverName}</h4>
              <p className="text-xs text-gray-500 truncate">
                {dropoffAddress}
              </p>
            </div>
          </div>

          {/* Package Details */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-100 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-[#2E7D32]" />
                <span className="font-bold text-gray-800">
                  {formatQuantityUnit(servings, unit)} · {title}
                </span>
              </div>
              <span className="font-semibold text-emerald-800">~{approxWeight} kg Package</span>
            </div>
            {isCombined && (
              <CombinedItemsBreakdown items={items} />
            )}
          </div>
        </div>

        {/* Task Vehicle Selector (Change 3: switch vehicle for this delivery only) */}
        <div className="mb-4 bg-gray-50/90 border border-gray-100 rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-gray-800">Vehicle for this delivery:</span>
            <span className="text-[10px] text-gray-400 font-medium">Profile default stays intact</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: 'bicycle', label: 'Bicycle', icon: '🚲' },
              { id: 'motorcycle', label: 'Motorcycle', icon: '🛵' },
              { id: 'car', label: 'Car', icon: '🚗' },
              { id: 'walking', label: 'Walking', icon: '🚶' },
            ].map((v) => {
              const isSelected = selectedTransport === v.id
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedTransport(v.id)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#2E7D32] text-white shadow-xs'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200/60'
                  }`}
                >
                  <span className="text-base">{v.icon}</span>
                  <span className="text-[11px]">{v.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onAccept(delivery._id, selectedTransport)}
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
