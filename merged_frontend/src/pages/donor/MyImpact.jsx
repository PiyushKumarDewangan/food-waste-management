import { useState, useEffect } from 'react'
import {
  Leaf,
  Scale,
  Users,
  Package,
  Award,
  TrendingUp,
  Droplets,
  CloudRain,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import donorService from '../../services/donorService'

export default function MyImpact() {
  const [loading, setLoading] = useState(true)
  const [impact, setImpact] = useState({
    successfulDonations: 47,
    foodRescuedKg: 125,
    receiversHelped: 89,
    totalListings: 63,
    communityReachMiles: 23,
    equivalentMealsSaved: 235,
    wasteSavedPercent: 94,
    categoryBreakdown: [
      { category: 'Cooked Meals', count: 28, weightKg: 56 },
      { category: 'Fresh Produce', count: 18, weightKg: 42 },
      { category: 'Bakery', count: 12, weightKg: 19 },
      { category: 'Packaged Goods', count: 5, weightKg: 8 },
    ],
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

  return (
    <div className="space-y-8">
      {/* Header (Page 10 in PDF) */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">My Impact</h1>
        <p className="text-xs text-gray-500 font-medium mt-0.5">
          Your contribution to reducing food waste and hunger.
        </p>
      </div>

      {/* 4 Stat Cards in a row (Page 10 in PDF) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Successful Donations */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#2E7D32] flex items-center justify-center mb-3">
            <Award className="w-5 h-5" />
          </div>
          <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {impact.successfulDonations}
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
            {impact.foodRescuedKg} kg
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
            {impact.receiversHelped}
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
            {impact.totalListings}
          </span>
          <p className="text-xs font-bold text-gray-800 mt-1">Total Listings</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Items posted so far</p>
        </div>
      </div>

      {/* Community Impact Hero Banner (Page 10 in PDF) */}
      <div className="bg-gradient-to-br from-[#1E4D2B] via-[#245D33] to-[#173C21] rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-lg font-bold tracking-tight">Community Impact</h2>
          </div>
          <p className="text-xs text-emerald-200 mt-1 max-w-xl">
            Your donations are making a real difference. Every meal shared strengthens the community and reduces food waste across San Francisco.
          </p>
        </div>

        {/* 4 Pillars inside Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10">
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {impact.successfulDonations}
            </span>
            <p className="text-[11px] font-medium text-emerald-200 mt-0.5">
              Donations Done
            </p>
          </div>

          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {impact.foodRescuedKg} kg
            </span>
            <p className="text-[11px] font-medium text-emerald-200 mt-0.5">
              Food Rescued
            </p>
          </div>

          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {impact.receiversHelped}
            </span>
            <p className="text-[11px] font-medium text-emerald-200 mt-0.5">
              Receivers Reached
            </p>
          </div>

          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {impact.communityReachMiles} mi
            </span>
            <p className="text-[11px] font-medium text-emerald-200 mt-0.5">
              Community Reach
            </p>
          </div>
        </div>

        {/* Inspirational Callout (Page 10 in PDF) */}
        <div className="bg-black/20 backdrop-blur-xs rounded-2xl p-4 border border-white/10 flex items-center gap-3">
          <Leaf className="w-5 h-5 text-emerald-300 shrink-0" />
          <p className="text-xs text-emerald-100 leading-relaxed">
            You've helped reduce food waste by <strong>{impact.foodRescuedKg} kg</strong> — that's roughly equivalent to <strong>{impact.equivalentMealsSaved} meals saved</strong>. Keep going, every meal matters!
          </p>
        </div>
      </div>

      {/* Additional Visual: Category Breakdown & Environmental Footprint */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Food Categories Rescued */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-900 tracking-tight">
            Food Categories Rescued
          </h3>
          <div className="space-y-3">
            {impact.categoryBreakdown?.map((cat, i) => {
              const percent = Math.round((cat.weightKg / impact.foodRescuedKg) * 100) || 25
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-gray-700">{cat.category}</span>
                    <span className="text-gray-500 font-medium">
                      {cat.weightKg} kg ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full bg-[#2E7D32] rounded-full transition-all duration-700"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Environmental Savings */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-900 tracking-tight">
            Environmental Impact
          </h3>
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-1">
              <CloudRain className="w-5 h-5 text-[#2E7D32]" />
              <p className="text-xl font-bold text-gray-900 mt-2">~312 kg</p>
              <p className="text-xs font-semibold text-gray-700">CO2 Emissions Saved</p>
              <p className="text-[10px] text-gray-500">Equivalent to 780 miles driven</p>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1">
              <Droplets className="w-5 h-5 text-blue-600" />
              <p className="text-xl font-bold text-gray-900 mt-2">~14,200 L</p>
              <p className="text-xs font-semibold text-gray-700">Water Conserved</p>
              <p className="text-[10px] text-gray-500">Virtual water footprint saved</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
