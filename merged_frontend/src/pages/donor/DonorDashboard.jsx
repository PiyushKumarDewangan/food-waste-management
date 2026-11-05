import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Package,
  Clock,
  ArrowLeftRight,
  Utensils,
  Plus,
  ChevronRight,
  MapPin,
  Eye,
} from 'lucide-react'
import donorService from '../../services/donorService'
import { getFoodImageUrl, handleImageError } from '../../utils/imageHelper'
import { getDonationDisplayStatus, formatDateIST } from '../../utils/dateHelper'
import { formatQuantityUnit } from '../../utils/unitHelper'

export default function DonorDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())
  const [stats, setStats] = useState({
    activeListings: 0,
    pendingRequests: 0,
    completedExchanges: 0,
    mealsShared: 0,
  })
  const [recentDonations, setRecentDonations] = useState([])

  // Live timer tick every 30 seconds for automatic real-time countdown updates
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now())
    }, 30000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let isMounted = true
    const loadDashboard = async () => {
      try {
        setLoading(true)
        const [statsRes, donationsRes] = await Promise.all([
          donorService.getStats(),
          donorService.getDonations('all'),
        ])
        if (isMounted) {
          if (statsRes.data) setStats(statsRes.data)
          if (donationsRes.data?.donations) {
            setRecentDonations(donationsRes.data.donations.slice(0, 4))
          }
        }
      } catch (err) {
        console.error('Error loading donor dashboard:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadDashboard()
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="space-y-8">
      {/* 4 Top Metric Cards (Page 1 in PDF) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Listings */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {stats.activeListings}
            </span>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">
              Active Listings
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#2E7D32] flex items-center justify-center border border-emerald-100">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Requests */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {stats.pendingRequests}
            </span>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">
              Pending Requests
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Completed Exchanges */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {stats.completedExchanges}
            </span>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">
              Completed Exchanges
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
        </div>

        {/* Meals Shared */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {stats.mealsShared}
            </span>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">
              Meals Shared
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
            <Utensils className="w-6 h-6" />
          </div>
        </div>
      </div>


      {/* "My Food" Preview Section (Page 1 in PDF) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">My Food</h2>
            <p className="text-xs text-gray-500 font-medium">Your recent food donations</p>
          </div>
          {recentDonations.length > 0 && (
            <Link
              to="/donor/my-food"
              className="text-xs font-semibold text-[#2E7D32] hover:text-[#256428] flex items-center gap-1 hover:underline"
            >
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* Food Listings List or Clean Empty State */}
        {recentDonations.length === 0 ? (
          <div className="py-10 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 p-6">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#2E7D32] flex items-center justify-center mx-auto mb-3">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-800">No active food listings</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              You haven't posted any food donations yet. When you share surplus food, it will appear here.
            </p>
            <button
              onClick={() => navigate('/donor/add-food')}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2E7D32] text-white text-xs font-semibold hover:bg-[#256428] transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Your First Food</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentDonations.map((item) => {
              const displayInfo = getDonationDisplayStatus(item, now)

              return (
                <div
                  key={item._id}
                  className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap hover:bg-gray-50/50 p-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src={getFoodImageUrl(item.imageUrl, item.category)}
                      alt={item.title}
                      onError={(e) => handleImageError(e, item.category)}
                      className="w-14 h-14 rounded-xl object-cover border border-gray-100 shadow-2xs shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 truncate">{item.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatQuantityUnit(item.quantity, item.unit)} •{' '}
                        {item.createdAt ? formatDateIST(item.createdAt) : 'Recently'}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <p className="text-[11px] text-gray-400 flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span>{item.pickupAddress}</span>
                        </p>
                        {displayInfo.showCountdown && displayInfo.countdownLabel && (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border font-semibold ${displayInfo.expiryBadgeClass}`}
                          >
                            <span className={`w-1 h-1 rounded-full ${displayInfo.expiryDotClass}`} />
                            <span>{displayInfo.countdownLabel}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${displayInfo.badgeClass}`}
                    >
                      {displayInfo.badgeText}
                    </span>
                    <button
                      onClick={() => navigate(`/donor/food/${item._id}`)}
                      className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
