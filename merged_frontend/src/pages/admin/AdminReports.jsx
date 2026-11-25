import { useState } from 'react'
import {
  Leaf,
  Scale,
  CloudRain,
  Droplets,
  Download,
  FileSpreadsheet,
  Calendar,
  ChevronDown,
  TrendingUp,
  Award,
  Star,
  Printer,
} from 'lucide-react'
import { adminService } from '../../services/adminService'

export default function AdminReports() {
  const [timeRange, setTimeRange] = useState('30days')
  const [leaderboardTab, setLeaderboardTab] = useState('donors') // 'donors' | 'volunteers'
  const [hoveredBar, setHoveredBar] = useState(null)
  const [toastMessage, setToastMessage] = useState(null)

  const monthlyBars = [
    { month: 'May', weight: 2100, heightPct: 43 },
    { month: 'Jun', weight: 2650, heightPct: 54 },
    { month: 'Jul', weight: 3100, heightPct: 63 },
    { month: 'Aug', weight: 3450, heightPct: 71 },
    { month: 'Sep', weight: 4020, heightPct: 82 },
    { month: 'Oct', weight: 4850, heightPct: 100 },
  ]

  const topDonors = [
    { rank: 1, name: 'Hyatt Regency Mumbai', weight: '1,240 kg', meals: '3,200 meals' },
    { rank: 2, name: 'Metro Supermarket', weight: '960 kg', meals: '2,400 meals' },
    { rank: 3, name: 'Marriott Bistro', weight: '785 kg', meals: '1,950 meals' },
  ]

  const starVolunteers = [
    { rank: 1, name: 'Rahul Verma', deliveries: 82, rating: '⭐ 4.9', badge: 'Star Courier' },
    { rank: 2, name: 'Priya Sharma', deliveries: 64, rating: '⭐ 5.0', badge: 'Reliability Champion' },
    { rank: 3, name: 'Amit Patel', deliveries: 49, rating: '⭐ 4.8', badge: 'Rapid Responder' },
  ]

  // Export CSV
  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        'Month,Food Rescued (kg),Meals Distributed,CO2 Averted (Tons),Water Conserved (Liters)',
        'May,2100,5500,5.2,140000',
        'Jun,2650,7000,6.6,175000',
        'Jul,3100,8200,7.8,205000',
        'Aug,3450,9100,8.7,230000',
        'Sep,4020,10600,10.1,265000',
        'Oct,4850,12800,12.2,320000',
      ].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `foodshare_impact_report_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setToastMessage('✓ Impact metrics exported to CSV!')
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Download PDF
  const handleDownloadPDF = () => {
    window.print()
    setToastMessage('✓ Generating printable sustainability impact report...')
    setTimeout(() => setToastMessage(null), 3000)
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* ======================= HEADER & CONTROLS ======================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1F2937] tracking-tight">
            Platform Impact & Reports
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Environmental footprint averted, meal redistribution statistics, and sustainability
            metrics
          </p>
        </div>

        {/* Date Filter & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="appearance-none bg-white border border-gray-200 text-xs font-bold text-gray-700 py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32] shadow-2xs cursor-pointer"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={handleDownloadPDF}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Download Impact PDF</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-gray-500" />
            <span>Export CSV Data</span>
          </button>
        </div>
      </div>

      {/* ======================= ROW 1: 4 IMPACT KPI CARDS ======================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total Meals Distributed */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
              Total Meals Distributed
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] mt-1.5">
              12,800 Meals
            </h3>
            <span className="inline-flex items-center text-[11px] font-bold text-[#2E7D32] mt-2">
              <TrendingUp className="w-3 h-3 mr-1" />
              +18% MoM
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#2E7D32] flex items-center justify-center shrink-0">
            <Leaf className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Food Rescued Weight */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
              Food Rescued Weight
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] mt-1.5">
              4,850 kg
            </h3>
            <span className="text-[11px] text-gray-400 block mt-2 font-medium">
              Across 286 rescues
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1565C0] flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: CO2 Emissions Prevented */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
              CO₂ Emissions Prevented
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] mt-1.5">
              12.2 Tons CO₂e
            </h3>
            <span className="text-[11px] text-gray-400 block mt-2 font-medium">
              Equivalent to 52K km
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#6A1B9A] flex items-center justify-center shrink-0">
            <CloudRain className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Water Footprint Saved */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
              Water Footprint Saved
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] mt-1.5">
              320,000 Liters
            </h3>
            <span className="text-[11px] text-gray-400 block mt-2 font-medium">
              128 swimming pools
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-[#00838F] flex items-center justify-center shrink-0">
            <Droplets className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ======================= ROW 2: VISUAL ANALYTICS SPLIT ======================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Monthly Food Rescue Growth Bar Chart (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-[#1F2937]">Monthly Food Rescue Growth</h3>
                <p className="text-xs text-gray-500">Rescued food weight over the last 6 months</p>
              </div>
              <span className="bg-emerald-50 text-[#2E7D32] border border-emerald-200 text-xs font-bold px-3 py-1 rounded-full">
                +131% growth
              </span>
            </div>

            {/* Interactive Bar Chart */}
            <div className="h-64 pt-8 flex items-end justify-between gap-3 sm:gap-6 px-2">
              {monthlyBars.map((item, idx) => (
                <div
                  key={item.month}
                  className="flex-1 flex flex-col items-center group relative cursor-pointer"
                  onMouseEnter={() => setHoveredBar(item)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {/* Tooltip on top of bar */}
                  <span className="text-[11px] font-bold text-gray-700 opacity-90 group-hover:opacity-100 group-hover:text-[#2E7D32] transition-colors mb-2">
                    {item.weight.toLocaleString()} kg
                  </span>

                  {/* Bar pillar */}
                  <div className="w-full max-w-[48px] bg-gray-100 rounded-t-xl overflow-hidden flex flex-col justify-end h-44">
                    <div
                      style={{ height: `${item.heightPct}%` }}
                      className="w-full bg-gradient-to-t from-[#1B5E20] via-[#2E7D32] to-[#66BB6A] rounded-t-xl group-hover:brightness-110 transition-all duration-300"
                    />
                  </div>

                  {/* Month Label */}
                  <span className="text-xs font-bold text-gray-500 mt-2.5">{item.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Food Category Breakdown Donut Chart (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-[#1F2937]">Food Category Breakdown</h3>
              <p className="text-xs text-gray-500">Distribution by food type</p>
            </div>

            {/* Donut graphic & legend */}
            <div className="py-6 flex flex-col sm:flex-row items-center justify-around gap-6">
              {/* SVG Donut Ring */}
              <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  {/* Background Circle */}
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#F3F4F6" strokeWidth="14" />
                  {/* Segment 1: Cooked Meals (55%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#2E7D32"
                    strokeWidth="14"
                    strokeDasharray="131 238"
                    strokeDashoffset="0"
                  />
                  {/* Segment 2: Packaged Goods (25%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#6A1B9A"
                    strokeWidth="14"
                    strokeDasharray="60 238"
                    strokeDashoffset="-131"
                  />
                  {/* Segment 3: Fresh Produce (20%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#1565C0"
                    strokeWidth="14"
                    strokeDasharray="47 238"
                    strokeDashoffset="-191"
                  />
                </svg>

                {/* Central Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-lg font-extrabold text-gray-900 leading-tight">4,850</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    Total kg
                  </span>
                </div>
              </div>

              {/* Donut Legend */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center space-x-3">
                  <span className="w-3 h-3 rounded-full bg-[#2E7D32] shrink-0" />
                  <span className="font-semibold text-gray-700">Cooked Meals</span>
                  <span className="font-extrabold text-gray-900 ml-auto">55%</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-3 h-3 rounded-full bg-[#6A1B9A] shrink-0" />
                  <span className="font-semibold text-gray-700">Packaged Goods</span>
                  <span className="font-extrabold text-gray-900 ml-auto">25%</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-3 h-3 rounded-full bg-[#1565C0] shrink-0" />
                  <span className="font-semibold text-gray-700">Fresh Produce</span>
                  <span className="font-extrabold text-gray-900 ml-auto">20%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================= ROW 3: TOP CHAMPIONS LEADERBOARD ======================= */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-gray-100 gap-3">
          <div>
            <h3 className="text-base font-bold text-[#1F2937]">Top Champions Leaderboard</h3>
            <p className="text-xs text-gray-500">Recognising outstanding community impact</p>
          </div>

          {/* Toggle Donors / Volunteers */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setLeaderboardTab('donors')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                leaderboardTab === 'donors'
                  ? 'bg-[#2E7D32] text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              Top Donors
            </button>
            <button
              onClick={() => setLeaderboardTab('volunteers')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                leaderboardTab === 'volunteers'
                  ? 'bg-[#2E7D32] text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              Star Volunteers
            </button>
          </div>
        </div>

        {/* Leaderboard Rows */}
        <div className="divide-y divide-gray-100 pt-1">
          {leaderboardTab === 'donors'
            ? topDonors.map((item) => (
                <div
                  key={item.rank}
                  className="py-3.5 flex items-center justify-between hover:bg-gray-50/50 rounded-xl px-2 transition-colors"
                >
                  <div className="flex items-center space-x-3.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-xs ${
                        item.rank === 1
                          ? 'bg-amber-100 text-amber-800'
                          : item.rank === 2
                          ? 'bg-gray-200 text-gray-700'
                          : 'bg-amber-50 text-amber-600'
                      }`}
                    >
                      {item.rank}
                    </span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-gray-400 font-medium">{item.meals}</p>
                    </div>
                  </div>

                  <span className="font-extrabold text-xs sm:text-sm text-[#2E7D32]">
                    {item.weight}
                  </span>
                </div>
              ))
            : starVolunteers.map((item) => (
                <div
                  key={item.rank}
                  className="py-3.5 flex items-center justify-between hover:bg-gray-50/50 rounded-xl px-2 transition-colors"
                >
                  <div className="flex items-center space-x-3.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-xs ${
                        item.rank === 1
                          ? 'bg-amber-100 text-amber-800'
                          : item.rank === 2
                          ? 'bg-gray-200 text-gray-700'
                          : 'bg-amber-50 text-amber-600'
                      }`}
                    >
                      {item.rank}
                    </span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-gray-400 font-medium">{item.badge}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className="text-xs font-semibold text-gray-600">
                      {item.deliveries} deliveries
                    </span>
                    <span className="font-bold text-xs bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full border border-amber-200">
                      {item.rating}
                    </span>
                  </div>
                </div>
              ))}
        </div>
      </div>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1F2937] text-white text-xs font-semibold px-5 py-3 rounded-full shadow-xl animate-in fade-in">
          {toastMessage}
        </div>
      )}
    </div>
  )
}
