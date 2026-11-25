import { useState, useEffect } from 'react'
import {
  FileText,
  Search,
  Calendar,
  CheckCircle2,
  XCircle,
  Leaf,
  RefreshCw,
  MapPin,
  Clock,
  ArrowUpDown,
  X,
  AlertCircle,
} from 'lucide-react'
import { volunteerService } from '../../services/volunteerService'
import {
  formatQuantityUnit,
  getCombinedFoodTitle,
  isCombinedBasket,
  getTotalUnits,
  getOrderItems,
} from '../../utils/unitHelper'
import CombinedItemsBreakdown from '../../components/common/CombinedItemsBreakdown'

export default function VolunteerHistory() {
  const [historyList, setHistoryList] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('all') // 'all' | '30days' | 'this_month'
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'completed' | 'cancelled'
  const [selectedDate, setSelectedDate] = useState('') // 'YYYY-MM-DD'

  const fetchHistory = async () => {
    try {
      setLoading(true)
      setErrorMessage('')
      // Request 'history' so the backend returns all completed, cancelled, and expired records
      const res = await volunteerService.getMyDeliveries('history')
      const rawList = res.data?.deliveries || []
      const sortedList = [...rawList].sort((a, b) => {
        const timeB = new Date(b.deliveredAt || b.cancelledAt || b.updatedAt || b.createdAt || 0).getTime()
        const timeA = new Date(a.deliveredAt || a.cancelledAt || a.updatedAt || a.createdAt || 0).getTime()
        return timeB - timeA
      })
      setHistoryList(sortedList)
    } catch (err) {
      console.error('Failed to load delivery history records:', err)
      setErrorMessage('Unable to load delivery records. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  // Filter by search query, status, and date
  const filteredList = historyList.filter((item) => {
    // 1. Status Filter
    if (statusFilter === 'completed' && item.status !== 'completed') return false
    if (statusFilter === 'cancelled' && item.status !== 'cancelled') return false

    // 2. Search Query
    const q = searchQuery.toLowerCase().trim()
    const donorName = (item.donation?.donorOrganization || item.donor?.fullName || '').toLowerCase()
    const receiverName = (item.receiver?.fullName || item.receiver?.organizationName || '').toLowerCase()
    const title = (item.donation?.title || '').toLowerCase()
    const orderNo = (item.orderNo || '').toLowerCase()

    const matchesSearch =
      !q ||
      donorName.includes(q) ||
      receiverName.includes(q) ||
      title.includes(q) ||
      orderNo.includes(q)

    if (!matchesSearch) return false

    // 3. Date Filter from date picker
    const effectiveDate = new Date(item.deliveredAt || item.cancelledAt || item.updatedAt)
    if (selectedDate) {
      const year = effectiveDate.getFullYear()
      const month = String(effectiveDate.getMonth() + 1).padStart(2, '0')
      const day = String(effectiveDate.getDate()).padStart(2, '0')
      const itemDateStr = `${year}-${month}-${day}`
      if (itemDateStr !== selectedDate) return false
    }

    if (dateFilter === '30days') {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      if (effectiveDate < thirtyDaysAgo) return false
    } else if (dateFilter === 'this_month') {
      const now = new Date()
      if (
        effectiveDate.getMonth() !== now.getMonth() ||
        effectiveDate.getFullYear() !== now.getFullYear()
      ) {
        return false
      }
    }

    return true
  }).sort((a, b) => {
    // Recently completed/updated deliveries at the top, older ones at the bottom
    const timeB = new Date(b.deliveredAt || b.cancelledAt || b.updatedAt || b.createdAt || 0).getTime()
    const timeA = new Date(a.deliveredAt || a.cancelledAt || a.updatedAt || a.createdAt || 0).getTime()
    return timeB - timeA
  })

  // Calculate totals
  const totalTrips = historyList.length
  const completedTrips = historyList.filter((i) => i.status === 'completed')
  const cancelledTrips = historyList.filter((i) => i.status === 'cancelled')
  const completedCount = completedTrips.length
  const cancelledCount = cancelledTrips.length
  const totalMealsDelivered = completedTrips.reduce((acc, curr) => acc + (curr.donation?.quantity || 1), 0)
  const completionRate = totalTrips > 0 ? Math.round((completedCount / totalTrips) * 100) : 100

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight">
            Delivery History
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            A verified log of all your delivery runs, completed rescues, and food safety records.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading}
          className="flex items-center gap-2 self-start sm:self-auto px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error alert */}
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

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search food, order #, or partners..."
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] outline-none transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-700 focus:border-[#2E7D32] outline-none cursor-pointer"
          >
            <option value="all">All Statuses ({totalTrips})</option>
            <option value="completed">Completed ({completedCount})</option>
            <option value="cancelled">Cancelled / Expired ({cancelledCount})</option>
          </select>

          {/* Clickable Calendar Filter */}
          <div className="relative flex items-center">
            <input
              type="date"
              id="history-date-picker"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="sr-only"
            />
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('history-date-picker')
                if (el?.showPicker) {
                  el.showPicker()
                } else {
                  el?.focus()
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                selectedDate
                  ? 'border-[#2E7D32] bg-emerald-50 text-[#2E7D32]'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
              title="Click calendar to filter by date"
            >
              <Calendar className="w-4 h-4 text-[#2E7D32]" />
              <span>
                {selectedDate
                  ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Calendar Filter'}
              </span>
            </button>
            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate('')}
                className="ml-1 p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                title="Reset date filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="text-xs font-semibold bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-700 focus:border-[#2E7D32] outline-none cursor-pointer"
          >
            <option value="all">All Dates</option>
            <option value="30days">Last 30 Days</option>
            <option value="this_month">This Month</option>
          </select>
        </div>
      </div>

      {/* Data Table Card */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-[#2E7D32] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-gray-400 mt-3">Loading delivery history records...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-gray-800">
              {searchQuery || selectedDate || statusFilter !== 'all'
                ? 'No deliveries found'
                : 'No delivery records yet'}
            </h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {searchQuery || selectedDate || statusFilter !== 'all'
                ? 'No deliveries matched your filters. Try adjusting or clearing search criteria.'
                : 'When you take delivery runs, they will automatically be logged here with their completed or cancelled status.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-400 font-bold uppercase tracking-wider text-[10px] border-b border-gray-100">
                <tr>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Food Item</th>
                  <th className="py-4 px-6">Donor</th>
                  <th className="py-4 px-6">Recipient</th>
                  <th className="py-4 px-6">Quantity</th>
                  <th className="py-4 px-6">Distance</th>
                  <th className="py-4 px-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                {filteredList.map((item) => {
                  const effectiveDate = item.deliveredAt || item.cancelledAt || item.updatedAt
                  const dateStr = effectiveDate
                    ? new Date(effectiveDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Recent'

                  const donor =
                    item.donation?.donorOrganization || item.donor?.fullName || 'Local Donor'
                  const recipient =
                    item.receiver?.organizationName || item.receiver?.fullName || 'Receiver Partner'
                  const isCombined = isCombinedBasket(item)
                  const title = isCombined ? getCombinedFoodTitle(item) : (item.donation?.title || 'Food Donation')
                  const qty = isCombined ? getTotalUnits(item) : (item.donation?.quantity || 1)
                  const unit = isCombined ? 'Servings' : (item.donation?.unit || 'Servings')
                  const distance = item.distance || '3.5 km'
                  const isCompleted = item.status === 'completed'
                  const isCancelled = item.status === 'cancelled'

                  return (
                    <tr key={item._id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-4 px-6 font-semibold text-gray-900 whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-4 px-6 font-bold text-gray-900">
                        <div>
                          <span>{title}</span>
                          <span className="block text-[10px] font-normal text-gray-400 font-mono">
                            #{item.orderNo || item._id?.toString().slice(-6).toUpperCase()}
                          </span>
                          <CombinedItemsBreakdown items={getOrderItems(item)} />
                        </div>
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-800 whitespace-nowrap">
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
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-[#2E7D32] border border-emerald-100">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Delivered</span>
                          </span>
                        ) : isCancelled ? (
                          <div className="inline-flex flex-col items-end gap-0.5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                              <XCircle className="w-3.5 h-3.5 text-red-600" />
                              <span>{item.donation?.status === 'expired' ? 'Expired' : 'Cancelled'}</span>
                            </span>
                            {item.cancellationReason && (
                              <span
                                className="text-[10px] text-gray-400 font-normal max-w-[170px] truncate"
                                title={item.cancellationReason}
                              >
                                {item.cancellationReason}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            <span>In Progress</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary Footer Card */}
        <div className="p-6 bg-gradient-to-r from-emerald-50/60 to-teal-50/40 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#2E7D32] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              <Leaf className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">
                {completedCount} Delivered · {cancelledCount} Cancelled / Expired ({totalTrips} Total Records)
              </div>
              <div className="text-[11px] text-emerald-800">
                Zero food wasted — your completed journeys have delivered {totalMealsDelivered} meals to community partners!
              </div>
            </div>
          </div>

          <div className="text-right self-start sm:self-auto shrink-0">
            <span className="text-xl font-extrabold text-[#2E7D32]">{completionRate}%</span>
            <span className="block text-[10px] text-gray-400 font-semibold uppercase">
              Completion Rate
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
