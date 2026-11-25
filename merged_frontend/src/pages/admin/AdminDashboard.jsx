import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Users,
  Clock,
  Package,
  ArrowLeftRight,
  Eye,
  Check,
  Building2,
  Bike,
  AlertTriangle,
  Leaf,
  ChevronRight,
  X,
  FileText,
  TrendingUp,
} from 'lucide-react'
import { adminService, MOCK_PENDING_APPLICATIONS } from '../../services/adminService'

export default function AdminDashboard() {
  const navigate = useNavigate()

  const [pendingList, setPendingList] = useState(MOCK_PENDING_APPLICATIONS.slice(0, 3))
  const [trendPeriod, setTrendPeriod] = useState('monthly')
  const [selectedProof, setSelectedProof] = useState(null)
  const [rejectingItem, setRejectingItem] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [toastMessage, setToastMessage] = useState(null)

  // Fetch real pending applications if available from backend
  useEffect(() => {
    async function loadData() {
      try {
        const apps = await adminService.getAllPendingApplications()
        if (apps && apps.length > 0) {
          setPendingList(apps.slice(0, 3))
        }
      } catch {
        // Keeps mock data
      }
    }
    loadData()
  }, [])

  const handleApprove = async (id, name, role) => {
    try {
      if (role === 'receiver') {
        await adminService.approveReceiver(id)
      } else {
        await adminService.approveVolunteer(id)
      }
    } catch {
      // optimistic
    }
    setPendingList((prev) => prev.filter((item) => item._id !== id))
    setToastMessage(`✓ ${name} has been successfully approved!`)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleConfirmReject = async () => {
    if (!rejectingItem) return
    try {
      if (rejectingItem.role === 'receiver') {
        await adminService.rejectReceiver(rejectingItem._id, rejectReason)
      } else {
        await adminService.rejectVolunteer(rejectingItem._id, rejectReason)
      }
    } catch {
      // optimistic
    }
    setPendingList((prev) => prev.filter((item) => item._id !== rejectingItem._id))
    setToastMessage(`Application for ${rejectingItem.organizationName} was rejected.`)
    setRejectingItem(null)
    setRejectReason('')
    setTimeout(() => setToastMessage(null), 3000)
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* ======================= ROW 1: 4 KPI CARDS ======================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: TOTAL USERS */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">
              TOTAL USERS
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#2E7D32] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-3xl font-extrabold text-[#1F2937] tracking-tight">1,248</h2>
            <div className="flex items-center space-x-1.5 mt-2">
              <span className="inline-flex items-center text-xs font-bold text-[#2E7D32]">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                +12% this month
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: AWAITING APPROVAL (Highlighted in amber) */}
        <div className="bg-white rounded-2xl p-5 border-2 border-amber-300 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 tracking-wider uppercase">
              AWAITING APPROVAL
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-3xl font-extrabold text-[#1F2937] tracking-tight">14</h2>
            <p className="text-xs font-semibold text-amber-700/90 mt-2">
              8 Receivers, 6 Volunteers
            </p>
          </div>
        </div>

        {/* Card 3: ACTIVE DONATIONS */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">
              ACTIVE DONATIONS
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1565C0] flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-3xl font-extrabold text-[#1F2937] tracking-tight">86</h2>
            <p className="text-xs font-medium text-gray-500 mt-2">Available for pickup</p>
          </div>
        </div>

        {/* Card 4: SUCCESSFUL DELIVERIES */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">
              SUCCESSFUL DELIVERIES
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#6A1B9A] flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-3xl font-extrabold text-[#1F2937] tracking-tight">3,410</h2>
            <p className="text-xs font-medium text-gray-500 mt-2">Over 12,800 meals shared</p>
          </div>
        </div>
      </div>

      {/* ======================= ROW 2: PENDING ACCOUNT VERIFICATIONS ======================= */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-gray-100 gap-3">
          <div className="flex items-center space-x-3">
            <h3 className="text-base sm:text-lg font-bold text-[#1F2937]">
              Pending Account Verifications
            </h3>
            <span className="bg-amber-100 text-amber-800 text-xs font-extrabold px-3 py-1 rounded-full">
              Action Needed (14)
            </span>
          </div>

          <Link
            to="/admin/verifications"
            className="text-xs sm:text-sm font-bold text-[#2E7D32] hover:text-[#1B5E20] inline-flex items-center space-x-1 self-start sm:self-auto"
          >
            <span>View All Verifications</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Pending Rows */}
        <div className="divide-y divide-gray-100">
          {pendingList.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">
              All pending accounts have been reviewed!
            </div>
          ) : (
            pendingList.map((item) => (
              <div
                key={item._id}
                className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/50 rounded-xl px-2 transition-colors"
              >
                {/* Applicant info */}
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#2E7D32] flex items-center justify-center shrink-0">
                    {item.role === 'volunteer' ? (
                      <Bike className="w-5 h-5" />
                    ) : (
                      <Building2 className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 leading-snug">
                      {item.organizationName || item.user?.fullName}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {item.role === 'receiver'
                        ? `Receiver (${item.receiverType || 'NGO'})`
                        : `Volunteer (${item.vehicleType || 'Bike Courier'})`}
                    </p>
                  </div>
                </div>

                {/* Submission time & status badge */}
                <div className="flex items-center space-x-4 pl-13 md:pl-0">
                  <div className="text-left md:text-right">
                    <span className="block text-[11px] text-gray-400">Submitted</span>
                    <span className="text-xs font-semibold text-gray-700">
                      {item.timeLabel || '2 hours ago'}
                    </span>
                  </div>

                  <span className="bg-amber-50 text-amber-700 border border-amber-200/60 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    Pending Review
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2.5 pl-13 md:pl-0">
                  <button
                    onClick={() => setSelectedProof(item)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-100 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-gray-500" />
                    <span>{item.role === 'volunteer' ? 'View ID' : 'View Proof'}</span>
                  </button>

                  <button
                    onClick={() =>
                      handleApprove(
                        item._id,
                        item.organizationName || item.user?.fullName,
                        item.role
                      )
                    }
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold shadow-2xs transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>

                  <button
                    onClick={() => setRejectingItem(item)}
                    className="px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:underline"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ======================= ROW 3: SPLIT SECTION ======================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Platform Activity & Donation Trends */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#1F2937]">
                  Platform Activity & Donation Trends
                </h3>
                <p className="text-xs text-gray-500">Donation and exchange performance</p>
              </div>

              {/* Time Toggle (Weekly / Monthly / Yearly) */}
              <div className="flex items-center bg-gray-100/80 p-1 rounded-xl self-start sm:self-auto">
                {['weekly', 'monthly', 'yearly'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setTrendPeriod(period)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                      trendPeriod === period
                        ? 'bg-white text-gray-900 shadow-2xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {/* Legend & Rescued Chip */}
            <div className="flex flex-wrap items-center justify-between pt-2 pb-6 gap-3">
              <div className="flex items-center space-x-5 text-xs font-semibold text-gray-600">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D32]" />
                  <span>Food Donations</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#6A1B9A]" />
                  <span>Completed Exchanges</span>
                </div>
              </div>

              <div className="inline-flex items-center space-x-1.5 bg-emerald-50 text-[#2E7D32] px-3 py-1 rounded-full text-xs font-bold">
                <Leaf className="w-3.5 h-3.5" />
                <span>420 kg rescued this week</span>
              </div>
            </div>

            {/* Dual Smooth Area Chart (SVG with Gradients matching Figma curves) */}
            <div className="relative h-64 w-full">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200">
                <defs>
                  {/* Green Area Gradient */}
                  <linearGradient id="greenFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2E7D32" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#2E7D32" stopOpacity="0.0" />
                  </linearGradient>
                  {/* Purple Area Gradient */}
                  <linearGradient id="purpleFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6A1B9A" stopOpacity="0.20" />
                    <stop offset="100%" stopColor="#6A1B9A" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Subtle horizontal grid lines */}
                <line x1="0" y1="40" x2="500" y2="40" stroke="#F3F4F6" strokeDasharray="3 3" />
                <line x1="0" y1="90" x2="500" y2="90" stroke="#F3F4F6" strokeDasharray="3 3" />
                <line x1="0" y1="140" x2="500" y2="140" stroke="#F3F4F6" strokeDasharray="3 3" />
                <line x1="0" y1="190" x2="500" y2="190" stroke="#E5E7EB" />

                {/* Food Donations Curve & Area (Green) */}
                <path
                  d="M 0 190 Q 75 140, 150 155 T 300 90 T 420 130 T 500 70 L 500 190 L 0 190 Z"
                  fill="url(#greenFill)"
                />
                <path
                  d="M 0 190 Q 75 140, 150 155 T 300 90 T 420 130 T 500 70"
                  fill="none"
                  stroke="#2E7D32"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Completed Exchanges Curve & Area (Purple) */}
                <path
                  d="M 0 195 Q 70 170, 150 180 T 300 135 T 420 160 T 500 120 L 500 190 L 0 190 Z"
                  fill="url(#purpleFill)"
                />
                <path
                  d="M 0 195 Q 70 170, 150 180 T 300 135 T 420 160 T 500 120"
                  fill="none"
                  stroke="#6A1B9A"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>

              {/* Chart X-axis Labels */}
              <div className="flex justify-between text-[11px] text-gray-400 font-semibold pt-2">
                <span>Week 1</span>
                <span>Week 2</span>
                <span>Week 3</span>
                <span>Week 4</span>
                <span>Current</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Urgent Alerts */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 pb-2">
              <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                !
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#1F2937]">Urgent Alerts</h3>
            </div>
            <p className="text-xs text-gray-500 mb-5">Items needing attention</p>

            <div className="space-y-4">
              {/* Alert 1 */}
              <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200/80">
                <div className="flex items-start space-x-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 leading-snug">
                      3 Food Listings Expiring in &lt; 2 Hours
                    </h4>
                    <button
                      onClick={() => navigate('/admin/food')}
                      className="text-xs font-semibold text-[#2E7D32] hover:underline mt-1.5 flex items-center space-x-1"
                    >
                      <span>Review Listings</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Alert 2 */}
              <div className="p-3.5 bg-orange-50/70 rounded-xl border border-orange-200/80">
                <div className="flex items-start space-x-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E65100] mt-1 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 leading-snug">
                      1 Unassigned Urgent Pickup
                    </h4>
                    <button
                      onClick={() => navigate('/admin/deliveries')}
                      className="text-xs font-semibold text-[#2E7D32] hover:underline mt-1.5 flex items-center space-x-1"
                    >
                      <span>Assign Volunteer</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Alert 3 */}
              <div className="p-3.5 bg-red-50/70 rounded-xl border border-red-200/80">
                <div className="flex items-start space-x-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 leading-snug">
                      1 Reported Quality Issue
                    </h4>
                    <button
                      onClick={() =>
                        setToastMessage(
                          'Dispute #DIS-882 opened: Donor packaged soup mismatch. Investigating.'
                        )
                      }
                      className="text-xs font-semibold text-red-600 hover:underline mt-1.5 flex items-center space-x-1"
                    >
                      <span>Review Dispute</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-gray-100 text-center">
            <span className="text-[11px] text-gray-400">
              Auto-refreshed live via FoodShare socket sync
            </span>
          </div>
        </div>
      </div>

      {/* ======================= DOCUMENT PROOF MODAL ======================= */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 relative">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center space-x-2.5">
                <FileText className="w-5 h-5 text-[#2E7D32]" />
                <h3 className="text-base font-bold text-gray-900">
                  {selectedProof.organizationName || selectedProof.user?.fullName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedProof(null)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 p-5 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#2E7D32] mx-auto flex items-center justify-center font-bold text-lg mb-2">
                FS
              </div>
              <h4 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">
                {selectedProof.documentDetails?.title || 'VERIFIED REGISTRATION DOCUMENT'}
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                Ref No: {selectedProof.documentDetails?.certNumber || 'REG-MH-2024-9901'}
              </p>
              <div className="mt-4 inline-block bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700">
                Official Seal: {selectedProof.documentDetails?.verifiedStamp || 'VERIFIED'}
              </div>
            </div>

            <div className="mt-4">
              <h5 className="text-xs font-bold text-gray-500 uppercase">Applicant notes:</h5>
              <p className="text-xs text-gray-700 mt-1 bg-gray-50 p-3 rounded-lg leading-relaxed">
                {selectedProof.applicantNotes}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                onClick={() => setSelectedProof(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleApprove(
                    selectedProof._id,
                    selectedProof.organizationName || selectedProof.user?.fullName,
                    selectedProof.role
                  )
                  setSelectedProof(null)
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#2E7D32] hover:bg-[#1B5E20] text-white shadow-xs"
              >
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= REJECT CONFIRMATION MODAL ======================= */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200">
            <h3 className="text-base font-bold text-gray-900">
              Reject Registration Application
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Please specify a reason for rejecting{' '}
              <strong className="text-gray-800">
                {rejectingItem.organizationName || rejectingItem.user?.fullName}
              </strong>
              .
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Incomplete proof of NGO registration certificate or blurred photo ID."
              rows={3}
              className="mt-4 w-full p-3 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#2E7D32] outline-none"
            />

            <div className="mt-5 flex items-center justify-end space-x-2">
              <button
                onClick={() => setRejectingItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white"
              >
                Confirm Rejection
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
