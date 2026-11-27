import { useState, useEffect } from 'react'
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  User,
  Bike,
  Navigation,
  FileCheck,
  X,
  Radio,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Search,
} from 'lucide-react'
import { adminService, MOCK_EXCHANGES } from '../../services/adminService'
import LiveTrackingMap from '../../components/common/LiveTrackingMap'

const FALLBACK_VOLUNTEERS = [
  { id: 'vol-1', name: 'P Vidyashree', vehicle: 'Bike', phone: '+91 98112 55678', distance: '1.2 km away' },
]

export default function AdminDeliveries() {
  const [exchanges, setExchanges] = useState(MOCK_EXCHANGES)
  const [availableVolunteers, setAvailableVolunteers] = useState(FALLBACK_VOLUNTEERS)
  const [viewMode, setViewMode] = useState('pipeline') // 'pipeline' | 'map'
  const [assigningExchange, setAssigningExchange] = useState(null)
  const [contactModalData, setContactModalData] = useState(null)
  const [receiptModalData, setReceiptModalData] = useState(null)
  const [liveTrackExchange, setLiveTrackExchange] = useState(null)
  const [toastMessage, setToastMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [deliveriesData, volunteersData] = await Promise.all([
        adminService.getDeliveries(),
        adminService.getAvailableVolunteers()
      ])
      const deliveriesList = Array.isArray(deliveriesData)
        ? deliveriesData
        : (deliveriesData?.exchanges || [])
      if (deliveriesList.length > 0) {
        setExchanges(deliveriesList)
        setLiveTrackExchange((prev) => prev || deliveriesList[0])
      }
      const volunteersList = Array.isArray(volunteersData)
        ? volunteersData
        : (volunteersData?.volunteers || [])
      if (volunteersList.length > 0) {
        setAvailableVolunteers(volunteersList)
      }
    } catch (err) {
      console.warn('Failed to load logistics data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Handle assigning a volunteer
  const handleAssignVolunteer = async (exchange, volunteer) => {
    const exchangeId = exchange?._id || exchange?.id
    const volunteerId = volunteer?._id || volunteer?.id
    try {
      await adminService.assignVolunteer(exchangeId, volunteerId)
      setToastMessage(`✓ ${volunteer.name} successfully assigned to exchange!`)
      loadData()
    } catch (err) {
      // Optimistic update
      setExchanges((prev) =>
        prev.map((ex) =>
          (ex.id === exchangeId || ex._id === exchangeId)
            ? {
                ...ex,
                volunteer: {
                  name: volunteer.name,
                  phone: volunteer.phone,
                  vehicle: volunteer.vehicle,
                  avatar: (volunteer.name || 'VO').slice(0, 2).toUpperCase(),
                  coords: volunteer.coords || { lat: 21.2245, lng: 81.638 },
                },
                deliveryStage: 'Volunteer En Route',
                distanceEta: '3.2 km • 15 mins',
                stageColor: 'text-purple-700 bg-purple-50 border-purple-200',
              }
            : ex
        )
      )
      setToastMessage(`✓ ${volunteer.name} assigned to exchange!`)
    }
    setAssigningExchange(null)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const pendingPickupCount = exchanges.filter((e) =>
    ['Pending Volunteer', 'Scheduled', 'Ready for Pickup', 'Pending Pickup', 'Volunteer En Route'].includes(e.deliveryStage)
  ).length
  const inTransitCount = exchanges.filter((e) =>
    ['In Transit', 'Out for Delivery'].includes(e.deliveryStage)
  ).length
  const completedCount = exchanges.filter((e) =>
    ['Completed', 'Delivered'].includes(e.deliveryStage)
  ).length
  const alertsCount = exchanges.filter((e) =>
    ['Flagged', 'Delayed', 'Issue Reported'].includes(e.deliveryStage)
  ).length

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ======================= HEADER & VIEW TOGGLE ======================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1F2937] tracking-tight">
            Requests & Live Logistics
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Real-time tracking of food requests, active pickups, and volunteer dispatch
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center space-x-4 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('pipeline')}
            className={`text-xs font-bold transition-all ${
              viewMode === 'pipeline'
                ? 'text-[#2E7D32] border-b-2 border-[#2E7D32] pb-0.5'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Pipeline View
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`text-xs font-bold flex items-center space-x-1 transition-all ${
              viewMode === 'map'
                ? 'text-[#2E7D32] border-b-2 border-[#2E7D32] pb-0.5'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <span>🗺 Live Map View</span>
          </button>
        </div>
      </div>

      {/* ======================= LOGISTICS SUMMARY STRIP ======================= */}
      <div className="flex flex-wrap items-center gap-6 sm:gap-12 pt-1 pb-2">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-xs text-gray-600 font-medium">Pending Pickup</span>
          <span className="text-sm font-bold text-gray-900 ml-1">{pendingPickupCount}</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1565C0]" />
          <span className="text-xs text-gray-600 font-medium">In Transit</span>
          <span className="text-sm font-bold text-gray-900 ml-1">{inTransitCount}</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D32]" />
          <span className="text-xs text-gray-600 font-medium">Completed</span>
          <span className="text-sm font-bold text-gray-900 ml-1">{completedCount}</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-xs text-gray-600 font-medium">Delayed / Alerts</span>
          <span className="text-sm font-bold text-gray-900 ml-1">{alertsCount}</span>
        </div>
      </div>

      {/* ======================= PIPELINE TABLE VIEW ======================= */}
      {viewMode === 'pipeline' ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Section Subheader */}
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#1F2937]">Active Exchanges Pipeline</h3>
              <p className="text-xs text-gray-500">Live handoff and delivery progress</p>
            </div>
            <div className="flex items-center space-x-1.5 bg-emerald-50 text-[#2E7D32] px-3 py-1 rounded-full text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-[#2E7D32] animate-pulse" />
              <span>Live updates</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold text-gray-400 tracking-wider uppercase">
                  <th className="py-3.5 px-5">EXCHANGE ID</th>
                  <th className="py-3.5 px-4">DONOR (PICKUP)</th>
                  <th className="py-3.5 px-4">RECEIVER (DROP-OFF)</th>
                  <th className="py-3.5 px-4">ASSIGNED VOLUNTEER</th>
                  <th className="py-3.5 px-4">DISTANCE & ETA</th>
                  <th className="py-3.5 px-4">DELIVERY STAGE</th>
                  <th className="py-3.5 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {exchanges.map((ex) => (
                  <tr key={ex.id} className="hover:bg-gray-50/70 transition-colors">
                    {/* ID */}
                    <td className="py-3.5 px-5 font-bold text-[#2E7D32] font-mono">{ex.id}</td>

                    {/* Donor */}
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-gray-900 leading-tight">{ex.donor.name}</p>
                      <p className="text-[11px] text-gray-400 font-medium">{ex.donor.area}</p>
                    </td>

                    {/* Receiver */}
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-gray-900 leading-tight">{ex.receiver.name}</p>
                      <p className="text-[11px] text-gray-400 font-medium">{ex.receiver.area}</p>
                    </td>

                    {/* Volunteer */}
                    <td className="py-3.5 px-4">
                      {ex.volunteer ? (
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-extrabold text-[10px] flex items-center justify-center">
                            {ex.volunteer.avatar}
                          </span>
                          <div>
                            <p className="font-bold text-gray-900 leading-tight">{ex.volunteer.name}</p>
                            <p className="text-[10px] text-gray-400">{ex.volunteer.vehicle}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 font-medium italic">Unassigned</span>
                      )}
                    </td>

                    {/* Distance & ETA */}
                    <td className="py-3.5 px-4 font-semibold text-gray-700">{ex.distanceEta}</td>

                    {/* Delivery Stage Pill */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-bold ${
                          ex.deliveryStage === 'In Transit'
                            ? 'text-[#1565C0]'
                            : ex.deliveryStage === 'Delivered'
                            ? 'text-[#2E7D32]'
                            : 'text-[#E65100]'
                        }`}
                      >
                        {ex.deliveryStage}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      {ex.deliveryStage === 'In Transit' ? (
                        <div className="inline-flex items-center space-x-2.5">
                          <button
                            onClick={() => {
                              setLiveTrackExchange(ex)
                              setViewMode('map')
                            }}
                            className="px-3 py-1 rounded-lg border border-blue-300 text-[#1565C0] hover:bg-blue-50 font-semibold text-xs transition-colors"
                          >
                            Live Track
                          </button>
                          <button
                            onClick={() => setContactModalData(ex)}
                            className="text-gray-600 hover:text-gray-900 font-semibold text-xs"
                          >
                            Contact
                          </button>
                        </div>
                      ) : ex.deliveryStage === 'Pending Volunteer' ? (
                        <button
                          onClick={() => setAssigningExchange(ex)}
                          className="px-3.5 py-1.5 rounded-lg bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold shadow-2xs transition-colors"
                        >
                          Assign Volunteer
                        </button>
                      ) : (
                        <button
                          onClick={() => setReceiptModalData(ex)}
                          className="text-gray-700 hover:underline font-semibold text-xs"
                        >
                          View Receipt / OTP
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ======================= LIVE MAP VIEW ======================= */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-[#1F2937]">Live Logistics & Transit Map</h3>
              <p className="text-xs text-gray-500">
                Real-time routing for donor, receiver, and volunteer courier
              </p>
            </div>
            <button
              onClick={() => setViewMode('pipeline')}
              className="text-xs font-bold text-[#2E7D32] hover:underline"
            >
              &larr; Back to Pipeline Table
            </button>
          </div>

          {/* Active exchange selector for map */}
          {exchanges.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1 pb-2">
              <span className="text-xs font-bold text-gray-500 mr-1">Select Delivery:</span>
              {exchanges.slice(0, 8).map((ex) => {
                const isSelected = (liveTrackExchange?._id || liveTrackExchange?.id) === (ex._id || ex.id)
                return (
                  <button
                    key={ex._id || ex.id}
                    onClick={() => setLiveTrackExchange(ex)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-[#2E7D32] text-white shadow-2xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {ex.id} · {ex.donor.name} ➔ {ex.receiver.name}
                  </button>
                )
              })}
            </div>
          )}

          <div className="rounded-xl overflow-hidden border border-gray-200">
            <LiveTrackingMap
              pickupCoords={liveTrackExchange?.donor?.coords || { lat: 21.1965, lng: 81.3552 }}
              dropoffCoords={liveTrackExchange?.receiver?.coords || { lat: 21.2269, lng: 81.6366 }}
              volunteerCoords={liveTrackExchange?.volunteer?.coords || { lat: 21.2144, lng: 81.45 }}
              pickupAddress={liveTrackExchange?.donor?.area || (liveTrackExchange ? `${liveTrackExchange.donor?.name} (${liveTrackExchange.donor?.area})` : 'Sector 4 Bhilai')}
              dropoffAddress={liveTrackExchange?.receiver?.area || (liveTrackExchange ? `${liveTrackExchange.receiver?.name} (${liveTrackExchange.receiver?.area})` : 'Tikrapara Raipur')}
              volunteerName={liveTrackExchange?.volunteer?.name || 'Assigned Courier'}
              volunteerTransport={liveTrackExchange?.volunteer?.vehicle?.toLowerCase() || 'bicycle'}
              status={liveTrackExchange?.rawStatus || (liveTrackExchange?.deliveryStage === 'Delivered' ? 'delivered' : 'in_transit')}
              height="480px"
              showExternalNav={false}
              userRole="admin"
            />
          </div>
        </div>
      )}

      {/* ======================= ASSIGN VOLUNTEER MODAL ======================= */}
      {assigningExchange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                Assign Volunteer to {assigningExchange.id}
              </h3>
              <button
                onClick={() => setAssigningExchange(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Route: <strong>{assigningExchange.donor.name}</strong> ➔{' '}
              <strong>{assigningExchange.receiver.name}</strong>
            </p>

            <div className="mt-4 space-y-2.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Available On-Duty Volunteers:
              </span>
              {availableVolunteers.map((v) => (
                <div
                  key={v.id}
                  className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between hover:bg-emerald-50/60 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#2E7D32] flex items-center justify-center font-bold text-xs">
                      {v.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">{v.name}</h4>
                      <p className="text-[11px] text-gray-400 font-medium">
                        {v.vehicle} • {v.distance}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAssignVolunteer(assigningExchange, v)}
                    className="px-3 py-1.5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold rounded-lg shadow-2xs"
                  >
                    Assign
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setAssigningExchange(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= CONTACT MODAL ======================= */}
      {contactModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Exchange Contact Details</h3>
              <button
                onClick={() => setContactModalData(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="font-bold text-gray-500 block">Donor Contact:</span>
                <p className="font-bold text-gray-900">{contactModalData.donor?.name || 'Donor'}</p>
                <p className="text-gray-600">{contactModalData.donor?.phone || '+91 98200 44321'}</p>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="font-bold text-gray-500 block">Receiver Contact:</span>
                <p className="font-bold text-gray-900">{contactModalData.receiver?.name || 'Receiver'}</p>
                <p className="text-gray-600">{contactModalData.receiver?.phone || '+91 98201 12345'}</p>
              </div>

              {contactModalData.volunteer && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[#2E7D32]">
                  <span className="font-bold block">Assigned Volunteer:</span>
                  <p className="font-bold">{contactModalData.volunteer?.name}</p>
                  <p className="font-mono">{contactModalData.volunteer?.phone}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setContactModalData(null)}
                className="px-4 py-2 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= RECEIPT / OTP MODAL ======================= */}
      {receiptModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-200 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#2E7D32] mx-auto flex items-center justify-center mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Delivery Handoff Receipt</h3>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{receiptModalData.id || receiptModalData._id}</p>

            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Delivered To:</span>
                <span className="font-bold text-gray-800">{receiptModalData.receiver?.name || 'Receiver'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Courier:</span>
                <span className="font-bold text-gray-800">
                  {receiptModalData.volunteer?.name || 'Courier'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Verified OTP:</span>
                <span className="font-mono font-bold text-[#2E7D32]">{receiptModalData.deliveryCode || receiptModalData.pickupCode || '849-210'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className="font-bold text-emerald-600">Successfully Confirmed</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setReceiptModalData(null)}
                className="w-full py-2.5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold text-xs rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1F2937] text-white text-xs font-semibold px-5 py-3 rounded-full shadow-xl animate-in fade-in">
          {toastMessage}
        </div>
      )}
    </div>
  )
}
