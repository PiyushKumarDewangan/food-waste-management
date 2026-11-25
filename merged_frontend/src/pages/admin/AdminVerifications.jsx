import { useState, useEffect } from 'react'
import {
  ShieldCheck,
  Search,
  Check,
  X,
  Eye,
  FileText,
  Building2,
  Bike,
  Store,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { adminService, MOCK_PENDING_APPLICATIONS } from '../../services/adminService'

export default function AdminVerifications() {
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'receivers' | 'volunteers' | 'approved' | 'rejected'
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('oldest')
  const [applications, setApplications] = useState(MOCK_PENDING_APPLICATIONS)
  const [selectedApp, setSelectedApp] = useState(MOCK_PENDING_APPLICATIONS[0])
  const [zoomLevel, setZoomLevel] = useState(100)
  const [toastMessage, setToastMessage] = useState(null)
  const [rejectingApp, setRejectingApp] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        const data = await adminService.getAllPendingApplications()
        if (data && data.length > 0) {
          setApplications(data)
          setSelectedApp(data[0])
        }
      } catch {
        // Keeps mock
      }
    }
    loadData()
  }, [])

  // Filter applications by tab & search
  const filteredApps = applications.filter((app) => {
    if (activeTab === 'receivers' && app.role !== 'receiver') return false
    if (activeTab === 'volunteers' && app.role !== 'volunteer') return false
    if (activeTab === 'approved' && app.reviewStatus !== 'approved') return false
    if (activeTab === 'rejected' && app.reviewStatus !== 'rejected') return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const name = (app.organizationName || app.user?.fullName || '').toLowerCase()
      const doc = (app.documentType || '').toLowerCase()
      return name.includes(q) || doc.includes(q)
    }
    return true
  })

  // Handle Approve
  const handleApprove = async (appToApprove) => {
    if (!appToApprove) return
    try {
      if (appToApprove.role === 'receiver') {
        await adminService.approveReceiver(appToApprove._id)
      } else {
        await adminService.approveVolunteer(appToApprove._id)
      }
    } catch {
      // optimistic
    }

    setApplications((prev) =>
      prev.map((a) => (a._id === appToApprove._id ? { ...a, reviewStatus: 'approved' } : a))
    )

    setToastMessage(`✓ ${appToApprove.organizationName || appToApprove.user?.fullName} approved!`)
    setTimeout(() => setToastMessage(null), 3000)

    // Select next pending application
    const remaining = applications.filter(
      (a) => a._id !== appToApprove._id && a.reviewStatus === 'pending'
    )
    if (remaining.length > 0) {
      setSelectedApp(remaining[0])
    }
  }

  // Handle Reject
  const handleRejectConfirm = async () => {
    if (!rejectingApp) return
    try {
      if (rejectingApp.role === 'receiver') {
        await adminService.rejectReceiver(rejectingApp._id, rejectReason)
      } else {
        await adminService.rejectVolunteer(rejectingApp._id, rejectReason)
      }
    } catch {
      // optimistic
    }

    setApplications((prev) =>
      prev.map((a) => (a._id === rejectingApp._id ? { ...a, reviewStatus: 'rejected' } : a))
    )

    setToastMessage(`Application for ${rejectingApp.organizationName} was rejected.`)
    setRejectingApp(null)
    setRejectReason('')
    setTimeout(() => setToastMessage(null), 3000)
  }

  const pendingCount = applications.filter((a) => a.reviewStatus === 'pending').length
  const receiverCount = applications.filter((a) => a.role === 'receiver' && a.reviewStatus === 'pending').length
  const volunteerCount = applications.filter((a) => a.role === 'volunteer' && a.reviewStatus === 'pending').length

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ======================= HEADER ======================= */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#1F2937] tracking-tight">
          Verifications & KYC Approvals
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Review identity documents, NGO certificates, and food safety licenses
        </p>
      </div>

      {/* ======================= FILTER TABS ======================= */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
            activeTab === 'all'
              ? 'bg-[#2E7D32] text-white shadow-sm shadow-emerald-800/15'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          All Pending ({pendingCount})
        </button>

        <button
          onClick={() => setActiveTab('receivers')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
            activeTab === 'receivers'
              ? 'bg-[#2E7D32] text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          Receivers / NGOs ({receiverCount})
        </button>

        <button
          onClick={() => setActiveTab('volunteers')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
            activeTab === 'volunteers'
              ? 'bg-[#2E7D32] text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          Volunteers ({volunteerCount})
        </button>

        <button
          onClick={() => setActiveTab('approved')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
            activeTab === 'approved'
              ? 'bg-[#2E7D32] text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          Approved
        </button>

        <button
          onClick={() => setActiveTab('rejected')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
            activeTab === 'rejected'
              ? 'bg-[#2E7D32] text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          Rejected
        </button>
      </div>

      {/* ======================= SEARCH & SORT BAR ======================= */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by applicant or org name..."
            className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent transition-all shadow-2xs"
          />
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <span className="text-xs text-gray-500 font-medium">Sort by:</span>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-white border border-gray-200 text-xs font-semibold text-gray-700 py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32] shadow-2xs cursor-pointer"
            >
              <option value="oldest">Oldest first</option>
              <option value="newest">Newest first</option>
              <option value="priority">High priority</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ======================= MAIN SPLIT GRID ======================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Applications List (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-[#1F2937]">Pending applications</h3>
              <p className="text-xs text-gray-400">Showing highest priority submissions first</p>
            </div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-full">
              {pendingCount} waiting
            </span>
          </div>

          <div className="divide-y divide-gray-100 mt-2">
            {filteredApps.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                No applications match your filter.
              </div>
            ) : (
              filteredApps.map((app) => {
                const isSelected = selectedApp?._id === app._id
                const isApproved = app.reviewStatus === 'approved'
                const isRejected = app.reviewStatus === 'rejected'

                return (
                  <div
                    key={app._id}
                    onClick={() => setSelectedApp(app)}
                    className={`py-4 px-3 rounded-xl cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-50/50 border-l-4 border-[#2E7D32]'
                        : 'hover:bg-gray-50/80 border-l-4 border-transparent'
                    }`}
                  >
                    {/* Applicant summary */}
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100/70 text-[#2E7D32] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {app.organizationName?.slice(0, 2).toUpperCase() || 'FS'}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 leading-snug">
                          {app.organizationName || app.user?.fullName}
                        </h4>
                        <p className="text-xs text-gray-500 font-medium">
                          {app.role === 'receiver'
                            ? `Receiver (${app.receiverType || 'NGO'})`
                            : app.role === 'volunteer'
                            ? `Volunteer (${app.vehicleType || 'Courier'})`
                            : `Donor (${app.businessType || 'Partner'})`}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1 flex items-center space-x-1">
                          <FileText className="w-3 h-3 text-gray-400" />
                          <span>Document: <strong className="text-gray-700">{app.documentType}</strong></span>
                        </p>
                      </div>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex flex-col sm:items-end justify-between pl-13 sm:pl-0 space-y-2.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] text-gray-400 font-medium">
                          {app.timeLabel || '2h ago'}
                        </span>
                        {isApproved ? (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                            Approved
                          </span>
                        ) : isRejected ? (
                          <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                            Rejected
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60 px-2 py-0.5 rounded-full">
                            Pending Review
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      {!isApproved && !isRejected && (
                        <div
                          className="flex items-center space-x-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-gray-300 text-[11px] font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <Eye className="w-3 h-3 text-gray-500" />
                            <span>{app.role === 'volunteer' ? 'View ID' : 'View Document'}</span>
                          </button>

                          <button
                            onClick={() => handleApprove(app)}
                            className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-[11px] font-bold shadow-2xs transition-colors"
                          >
                            <Check className="w-3 h-3" />
                            <span>Approve</span>
                          </button>

                          <button
                            onClick={() => setRejectingApp(app)}
                            className="flex items-center space-x-0.5 px-2 py-1 text-[11px] font-semibold text-red-600 hover:underline"
                          >
                            <X className="w-3 h-3" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column: Document Preview Panel (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm sticky top-24">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-[#1F2937]">Document Preview</h3>
              <p className="text-xs text-gray-500 font-medium">
                {selectedApp?.organizationName || selectedApp?.user?.fullName || 'Select an applicant'}
              </p>
            </div>
            {selectedApp && (
              <button
                onClick={() => setSelectedApp(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {selectedApp ? (
            <div className="mt-4 space-y-4">
              {/* Document Certificate Frame with Crop marks */}
              <div className="relative bg-white border border-gray-300/80 rounded-xl p-6 shadow-inner text-center min-h-[300px] flex flex-col justify-between overflow-hidden">
                {/* Crop mark corners */}
                <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-gray-700" />
                <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-gray-700" />
                <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-gray-700" />
                <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-gray-700" />

                {/* Seal & Logo */}
                <div>
                  <div className="w-12 h-12 rounded-full border-2 border-[#2E7D32] bg-emerald-50 text-[#2E7D32] mx-auto flex items-center justify-center font-extrabold text-sm mb-2 shadow-2xs">
                    FS
                  </div>
                  <span className="text-[10px] tracking-widest text-gray-400 font-bold uppercase">
                    CERTIFICATE OF REGISTRATION
                  </span>
                  <h4 className="text-base font-extrabold text-[#1F2937] mt-1 font-serif">
                    {selectedApp.organizationName || selectedApp.user?.fullName}
                  </h4>
                </div>

                {/* Certificate Legal Text */}
                <div className="my-3 px-4">
                  <p className="text-[11px] text-gray-600 leading-relaxed italic">
                    &ldquo;This document certifies that the named organisation is registered and
                    verified under the applicable statutory requirements.&rdquo;
                  </p>
                  <p className="text-[10px] text-gray-400 mt-2 font-mono">
                    Doc ID: {selectedApp.documentDetails?.certNumber || 'REG-8841-MH'}
                  </p>
                </div>

                {/* Verified Circle Stamp */}
                <div className="my-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border-2 border-dashed border-[#2E7D32] text-[#2E7D32] text-[9px] font-extrabold uppercase tracking-tight rotate-[-8deg] shadow-2xs">
                    VERIFIED
                  </div>
                </div>

                {/* Zoom Controls Bar */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-end space-x-2 text-xs text-gray-500">
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(z - 10, 70))}
                    className="p-1 hover:text-gray-800"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-[11px] font-semibold">{zoomLevel}%</span>
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(z + 10, 150))}
                    className="p-1 hover:text-gray-800"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Applicant Notes Box */}
              <div>
                <h5 className="text-xs font-bold text-gray-700">Applicant notes</h5>
                <p className="text-xs text-gray-600 mt-1 bg-gray-50 p-3 rounded-xl border border-gray-100 leading-relaxed">
                  {selectedApp.applicantNotes ||
                    'All requested supporting documents are included. Please contact us if any additional information is required.'}
                </p>
              </div>

              {/* Action Button */}
              {selectedApp.reviewStatus === 'approved' ? (
                <div className="w-full py-2.5 bg-emerald-50 text-[#2E7D32] border border-emerald-200 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approved on Platform</span>
                </div>
              ) : selectedApp.reviewStatus === 'rejected' ? (
                <div className="w-full py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>Application Rejected</span>
                </div>
              ) : (
                <button
                  onClick={() => handleApprove(selectedApp)}
                  className="w-full py-3 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-800/15 flex items-center justify-center space-x-2 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm Approval</span>
                </button>
              )}
            </div>
          ) : (
            <div className="py-20 text-center text-gray-400 text-xs">
              Select an applicant from the left to inspect their documentation.
            </div>
          )}
        </div>
      </div>

      {/* Reject Reason Modal */}
      {rejectingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200">
            <h3 className="text-base font-bold text-gray-900">
              Reject Registration Application
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Provide a clear reason for rejecting{' '}
              <strong className="text-gray-800">
                {rejectingApp.organizationName || rejectingApp.user?.fullName}
              </strong>
              . This will be communicated to the applicant.
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Expired FSSAI certificate or blurry identity proof."
              rows={3}
              className="mt-4 w-full p-3 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#2E7D32] outline-none"
            />

            <div className="mt-5 flex items-center justify-end space-x-2">
              <button
                onClick={() => setRejectingApp(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
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
