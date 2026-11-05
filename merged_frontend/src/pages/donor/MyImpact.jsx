import { useState, useEffect } from 'react'
import {
  Leaf,
  Scale,
  Users,
  Package,
  Award,
} from 'lucide-react'
import donorService from '../../services/donorService'

export default function MyImpact() {
  const [loading, setLoading] = useState(true)
  const [impact, setImpact] = useState({
    successfulDonations: 0,
    foodRescuedKg: 0,
    receiversHelped: 0,
    totalListings: 0,
    communityReachMiles: 0,
    equivalentMealsSaved: 0,
    wasteSavedPercent: 0,
  })

  useEffect(() => {
    let isMounted = true
    const loadImpact = async () => {
      try {
        setLoading(true)
        const res = await donorService.getImpact()
        if (isMounted && res.data) {
          setImpact(res.data)
        }
      } catch (err) {
        console.error('Failed to load impact stats:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadImpact()
    return () => {
      isMounted = false
    }
  }, [])

  const foodRescuedKg = impact.foodRescuedKg || 0
  const mealsSaved = Math.round(foodRescuedKg / 0.4)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">My Impact</h1>
        <p className="text-xs text-gray-500 font-medium mt-0.5">
          Your contribution to reducing food waste and hunger.
        </p>
      </div>

      {/* 4 Top Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Successful Donations */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#2E7D32] flex items-center justify-center mb-3">
            <Award className="w-5 h-5" />
          </div>
          <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {impact.successfulDonations || 0}
          </span>
          <p className="text-xs font-bold text-gray-800 mt-1">Successful Donations</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Exchanges completed</p>
        </div>

        {/* Food Rescued */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <Scale className="w-5 h-5" />
          </div>
          <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {foodRescuedKg} kg
          </span>
          <p className="text-xs font-bold text-gray-800 mt-1">Food Rescued</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Total weight diverted</p>
        </div>

        {/* Receivers Helped */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {impact.receiversHelped || 0}
          </span>
          <p className="text-xs font-bold text-gray-800 mt-1">Receivers Helped</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Unique individuals</p>
        </div>

        {/* Total Listings */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Package className="w-5 h-5" />
          </div>
          <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {impact.totalListings || 0}
          </span>
          <p className="text-xs font-bold text-gray-800 mt-1">Total Listings</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Items posted so far</p>
        </div>
      </div>

      {/* Community Impact Hero Banner */}
      <div className="bg-gradient-to-br from-[#1E4D2B] via-[#245D33] to-[#173C21] rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-lg font-bold tracking-tight">Community Impact</h2>
          </div>
          <p className="text-xs text-emerald-200 mt-1 max-w-xl">
            Your donations are making a real difference. Every meal shared strengthens the community and reduces food waste across San Francisco.
          </p>
        </div>

        {/* Dynamic Highlight Pill */}
        <div className="bg-black/20 backdrop-blur-xs rounded-2xl p-4 border border-white/10 flex items-center gap-3">
          <Leaf className="w-5 h-5 text-emerald-300 shrink-0" />
          <p className="text-xs text-emerald-100 leading-relaxed">
            You've helped reduce food waste by <strong>{foodRescuedKg} kg</strong> — that's roughly equivalent to <strong>{mealsSaved} meals saved</strong>. Keep going, every meal matters!
          </p>
        </div>
      </div>
    </div>
  )
}
