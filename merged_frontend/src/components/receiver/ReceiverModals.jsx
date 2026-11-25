import { useState } from 'react'
import {
  X,
  Star,
  AlertTriangle,
  HelpCircle,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Truck,
  UserCheck,
  HeartHandshake,
  Check,
} from 'lucide-react'
import { getFoodImageUrl, handleImageError } from '../../utils/imageHelper'
import { getCombinedFoodTitle, getOrderItems } from '../../utils/unitHelper'
import CombinedItemsBreakdown from '../common/CombinedItemsBreakdown'

// 1. Floating Round Help Button + Help Modal
export function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          aria-label="Close Help Modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#2E7D32] flex items-center justify-center">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 id="help-modal-title" className="text-base font-bold text-gray-900">
              FoodShare Help & Support
            </h3>
            <p className="text-xs text-gray-500">Receiver & NGO Assistance Desk</p>
          </div>
        </div>

        <div className="space-y-3.5 text-xs text-gray-600">
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
            <p className="font-semibold text-gray-800 mb-1">How do Food Requests work?</p>
            <p>
              Browse listings, pick your servings, and select delivery or direct pickup. Once approved by the donor, an order with live tracking and handover codes is generated.
            </p>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
            <p className="font-semibold text-gray-800 mb-1">What is the 4-Digit Handover Code?</p>
            <p>
              For self-pickup orders, present your unique 4-digit code to the donor upon collection to verify safe transfer.
            </p>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900">
            <p className="font-semibold mb-0.5">Need Urgent Assistance?</p>
            <p className="mb-1.5">Direct Helpline: <strong>+1 (800) 555-FOOD</strong></p>
            <p>Email: <strong>support@foodshare.org</strong> (Response within 15 mins)</p>
          </div>
        </div>

        <div className="mt-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  )
}

