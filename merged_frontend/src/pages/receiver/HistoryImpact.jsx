import { useState, useEffect } from 'react'
import {
  Utensils,
  Truck,
  Users,
  HeartHandshake,
  Search,
  CheckCircle2,
  FileDown,
  Printer,
  X,
  ShieldCheck,
  Calendar,
  Building,
} from 'lucide-react'
import receiverService from '../../services/receiverService'
import CombinedItemsBreakdown from '../../components/common/CombinedItemsBreakdown'

export default function HistoryImpact() {
  const [stats, setStats] = useState({
    totalMealsClaimed: 0,
    totalCollections: 0,
    donorsConnected: 0,
    volunteerAssisted: 0,
    breakdown: {
      cookedMeals: 0,
      freshProduce: 0,
      bakery: 0,
      packagedGoods: 0,
    },
  })

  const [history, setHistory] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedReceipt, setSelectedReceipt] = useState(null)
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [loadingReceipt, setLoadingReceipt] = useState(false)

  const loadHistoryData = async () => {
    try {
      setLoading(true)
      const [statsRes, histRes] = await Promise.all([
        receiverService.getHistoryStats(),
        receiverService.getHistory({ q: searchTerm }),
      ])
      if (statsRes.data) setStats(statsRes.data)
      if (histRes.data?.history) {
        const sorted = (histRes.data.history || []).sort((a, b) => {
          const timeB = new Date(b.deliveredAt || b.rawDate || b.date || 0).getTime()
          const timeA = new Date(a.deliveredAt || a.rawDate || a.date || 0).getTime()
          return timeB - timeA
        })
        setHistory(sorted)
      }
    } catch (err) {
      console.error('Error fetching history data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadHistoryData()
    }, 250)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const handleDownloadReceipt = async (orderId) => {
    try {
      setLoadingReceipt(true)
      const res = await receiverService.getOrderReceipt(orderId)
      if (res.data) {
        setSelectedReceipt(res.data)
        setReceiptModalOpen(true)
      }
    } catch (err) {
      alert('Unable to load receipt details.')
    } finally {
      setLoadingReceipt(false)
    }
  }

  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow || !selectedReceipt) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Food Donation Tax Receipt - #${selectedReceipt.orderNo}</title>
          <style>
            body { font-family: 'Inter', -apple-system, sans-serif; padding: 40px; color: #1f2937; line-height: 1.5; }
            .header { border-bottom: 2px solid #2E7D32; padding-bottom: 20px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
            .brand { font-size: 24px; font-weight: bold; color: #2E7D32; }
            .badge { background: #E8F5E9; color: #2E7D32; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: bold; }
            .receipt-title { font-size: 18px; font-weight: bold; margin-bottom: 20px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
            .box { background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; }
            .box-title { font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: bold; margin-bottom: 6px; }
            .box-val { font-size: 14px; font-weight: 600; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 25px; }
            th, td { border: 1px solid #e5e7eb; padding: 10px 14px; text-align: left; font-size: 13px; }
            th { background: #f3f4f6; font-weight: 600; }
            .legal { font-size: 11px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 30px; font-style: italic; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">FoodShare Rescue Network</div>
              <div style="font-size: 12px; color: #4b5563;">Official Non-Profit Transfer Receipt</div>
            </div>
            <div class="badge">Verified 501(c)(3)</div>
          </div>

          <div class="receipt-title">Surplus Food Rescue Donation Receipt #${selectedReceipt.orderNo}</div>

          <div class="grid">
            <div class="box">
              <div class="box-title">Donor Partner</div>
              <div class="box-val">${selectedReceipt.donor}</div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">${selectedReceipt.donorAddress}</div>
            </div>

            <div class="box">
              <div class="box-title">Recipient Organization</div>
              <div class="box-val">${selectedReceipt.receiverOrg}</div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">Tax ID (EIN): ${selectedReceipt.receiverTaxId}</div>
              <div style="font-size: 12px; color: #6b7280;">${selectedReceipt.receiverAddress}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Food Item</th>
                <th>Quantity</th>
                <th>Fulfillment Date</th>
                <th>Method</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${selectedReceipt.foodItem}</strong></td>
                <td>${selectedReceipt.quantity}</td>
                <td>${selectedReceipt.date}</td>
                <td>${selectedReceipt.deliveryMethod}</td>
              </tr>
            </tbody>
          </table>

          <div class="legal">
            ${selectedReceipt.taxExemptNote}
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 300)
  }

  return (
    <div className="space-y-6">
      {/* 1. 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Meals Claimed */}
        <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#2E7D32]">
              {stats.totalMealsClaimed ?? 0}
            </span>
            <p className="text-xs font-bold text-gray-800 mt-1">Total Meals Claimed</p>
            <p className="text-[11px] text-gray-400 font-medium">servings</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#2E7D32] flex items-center justify-center shrink-0">
            <Utensils className="w-5 h-5" />
          </div>
        </div>

        {/* Total Collections */}
        <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#1565C0]">
              {stats.totalCollections ?? 0}
            </span>
            <p className="text-xs font-bold text-gray-800 mt-1">Total Collections</p>
            <p className="text-[11px] text-gray-400 font-medium">collections</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1565C0] flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* Donors Connected */}
        <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#6A1B9A]">
              {stats.donorsConnected ?? 0}
            </span>
            <p className="text-xs font-bold text-gray-800 mt-1">Donors Connected</p>
            <p className="text-[11px] text-gray-400 font-medium">partners</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#6A1B9A] flex items-center justify-center shrink-0">
            <HeartHandshake className="w-5 h-5" />
          </div>
        </div>

        {/* Volunteer-Assisted */}
        <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#E65100]">
              {stats.volunteerAssisted ?? 0}
            </span>
            <p className="text-xs font-bold text-gray-800 mt-1">Volunteer-Assisted</p>
            <p className="text-[11px] text-gray-400 font-medium">collections</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#E65100] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Category Breakdown Progress Bars Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E5E7EB] shadow-xs space-y-4">
        <h3 className="text-sm sm:text-base font-bold text-gray-900">Category Breakdown</h3>
        <div className="space-y-3.5">
          {/* Cooked Meals (Green) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-gray-700">Cooked Meals</span>
              <span className="text-gray-900 font-bold">{stats.breakdown?.cookedMeals ?? 0}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#2E7D32] transition-all duration-500"
                style={{ width: `${stats.breakdown?.cookedMeals ?? 0}%` }}
              />
            </div>
          </div>

          {/* Fresh Produce (Blue) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-gray-700">Fresh Produce</span>
              <span className="text-gray-900 font-bold">{stats.breakdown?.freshProduce ?? 0}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#1565C0] transition-all duration-500"
                style={{ width: `${stats.breakdown?.freshProduce ?? 0}%` }}
              />
            </div>
          </div>

          {/* Bakery (Orange) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-gray-700">Bakery</span>
              <span className="text-gray-900 font-bold">{stats.breakdown?.bakery ?? 0}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#E65100] transition-all duration-500"
                style={{ width: `${stats.breakdown?.bakery ?? 0}%` }}
              />
            </div>
          </div>

          {/* Packaged Goods (Purple) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-gray-700">Packaged Goods</span>
              <span className="text-gray-900 font-bold">{stats.breakdown?.packagedGoods ?? 0}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#6A1B9A] transition-all duration-500"
                style={{ width: `${stats.breakdown?.packagedGoods ?? 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Collection History Table Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        {/* Table Header with Search */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm sm:text-base font-bold text-gray-900">Collection History</h3>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search history..."
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#2E7D32] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Food Item</th>
                <th className="py-3 px-4">Donor</th>
                <th className="py-3 px-4">Qty</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.length > 0 ? (
                history.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      <div>{item.foodItem}</div>
                      {item.items && item.items.length > 1 && (
                        <CombinedItemsBreakdown items={item.items} />
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap font-medium">
                      {item.donor}
                    </td>
                    <td className="py-3.5 px-4 text-gray-800 font-semibold whitespace-nowrap">
                      {item.qty}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">{item.date}</td>
                    <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap font-medium">
                      {item.method}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-[#2E7D32] border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Completed
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleDownloadReceipt(item._id)}
                        className="px-3 py-1 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-[#2E7D32] rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                      >
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-gray-400">
                    No collection history records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      {receiptModalOpen && selectedReceipt && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
          onClick={() => setReceiptModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-lg w-full p-6 relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setReceiptModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-3 border-b border-gray-100 pr-8">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#2E7D32] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Donation Receipt #{selectedReceipt.orderNo}
                </h3>
                <p className="text-xs text-gray-500">Official Non-profit Transfer Record</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-gray-700">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Donor</span>
                  <p className="font-bold text-gray-900 mt-0.5">{selectedReceipt.donor}</p>
                  <p className="text-[11px] text-gray-500">{selectedReceipt.donorAddress}</p>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Recipient Org</span>
                  <p className="font-bold text-gray-900 mt-0.5">{selectedReceipt.receiverOrg}</p>
                  <p className="text-[11px] text-gray-500">Tax ID: {selectedReceipt.receiverTaxId}</p>
                </div>
              </div>

              <div className="p-3.5 border border-gray-100 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Food Item:</span>
                  <span className="font-bold text-gray-900">{selectedReceipt.foodItem}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Quantity Claimed:</span>
                  <span className="font-bold text-gray-900">{selectedReceipt.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivered On:</span>
                  <span className="font-medium text-gray-700">{selectedReceipt.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Fulfillment Method:</span>
                  <span className="font-medium text-gray-700">{selectedReceipt.deliveryMethod}</span>
                </div>
              </div>

              <p className="text-[11px] text-gray-500 italic bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100 text-emerald-900">
                {selectedReceipt.taxExemptNote}
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setReceiptModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
