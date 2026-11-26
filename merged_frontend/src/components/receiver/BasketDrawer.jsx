import { useState } from 'react'
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Bike,
  UserCheck,
  Calendar,
  AlertTriangle,
  ChevronRight,
  Package,
} from 'lucide-react'
import { getFoodImageUrl, handleImageError } from '../../utils/imageHelper'
import { formatQuantityUnit } from '../../utils/unitHelper'

/**
 * Floating button that displays current basket item & unit count,
 * clicking opens the basket drawer.
 */
export function BasketFloatingButton({ basket, onClick }) {
  const totalItems = basket.items.length
  if (totalItems === 0) return null

  const totalUnits = basket.items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0)

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-3.5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer font-semibold animate-in slide-in-from-bottom-4"
      aria-label="View Food Basket"
    >
      <div className="relative">
        <ShoppingBag className="w-5 h-5" />
        <span className="absolute -top-1.5 -right-2 bg-white text-[#2E7D32] text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
          {totalItems}
        </span>
      </div>
      <div className="text-left">
        <p className="text-xs font-bold leading-tight">View Basket</p>
        <p className="text-[11px] text-emerald-100 font-medium">
          {totalItems} {totalItems === 1 ? 'item' : 'items'} ({totalUnits} total units)
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-emerald-200 shrink-0" />
    </button>
  )
}

/**
 * Slide-over / Modal Basket Drawer for reviewing items, adjusting quantities,
 * choosing delivery method and submitting a combined request.
 */
export function BasketDrawer({
  isOpen,
  onClose,
  basket,
  onUpdateQuantity,
  onRemoveItem,
  onClearBasket,
  onSubmitRequest,
  isSubmitting,
}) {
  const [deliveryMethod, setDeliveryMethod] = useState('volunteer_delivery')
  const [preferredDate, setPreferredDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  )
  const [notes, setNotes] = useState('')

  if (!isOpen) return null

  const totalItems = basket.items.length
  const totalUnits = basket.items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (totalItems === 0) return
    onSubmitRequest({
      donorId: basket.donorId,
      deliveryMethod,
      preferredDate,
      notes: notes.trim(),
      items: basket.items.map((it) => ({
        listingId: it.listing._id,
        servings: it.quantity,
        quantity: it.quantity,
        title: it.listing.title,
        unit: it.listing.unit || 'Servings',
        category: it.listing.category,
        imageUrl: it.listing.imageUrl,
      })),
    })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#2E7D32] flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-tight">
                Food Request Basket
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                {basket.donorName ? `From: ${basket.donorName}` : 'Selected food items'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Close Basket"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {totalItems === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-gray-800">Your basket is empty</p>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Browse available food items from a community and click &ldquo;+ Add to Basket&rdquo; to request multiple items together.
              </p>
            </div>
          ) : (
            <>
              {/* Item List Header + Clear Action */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Requested Items ({totalItems})
                </span>
                <button
                  type="button"
                  onClick={onClearBasket}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Basket
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {basket.items.map((it) => {
                  const maxQty = it.listing.servings || it.listing.quantity || 1
                  return (
                    <div
                      key={it.listing._id}
                      className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between gap-3"
                    >
                      {/* Image Thumbnail */}
                      <img
                        src={getFoodImageUrl(it.listing.imageUrl, it.listing.category)}
                        alt={it.listing.title}
                        className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0"
                        onError={(e) => handleImageError(e, it.listing.category)}
                      />

                      {/* Title & Available Info */}
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-gray-900 truncate">
                          {it.listing.title}
                        </h4>
                        <p className="text-[11px] text-gray-500">
                          {it.listing.category} · Max {maxQty} {it.listing.unit || 'servings'} available
                        </p>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(it.listing._id, it.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-gray-900">
                          {it.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(it.listing._id, it.quantity + 1)}
                          disabled={it.quantity >= maxQty}
                          className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 rounded cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => onRemoveItem(it.listing._id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors cursor-pointer shrink-0"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Delivery Method Selection */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-800">
                  Delivery Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('volunteer_delivery')}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      deliveryMethod === 'volunteer_delivery'
                        ? 'border-[#2E7D32] bg-emerald-50/50 text-[#2E7D32] ring-1 ring-[#2E7D32]'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-xs">
                      <Bike className="w-4 h-4 text-[#1565C0]" />
                      <span>Volunteer Courier</span>
                    </div>
                    <span className="text-[10px] text-gray-500">
                      Delivered to your address
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('direct_pickup')}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      deliveryMethod === 'direct_pickup'
                        ? 'border-[#2E7D32] bg-emerald-50/50 text-[#2E7D32] ring-1 ring-[#2E7D32]'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-xs">
                      <UserCheck className="w-4 h-4 text-[#E65100]" />
                      <span>Self-Pickup</span>
                    </div>
                    <span className="text-[10px] text-gray-500">
                      Collect directly at donor site
                    </span>
                  </button>
                </div>
              </div>

              {/* Preferred Date */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-800">
                  Preferred Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-900 focus:outline-none focus:border-[#2E7D32]"
                  />
                </div>
              </div>

              {/* Notes / Special Instructions */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-800">
                  Notes / Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Dietary notes, gate instructions, preferred drop-off time..."
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#2E7D32] resize-none"
                />
              </div>

              {/* Summary Card */}
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-950 space-y-1.5 text-xs">
                <div className="flex justify-between font-medium text-gray-700">
                  <span>Community:</span>
                  <span className="font-bold text-gray-900">{basket.donorName}</span>
                </div>
                <div className="flex justify-between font-medium text-gray-700">
                  <span>Distinct Food Items:</span>
                  <span className="font-bold text-gray-900">{totalItems}</span>
                </div>
                <div className="flex justify-between font-medium text-gray-700">
                  <span>Total Servings / Units:</span>
                  <span className="font-bold text-[#2E7D32]">{totalUnits}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer Actions */}
        {totalItems > 0 && (
          <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50 flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Continue Browsing
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-[#2E7D32] hover:bg-[#1B5E20] disabled:bg-gray-300 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Request...</span>
                </>
              ) : (
                <span>Request Food ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Confirmation dialog when user has items from Community A in basket
 * and attempts to add an item from Community B.
 */
export function SwitchCommunityModal({
  isOpen,
  currentCommunityName,
  newCommunityName,
  onConfirmSwitch,
  onCancel,
}) {
  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-sm w-full p-5 sm:p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 leading-tight">
              Switch Community Basket?
            </h3>
            <p className="text-xs text-gray-500">Items must be from one community</p>
          </div>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed">
          Your basket already contains items from{' '}
          <strong className="text-gray-900">{currentCommunityName || 'another community'}</strong>.
          Adding food from{' '}
          <strong className="text-gray-900">{newCommunityName || 'this community'}</strong> will
          clear your current basket.
        </p>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Keep Current Basket
          </button>
          <button
            type="button"
            onClick={onConfirmSwitch}
            className="px-4 py-2 bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Clear & Switch
          </button>
        </div>
      </div>
    </div>
  )
}
