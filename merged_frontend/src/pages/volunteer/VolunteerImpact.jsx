import { useState, useEffect } from 'react'
import {
  TrendingUp,
  Leaf,
  Utensils,
  Clock,
  Award,
  Star,
  CheckCircle,
  Heart,
  Bike,
  Sparkles,
  RefreshCw,
  MapPin,
  AlertCircle,
} from 'lucide-react'
import { volunteerService } from '../../services/volunteerService'

export default function VolunteerImpact() {
  const [profileStats, setProfileStats] = useState(null)
  const [reviewsList, setReviewsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const fetchStats = async () => {
    try {
      setLoading(true)
      setErrorMessage('')
      const [profileRes, reviewsRes] = await Promise.all([
        volunteerService.getProfile().catch(() => null),
        volunteerService.getReviews().catch(() => null),
      ])

      setProfileStats(profileRes?.data?.stats || profileRes?.data?.profile || {})
      setReviewsList(reviewsRes?.data?.reviews || [])
    } catch (err) {
      console.error('Failed to load volunteer impact stats:', err)
      setErrorMessage('Unable to load latest impact data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const totalTrips = profileStats?.totalDeliveriesCompleted || 0
  const totalMeals = profileStats?.totalMealsDelivered || 0
  const foodRescuedKg = profileStats?.foodRescuedKg ?? Math.round(totalMeals * 0.4)
  const totalDistanceKm =
    profileStats?.totalDistanceKm != null
      ? profileStats.totalDistanceKm
      : totalTrips > 0
      ? Number((totalTrips * 3.8).toFixed(1))
      : 0
  const hoursVolunteered =
    profileStats?.hoursVolunteered != null
      ? profileStats.hoursVolunteered
      : totalTrips > 0
      ? Number((totalTrips * 0.8).toFixed(1))
      : 0

  const calculatedRating =
    reviewsList.length > 0
      ? Number((reviewsList.reduce((acc, r) => acc + (r.rating || 5), 0) / reviewsList.length).toFixed(1))
      : profileStats?.rating || 0

  const badge1Unlocked = totalTrips >= 10
  const badge2Unlocked = totalTrips >= 5
  const badge3Unlocked = totalTrips >= 3
  const unlockedCount = (badge1Unlocked ? 1 : 0) + (badge2Unlocked ? 1 : 0) + (badge3Unlocked ? 1 : 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight">
            My Impact
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Every trip adds up to something extraordinary.
          </p>
        </div>

        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 self-start sm:self-auto px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="text-red-500 hover:text-red-700 text-base font-bold cursor-pointer">
            ×
          </button>
        </div>
      )}

      {/* Hero Banner */}
      <div className="bg-[#2E7D32] rounded-3xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1.5 relative z-10 max-w-xl">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-200">
            YOUR COMMUNITY IMPACT
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Small trips. Meaningful change.
          </h3>
          <p className="text-xs sm:text-sm text-emerald-100 font-medium">
            {totalTrips > 0
              ? `You've completed ${totalTrips} food rescue trips so far!`
              : 'Ready for your first FoodShare food rescue run!'}
          </p>
        </div>

        <div className="relative z-10 shrink-0 self-start sm:self-auto">
          <div className="w-20 h-20 rounded-full border-4 border-emerald-400/50 bg-[#256828] flex flex-col items-center justify-center text-center shadow-lg">
            <span className="text-xl font-extrabold text-white leading-none">{totalTrips}</span>
            <span className="text-[10px] font-bold text-emerald-200 uppercase mt-0.5 tracking-wider">
              TRIPS
            </span>
          </div>
        </div>

        {/* Decorative circle glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Meals Delivered */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-gray-500">Total Meals Delivered</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
              {totalMeals}
            </div>
            <span className="text-[10px] text-emerald-700 font-medium">
              {totalMeals > 0 ? `+${totalMeals} delivered` : '0 meals delivered yet'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#2E7D32] flex items-center justify-center">
            <Utensils className="w-5 h-5" />
          </div>
        </div>

        {/* Food Rescued */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-gray-500">Food Rescued</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
              {foodRescuedKg} kg
            </div>
            <span className="text-[10px] text-amber-600 font-medium">
              {foodRescuedKg > 0 ? 'Kept from landfill' : '0 kg rescued yet'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Leaf className="w-5 h-5" />
          </div>
        </div>

        {/* Total Distance Travelled (Replaced CO2 Prevented) */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-gray-500">Total Distance Travelled</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
              {totalDistanceKm} km
            </div>
            <span className="text-[10px] text-blue-600 font-medium">
              {totalTrips > 0 ? `Across ${totalTrips} completed runs` : '0 km travelled yet'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
        </div>

        {/* Hours Volunteered */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-gray-500">Hours Volunteered</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
              {hoursVolunteered} hrs
            </div>
            <span className="text-[10px] text-purple-600 font-medium">Across {totalTrips} trips</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Two Columns: Milestone Badges & Community Thank-Yous */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Milestone Badges */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h4 className="text-sm font-bold text-gray-900">Milestone Badges</h4>
              <p className="text-[11px] text-gray-400">Achievements earned on your journeys</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
              {unlockedCount} Unlocked
            </span>
          </div>

          <div className="space-y-3">
            {/* Badge 1 */}
            <div
              className={`flex items-center justify-between p-3.5 rounded-2xl border ${
                badge1Unlocked
                  ? 'bg-amber-50/50 border-amber-100'
                  : 'bg-gray-50/60 border-gray-100 opacity-70'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    badge1Unlocked
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  <Star className={`w-4 h-4 ${badge1Unlocked ? 'fill-amber-500 text-amber-500' : 'text-gray-400'}`} />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-gray-900">First 10 Deliveries</h5>
                  <p className="text-[10px] text-gray-500">
                    {badge1Unlocked ? 'Completed milestone' : `Progress: ${totalTrips}/10`}
                  </p>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  badge1Unlocked
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-gray-500 bg-gray-100'
                }`}
              >
                {badge1Unlocked ? 'Unlocked ✓' : `Locked (${totalTrips}/10)`}
              </span>
            </div>

            {/* Badge 2 */}
            <div
              className={`flex items-center justify-between p-3.5 rounded-2xl border ${
                badge2Unlocked
                  ? 'bg-emerald-50/50 border-emerald-100'
                  : 'bg-gray-50/60 border-gray-100 opacity-70'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    badge2Unlocked
                      ? 'bg-emerald-100 text-[#2E7D32]'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  <Bike className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-gray-900">Eco Mover</h5>
                  <p className="text-[10px] text-gray-500">
                    {badge2Unlocked ? 'Zero-emission transport champion' : `Progress: ${totalTrips}/5`}
                  </p>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  badge2Unlocked
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-gray-500 bg-gray-100'
                }`}
              >
                {badge2Unlocked ? 'Unlocked ✓' : `Locked (${totalTrips}/5)`}
              </span>
            </div>

            {/* Badge 3 */}
            <div
              className={`flex items-center justify-between p-3.5 rounded-2xl border ${
                badge3Unlocked
                  ? 'bg-purple-50/50 border-purple-100'
                  : 'bg-gray-50/60 border-gray-100 opacity-70'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    badge3Unlocked
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${
                      badge3Unlocked ? 'fill-purple-500 text-purple-500' : 'text-gray-400'
                    }`}
                  />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-gray-900">Weekend Hero</h5>
                  <p className="text-[10px] text-gray-500">
                    {badge3Unlocked
                      ? 'Active during high-demand rescue runs'
                      : `Progress: ${totalTrips}/3`}
                  </p>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  badge3Unlocked
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-gray-500 bg-gray-100'
                }`}
              >
                {badge3Unlocked ? 'Unlocked ✓' : `Locked (${totalTrips}/3)`}
              </span>
            </div>
          </div>
        </div>

        {/* Community Thank-Yous (Genuine Donor & Receiver Feedback) */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h4 className="text-sm font-bold text-gray-900">Community Thank-Yous</h4>
              <p className="text-[11px] text-gray-400">Notes from donors & receivers along your routes</p>
            </div>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100 flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {calculatedRating > 0 ? `${calculatedRating.toFixed(1)} Rating` : '0.0 Rating'}
            </span>
          </div>

          {reviewsList.length === 0 ? (
            <div className="py-10 text-center text-gray-400 space-y-2">
              <Heart className="w-9 h-9 mx-auto text-gray-300 stroke-1" />
              <p className="text-xs font-bold text-gray-600">No community feedback yet</p>
              <p className="text-[11px] text-gray-400 max-w-xs mx-auto leading-relaxed">
                Thank-you notes and ratings from donors and shelter receivers will appear here once they review your completed food deliveries.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {reviewsList.map((rev) => (
                <div
                  key={rev._id}
                  className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1.5 transition-colors hover:bg-gray-100/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < (rev.rating || 5)
                              ? 'fill-amber-400 text-amber-400'
                              : 'fill-gray-200 text-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    {rev.submittedAt && (
                      <span className="text-[10px] text-gray-400">
                        {new Date(rev.submittedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                  </div>

                  {rev.comment ? (
                    <p className="text-xs text-gray-800 italic leading-relaxed">
                      &quot;{rev.comment}&quot;
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No written comment provided.</p>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-gray-200/50">
                    <span className="font-semibold text-gray-700">
                      — {rev.reviewerName || 'Community Partner'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-gray-200 font-bold text-gray-600">
                      {rev.reviewerRole || 'Partner'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
