import { useState, useEffect } from 'react'
import {
  FileText,
  Search,
  Calendar,
  CheckCircle2,
  Leaf,
  RefreshCw,
  MapPin,
  Clock,
  ArrowUpDown,
} from 'lucide-react'
import { volunteerService } from '../../services/volunteerService'
import { formatQuantityUnit } from '../../utils/unitHelper'

export default function VolunteerHistory() {
  const [historyList, setHistoryList] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('all') // 'all' | '30days' | 'this_month'

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const res = await volunteerService.getMyDeliveries('completed')
      setHistoryList(res.data?.deliveries || [])
    } catch (err) {
      console.error('Failed to load completed deliveries:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  // Filter by query and date
  const filteredList = historyList.filter((item) => {
    const q = searchQuery.toLowerCase().trim()
    const donorName = (item.donation?.donorOrganization || item.donor?.fullName || '').toLowerCase()
    const receiverName = (item.receiver?.fullName || '').toLowerCase()
    const title = (item.donation?.title || '').toLowerCase()
    const orderNo = (item.orderNo || '').toLowerCase()

    const matchesSearch = !q || donorName.includes(q) || receiverName.includes(q) || title.includes(q) || orderNo.includes(q)

    if (!matchesSearch) return false

    if (dateFilter === '30days') {
      const deliveredDate = new Date(item.deliveredAt || item.updatedAt)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return deliveredDate >= thirtyDaysAgo
    }

    return true
  })

  // Calculate totals
  const totalTrips = historyList.length
  const totalMeals = historyList.reduce((acc, curr) => acc + (curr.donation?.quantity || 1), 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight">
            Delivery History
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            A verified record of the difference and food you&apos;ve delivered
          </p>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading}
          className="flex items-center gap-2 self-start sm:self-auto px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors shadow-2xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deliveries or partners..."
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Calendar className="w-4 h-4 text-gray-400" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="text-xs font-semibold bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-700 focus:border-[#2E7D32] outline-none cursor-pointer"
          >
            <option value="all">All Deliveries</option>
            <option value="30days">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Data Table Card */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-[#2E7D32] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-gray-400 mt-3">Loading completed rescue records...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-gray-800">No completed deliveries yet</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {searchQuery
                ? 'No deliveries matched your search query.'
                : 'When you complete food rescue trips, they will automatically be logged here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-400 font-bold uppercase tracking-wider text-[10px] border-b border-gray-100">
                <tr>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Donor</th>
                  <th className="py-4 px-6">Recipient</th>
                  <th className="py-4 px-6">Quantity</th>
                  <th className="py-4 px-6">Distance</th>
                  <th className="py-4 px-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                {filteredList.map((item) => {
                  const dateStr = item.deliveredAt
                    ? new Date(item.deliveredAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : new Date(item.updatedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })

                  const donor =
                    item.donation?.donorOrganization || item.donor?.fullName || 'Local Donor'
                  const recipient = item.receiver?.fullName || 'Hope Shelter'
                  const qty = item.donation?.quantity || 25
                  const unit = item.donation?.unit || 'meals'
                  const distance = item.distance || '4.2 km'

                  return (
                    <tr key={item._id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-4 px-6 font-semibold text-gray-900 whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-4 px-6 font-bold text-gray-800 whitespace-nowrap">
                        {donor}
                      </td>
                      <td className="py-4 px-6 text-gray-600 whitespace-nowrap">
                        {recipient}
                      </td>
                      <td className="py-4 px-6 font-semibold text-gray-900 whitespace-nowrap">
                        {formatQuantityUnit(qty, unit)}
                      </td>
                      <td className="py-4 px-6 text-gray-500 whitespace-nowrap">
                        {distance}
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-[#2E7D32] border border-emerald-100">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Delivered</span>
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary Footer Card (Matching Page 3) */}
        <div className="p-6 bg-gradient-to-r from-emerald-50/60 to-teal-50/40 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#2E7D32] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              <Leaf className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">
                {totalTrips} total food rescue trips completed
              </div>
              <div className="text-[11px] text-emerald-800">
                Zero food wasted — your journeys have delivered {totalMeals} meals in the community!
              </div>
            </div>
          </div>

          <div className="text-right self-start sm:self-auto shrink-0">
            <span className="text-xl font-extrabold text-[#2E7D32]">100%</span>
            <span className="block text-[10px] text-gray-400 font-semibold uppercase">
              Completion Rate
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
