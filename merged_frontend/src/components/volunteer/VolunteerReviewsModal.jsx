import { useState, useEffect } from 'react'
import {
  X,
  Star,
  MessageSquare,
  Calendar,
  Package,
  User,
  CheckCircle,
  Clock,
  Sparkles,
} from 'lucide-react'
import { volunteerService } from '../../services/volunteerService'

export default function VolunteerReviewsModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState({ totalCount: 0, averageRating: 0 })
  const [error, setError] = useState('')

  const fetchReviews = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await volunteerService.getReviews()
      if (res.data) {
        setReviews(res.data.reviews || [])
        setStats({
          totalCount: res.data.totalCount || 0,
          averageRating: res.data.averageRating || 0,
        })
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load reviews.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isOpen) return
    fetchReviews()
  }, [isOpen])

  // Prevent background page scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently'
    try {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(dateString))
    } catch {
      return 'Recently'
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reviews-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-xl w-full max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gradient-to-r from-emerald-50/50 to-amber-50/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
              <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
            </div>
            <div>
              <h3 id="reviews-modal-title" className="text-lg font-bold text-gray-900 leading-snug">
                Volunteer Ratings & Reviews
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Feedback from completed food delivery handovers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-white rounded-xl transition-colors cursor-pointer"
            aria-label="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rating Summary Strip */}
        <div className="bg-amber-50/40 border-b border-amber-100/60 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-gray-900 font-mono">
              {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '0.0'}
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(stats.averageRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-200 fill-gray-100'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-gray-500">
              ({stats.totalCount} {stats.totalCount === 1 ? 'review' : 'reviews'})
            </span>
          </div>
          <span className="text-[11px] font-semibold text-[#2E7D32] bg-emerald-100/80 px-2.5 py-1 rounded-full">
            Verified Couriers
          </span>
        </div>

        {/* Dedicated Vertically Scrollable Reviews List Container */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[50vh] space-y-3.5 flex-1">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-[#2E7D32] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-gray-500 font-medium">Loading reviews...</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center space-y-3">
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold max-w-md mx-auto">
                {error}
              </div>
              <button
                type="button"
                onClick={fetchReviews}
                className="px-4 py-1.5 rounded-xl bg-[#2E7D32] hover:bg-[#256428] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-gray-800">No reviews yet</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Complete volunteer deliveries to receive verified feedback from food receivers and donor partners.
              </p>
            </div>
          ) : (
            reviews.map((rev) => (
              <div
                key={rev._id}
                className="p-4 rounded-2xl border border-gray-100 bg-[#F9FAFB] hover:border-amber-200/80 transition-all space-y-2.5 shadow-2xs"
              >
                {/* Review Header: Stars + Date + Order No */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rev.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-200 fill-gray-100'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-gray-800 font-mono">
                      {rev.rating}.0
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium">
                    <span className="font-mono">{rev.orderNo}</span>
                    <span>•</span>
                    <span>{formatDate(rev.submittedAt)}</span>
                  </div>
                </div>

                {/* Comment */}
                <p className="text-xs text-gray-700 leading-relaxed font-normal">
                  {rev.comment ? `"${rev.comment}"` : <span className="italic text-gray-400">No written comment provided.</span>}
                </p>

                {/* Footer Details: Delivery Title + Reviewer Name & Role */}
                <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-[11px] text-gray-500 gap-2">
                  <span className="flex items-center gap-1.5 text-gray-700 font-medium truncate max-w-[55%]">
                    <Package className="w-3.5 h-3.5 text-[#2E7D32] shrink-0" />
                    <span className="truncate" title={rev.deliveryTitle}>{rev.deliveryTitle}</span>
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded-full text-gray-700 font-medium">
                      by {rev.reviewerName}
                    </span>
                    {rev.reviewerRole && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        rev.reviewerRole === 'Donor'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {rev.reviewerRole}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-end bg-gray-50/50 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