// 2. Request Food Modal
export function RequestFoodModal({ listing, isOpen, onClose, onSubmit, isSubmitting }) {
  if (!isOpen || !listing) return null

  const maxServings = listing.servings || listing.quantity || 1
  const [servings, setServings] = useState(Math.min(10, maxServings))
  const [deliveryMethod, setDeliveryMethod] = useState(
    listing.deliveryOptions?.includes('volunteer') ? 'volunteer_delivery' : 'direct_pickup'
  )
  const [preferredDate, setPreferredDate] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const handleFormSubmit = (e) => {
    e.preventDefault()
    setError('')
    const numServings = Number(servings)
    if (!numServings || numServings <= 0) {
      setError('Please specify at least 1 serving.')
      return
    }
    if (numServings > maxServings) {
      setError(`Maximum available servings is ${maxServings}.`)
      return
    }

    onSubmit({
      listingId: listing._id,
      servings: numServings,
      deliveryMethod,
      preferredDate,
      notes,
    })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="request-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-lg w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          aria-label="Close Request Modal"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 id="request-modal-title" className="text-base font-bold text-gray-900 mb-1">
          Request Food Donation
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Requesting from <strong>{listing.donor}</strong>
        </p>

        {/* Listing Summary Card */}
        <div className="flex items-center gap-3.5 p-3 rounded-xl bg-gray-50 border border-gray-100 mb-4">
          <img
            src={getFoodImageUrl(listing.imageUrl, listing.category)}
            alt={listing.title}
            className="w-14 h-14 rounded-lg object-cover border border-gray-200 shrink-0"
            onError={(e) => handleImageError(e, listing.category)}
          />
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-gray-900 truncate">{listing.title}</h4>
            <p className="text-xs text-gray-500">{listing.distance} · {listing.pickupWindow}</p>
            <span className="inline-block text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full mt-1">
              Available: {maxServings} {listing.unit || 'servings'}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Servings Needed (max {maxServings})
            </label>
            <input
              type="number"
              min="1"
              max={maxServings}
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Delivery Method
            </label>
            <select
              value={deliveryMethod}
              onChange={(e) => setDeliveryMethod(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] outline-none bg-white"
            >
              {(!listing.deliveryOptions || listing.deliveryOptions.includes('volunteer')) && (
                <option value="volunteer_delivery">Volunteer Courier (Community Volunteer)</option>
              )}
              {(!listing.deliveryOptions || listing.deliveryOptions.includes('direct')) && (
                <option value="direct_pickup">Direct Receiver Pickup (Collect Personally)</option>
              )}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Preferred Date
            </label>
            <input
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] outline-none bg-white"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Notes for Donor / Courier (Optional)
            </label>
            <textarea
              rows="2"
              placeholder="e.g. Special loading dock instructions, refrigeration ready..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] outline-none resize-none"
            />
          </div>

          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// 3. Rating & Feedback Modal
export function RateModal({ order, isOpen, onClose, onSubmit, isSubmitting }) {
  if (!isOpen || !order) return null

  // Self pickup detection: explicit flag, deliveryType direct_pickup, or direct pickup indicators
  const isSelfPickup =
    order.isDirectPickup === true ||
    order.deliveryType === 'direct_pickup' ||
    order.method === 'Self-Pickup' ||
    order.method === 'direct_pickup'

  // Volunteer involvement: ONLY true if NOT self-pickup AND (volunteer delivery or courier assigned)
  const isVolunteerInvolved =
    !isSelfPickup &&
    (order.isVolunteerCourier === true ||
      order.deliveryType === 'volunteer_delivery' ||
      Boolean(order.courier))

  // Track target selection: null = selection screen, 'donor' | 'volunteer' = rating screen
  const [selectedTarget, setSelectedTarget] = useState(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [hoverRating, setHoverRating] = useState(0)

  // Check review status
  const donorSubmitted =
    order.donorReviewStatus === 'submitted' || Boolean(order.donorFeedback?.rating)
  const volunteerSubmitted =
    order.volunteerReviewStatus === 'submitted' || Boolean(order.volunteerFeedback?.rating)

  const handleSelectTarget = (target) => {
    // In self pickup, only donor rating is allowed
    if (!isVolunteerInvolved && target === 'volunteer') return

    setSelectedTarget(target)
    if (target === 'donor') {
      setRating(order.donorFeedback?.rating || 5)
      setComment(order.donorFeedback?.comment || '')
    } else {
      setRating(order.volunteerFeedback?.rating || 5)
      setComment(order.volunteerFeedback?.comment || '')
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const targetToSubmit = isVolunteerInvolved ? selectedTarget : 'donor'
    onSubmit({ target: targetToSubmit, rating, comment })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-base font-bold text-gray-900 mb-0.5">Rate & Feedback</h3>
        <p className="text-xs text-gray-500 mb-4">
          Order #{order.orderNo} · {getCombinedFoodTitle(order)}
        </p>

        {!selectedTarget ? (
          /* Selection Screen: shows only Donor for self-pickup, both for volunteer involvement */
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {isVolunteerInvolved ? 'Who would you like to review?' : 'Rate Your Experience'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {isVolunteerInvolved
                  ? 'Share your feedback to support donors and couriers in the community.'
                  : `Share your feedback for donor ${order.donor || 'partner'}.`}
              </p>
            </div>

            <div className="space-y-3">
              {/* Option 1: Donor (Always shown) */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  donorSubmitted
                    ? 'bg-gray-50 border-gray-200 opacity-80'
                    : 'bg-white border-gray-200 hover:border-[#2E7D32] hover:shadow-2xs cursor-pointer'
                }`}
                onClick={() => {
                  if (!donorSubmitted) handleSelectTarget('donor')
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#2E7D32] flex items-center justify-center font-bold text-xs shrink-0">
                      <HeartHandshake className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Donor</p>
                      <p className="text-xs text-gray-500 font-medium">{order.donor}</p>
                    </div>
                  </div>

                  {donorSubmitted ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-[#2E7D32] text-[11px] font-bold border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Submitted
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSelectTarget('donor')}
                      className="px-3 py-1.5 rounded-lg bg-[#2E7D32] text-white text-xs font-semibold hover:bg-[#1B5E20] transition-colors cursor-pointer"
                    >
                      Rate Donor
                    </button>
                  )}
                </div>
              </div>

              {/* Option 2: Volunteer Courier (ONLY shown if volunteer is involved; NOT shown in self pickup) */}
              {isVolunteerInvolved && (
                <div
                  className={`p-4 rounded-xl border transition-all ${
                    volunteerSubmitted
                      ? 'bg-gray-50 border-gray-200 opacity-80'
                      : 'bg-white border-gray-200 hover:border-[#1565C0] hover:shadow-2xs cursor-pointer'
                  }`}
                  onClick={() => {
                    if (!volunteerSubmitted) handleSelectTarget('volunteer')
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1565C0] flex items-center justify-center font-bold text-xs shrink-0">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">Volunteer Courier</p>
                        <p className="text-xs text-gray-500 font-medium">
                          {order.courier?.name || 'Assigned Courier'}
                        </p>
                      </div>
                    </div>

                    {volunteerSubmitted ? (
                      <span className="px-2.5 py-1 rounded-full bg-blue-50 text-[#1565C0] text-[11px] font-bold border border-blue-200 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Submitted
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSelectTarget('volunteer')}
                        className="px-3 py-1.5 rounded-lg bg-[#1565C0] text-white text-xs font-semibold hover:bg-[#0D47A1] transition-colors cursor-pointer"
                      >
                        Rate Volunteer
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Form Screen: Review selected target */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedTarget(null)}
                className="text-xs font-semibold text-[#2E7D32] hover:underline flex items-center gap-1 cursor-pointer"
              >
                ← {isVolunteerInvolved ? 'Change Reviewee' : 'Back to Options'}
              </button>
              <span className="text-xs font-bold text-gray-700 capitalize">
                Reviewing: {selectedTarget === 'donor' ? (order.donor || 'Donor') : (order.courier?.name || 'Volunteer')}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center py-2">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-2xl transition-transform hover:scale-110 cursor-pointer"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        (hoverRating || rating) >= star
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-semibold text-gray-600 mt-2">
                {rating === 5 && 'Excellent experience'}
                {rating === 4 && 'Very good experience'}
                {rating === 3 && 'Average experience'}
                {rating === 2 && 'Below expectations'}
                {rating === 1 && 'Poor experience'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Comments & Notes
              </label>
              <textarea
                rows="3"
                placeholder={
                  selectedTarget === 'donor'
                    ? 'Share details about food quality, packaging, and pickup experience...'
                    : 'Share details about delivery timeliness, courier communication, and care...'
                }
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] outline-none resize-none"
              />
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSelectedTarget(null)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? 'Saving...' : 'Submit Feedback'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// 4. Report Issue Modal
export function ReportIssueModal({ order, isOpen, onClose, onSubmit, isSubmitting }) {
  if (!isOpen || !order) return null

  const [issueType, setIssueType] = useState('late_delivery')
  const [description, setDescription] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!description.trim()) {
      setError('Please provide a description of the issue.')
      return
    }
    onSubmit({ issueType, description, photoUrl })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 text-red-600 mb-2">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="text-base font-bold text-gray-900">Report an Issue</h3>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Order #{order.orderNo} · {getCombinedFoodTitle(order)}
        </p>

        {error && (
          <div className="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Issue Category</label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] outline-none bg-white"
            >
              <option value="late_delivery">Late Delivery / Courier Delay</option>
              <option value="damaged_food">Damaged or Spoiled Food</option>
              <option value="missing_items">Missing Items</option>
              <option value="incorrect_quantity">Incorrect Quantity</option>
              <option value="unresponsive_courier">Unresponsive Courier</option>
              <option value="quality_safety_concern">Food Quality & Safety Concern</option>
              <option value="other">Other Issue</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              rows="3"
              placeholder="Provide specific details about what went wrong..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] outline-none resize-none"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Photo URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://example.com/photo.jpg"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] outline-none"
            />
          </div>

          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? 'Reporting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// 5. Order Details Modal
export function OrderDetailsModal({ order, isOpen, onClose, onCallCourier }) {
  if (!isOpen || !order) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-lg w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4 pr-6">
          <div>
            <h3 className="text-base font-bold text-gray-900">Order Details</h3>
            <p className="text-xs text-gray-500">Order #{order.orderNo}</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-100 text-[#2E7D32]">
            {order.status || 'Active'}
          </span>
        </div>

        <div className="space-y-3.5 text-xs text-gray-700">
          <div className="p-3 bg-gray-50 rounded-xl space-y-1">
            <p className="text-xs font-bold text-gray-900">{getCombinedFoodTitle(order)}</p>
            <CombinedItemsBreakdown items={getOrderItems(order)} />
            <p className="text-gray-500">{order.servings} servings · {order.donorName || order.donor}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 border border-gray-100 rounded-xl">
              <span className="text-[11px] text-gray-400 font-medium">Pickup Window</span>
              <p className="font-semibold text-gray-800 mt-0.5">{order.pickupWindow || '11:00 - 13:00'}</p>
            </div>
            <div className="p-3 border border-gray-100 rounded-xl">
              <span className="text-[11px] text-gray-400 font-medium">Estimated Arrival</span>
              <p className="font-semibold text-gray-800 mt-0.5">{order.courier?.eta || '~15 minutes'}</p>
            </div>
          </div>

          <div className="p-3 border border-gray-100 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-gray-500">
              <MapPin className="w-3.5 h-3.5 text-[#2E7D32]" />
              <span className="font-semibold text-gray-800">Drop-off Destination</span>
            </div>
            <p className="pl-5 text-gray-600">{order.dropoffAddress || '87 Elm Street, Downtown, CA 90210'}</p>
          </div>

          {order.courier && (
            <div className="p-3 border border-emerald-100 bg-emerald-50/50 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{order.courier.name}</p>
                <p className="text-[11px] text-gray-500">{order.courier.transport} · ★ {order.courier.rating}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (onCallCourier) {
                    onCallCourier(order.courier)
                  } else {
                    window.open(`tel:${order.courier.phone || '+91 98200 44321'}`)
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:text-emerald-800 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="Call or copy courier phone number"
              >
                <Phone className="w-3.5 h-3.5 text-[#2E7D32]" />
                <span>Call Courier</span>
              </button>
            </div>
          )}
        </div>

        <div className="mt-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  )
}
