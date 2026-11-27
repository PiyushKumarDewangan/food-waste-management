import { useState, useEffect } from 'react'
import {
  Users,
  Search,
  Download,
  MoreVertical,
  Check,
  X,
  Edit2,
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  UserCheck,
} from 'lucide-react'
import { adminService, MOCK_USERS } from '../../services/adminService'

export default function AdminUsers() {
  const [usersList, setUsersList] = useState(MOCK_USERS)
  const [counts, setCounts] = useState({ total: 0, donors: 0, receivers: 0, volunteers: 0, suspended: 0 })
  const [roleFilter, setRoleFilter] = useState('all') // 'all' | 'donor' | 'receiver' | 'volunteer'
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'active' | 'suspended'
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [editingUser, setEditingUser] = useState(null)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editCity, setEditCity] = useState('')
  const [editStatus, setEditStatus] = useState('Active')
  const [editNotes, setEditNotes] = useState('')
  const [toastMessage, setToastMessage] = useState(null)
  const [activeMenuId, setActiveMenuId] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await adminService.getUsers({
        role: roleFilter,
        status: statusFilter,
        search: searchQuery
      })
      if (data) {
        if (Array.isArray(data.users)) {
          setUsersList(data.users)
        }
        if (data.counts) {
          setCounts(data.counts)
        }
      }
    } catch (err) {
      console.warn('Failed to load users:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [roleFilter, statusFilter, searchQuery])

  // Filter users
  const filteredUsers = usersList.filter((u) => {
    if (roleFilter !== 'all' && u.role.toLowerCase() !== roleFilter.toLowerCase()) return false
    if (statusFilter !== 'all' && u.status.toLowerCase() !== statusFilter.toLowerCase()) return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return (
        u.name.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.city && u.city.toLowerCase().includes(q)) ||
        (u.phone && u.phone.toLowerCase().includes(q))
      )
    }
    return true
  })

  // Export CSV functionality
  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Role', 'City', 'Impact Activity', 'Status', 'Joined Date']
    const rows = filteredUsers.map((u) => [
      u.id,
      `"${u.name}"`,
      u.email,
      u.role,
      `"${u.city}"`,
      `"${u.impactActivity}"`,
      u.status,
      u.joinedDate,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `foodshare_users_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setToastMessage('✓ Users list exported as CSV successfully!')
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Toggle user suspension
  const handleToggleStatus = async (user) => {
    const nextStatus = user.status.toLowerCase() === 'active' ? 'suspended' : 'active'
    try {
      await adminService.toggleUserStatus(user.id, nextStatus)
      setToastMessage(`✓ ${user.name} status updated to ${nextStatus === 'active' ? 'Active' : 'Suspended'}`)
      loadUsers()
    } catch (err) {
      setToastMessage(`Failed to update status: ${err.message}`)
    }
    setActiveMenuId(null)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Open Edit modal
  const openEditModal = (user) => {
    setEditingUser(user)
    setEditName(user.name || '')
    setEditPhone(user.phone || '')
    setEditCity(user.city || '')
    setEditStatus(user.status || 'Active')
    setEditNotes('')
  }

  // Save Edit modal
  const handleSaveEdit = async () => {
    if (!editingUser) return
    try {
      if (editingUser.status !== editStatus) {
        await adminService.toggleUserStatus(editingUser.id, editStatus.toLowerCase())
      }
      await adminService.updateUserDetails(editingUser.id, {
        fullName: editName,
        phone: editPhone,
        city: editCity
      })
      setToastMessage(`✓ Account settings for ${editName} saved!`)
      loadUsers()
    } catch (err) {
      setToastMessage(`Failed to update user: ${err.message}`)
    }
    setEditingUser(null)
    setTimeout(() => setToastMessage(null), 3000)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ======================= HEADER ======================= */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#1F2937] tracking-tight">
          User Management
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          View and manage all registered donors, receivers, and volunteers
        </p>
      </div>

      {/* ======================= SUMMARY STATS STRIP ======================= */}
      <div className="flex flex-wrap items-center gap-6 sm:gap-10 pt-1 pb-2">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D32]" />
          <span className="text-xs text-gray-600 font-medium">Total Donors</span>
          <span className="text-sm font-bold text-gray-900 ml-1">{counts.donors || 0}</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1565C0]" />
          <span className="text-xs text-gray-600 font-medium">Total Receivers</span>
          <span className="text-sm font-bold text-gray-900 ml-1">{counts.receivers || 0}</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFB74D]" />
          <span className="text-xs text-gray-600 font-medium">Total Volunteers</span>
          <span className="text-sm font-bold text-gray-900 ml-1">{counts.volunteers || 0}</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-xs text-gray-600 font-medium">Suspended / Flagged</span>
          <span className="text-sm font-bold text-gray-900 ml-1">{counts.suspended || 0}</span>
        </div>
      </div>

      {/* ======================= FILTER TABS & SEARCH ROW ======================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
        {/* Role Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              roleFilter === 'all'
                ? 'bg-[#2E7D32] text-white shadow-sm shadow-emerald-800/15'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            All Users ({counts.total || usersList.length})
          </button>
          <button
            onClick={() => setRoleFilter('donor')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              roleFilter === 'donor'
                ? 'bg-[#2E7D32] text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Donors ({counts.donors || 0})
          </button>
          <button
            onClick={() => setRoleFilter('receiver')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              roleFilter === 'receiver'
                ? 'bg-[#2E7D32] text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Receivers ({counts.receivers || 0})
          </button>
          <button
            onClick={() => setRoleFilter('volunteer')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              roleFilter === 'volunteer'
                ? 'bg-[#2E7D32] text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Volunteers ({counts.volunteers || 0})
          </button>
        </div>

        {/* Right Search, Status Filter & Export */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user by name, email, phone..."
              className="w-full pl-9 pr-3 py-1.5 bg-white rounded-xl border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
            />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-200 text-xs font-semibold text-gray-700 py-1.5 pl-3 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ======================= USERS TABLE ======================= */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold text-gray-400 tracking-wider uppercase">
                <th className="py-3.5 px-5">USER</th>
                <th className="py-3.5 px-4">ROLE</th>
                <th className="py-3.5 px-4">CITY / AREA</th>
                <th className="py-3.5 px-4">IMPACT ACTIVITY</th>
                <th className="py-3.5 px-4">STATUS</th>
                <th className="py-3.5 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/70 transition-colors">
                    {/* User column */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100/70 text-[#2E7D32] font-extrabold flex items-center justify-center text-xs shrink-0">
                          {user.initials}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 leading-tight">{user.name}</p>
                          <p className="text-[11px] text-gray-400 font-medium">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role column */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-semibold ${
                          user.role === 'Donor'
                            ? 'text-[#2E7D32]'
                            : user.role === 'Receiver'
                            ? 'text-[#1565C0]'
                            : 'text-[#E65100]'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>

                    {/* City column */}
                    <td className="py-3.5 px-4 font-medium text-gray-700">{user.city}</td>

                    {/* Impact activity column */}
                    <td className="py-3.5 px-4 font-bold text-gray-900">{user.impactActivity}</td>

                    {/* Status column */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-bold ${
                          user.status === 'Active' ? 'text-[#2E7D32]' : 'text-red-500'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>

                    {/* Actions column */}
                    <td className="py-3.5 px-4 text-right relative">
                      <div className="inline-flex items-center space-x-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="text-[#2E7D32] hover:underline font-semibold text-xs"
                        >
                          Edit
                        </button>

                        <div className="relative">
                          <button
                            onClick={() =>
                              setActiveMenuId(activeMenuId === user.id ? null : user.id)
                            }
                            className="p-1 rounded-md text-gray-400 hover:text-gray-700"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeMenuId === user.id && (
                            <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-30 text-left">
                              <button
                                onClick={() => handleToggleStatus(user)}
                                className="w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                              >
                                {user.status === 'Active' ? (
                                  <>
                                    <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                                    <span>Suspend User</span>
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-3.5 h-3.5 text-[#2E7D32]" />
                                    <span>Activate User</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setActiveMenuId(null)
                                  setToastMessage(`Password reset link sent to ${user.email}`)
                                  setTimeout(() => setToastMessage(null), 3000)
                                }}
                                className="w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                              >
                                <span>Reset Password</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ======================= PAGINATION FOOTER ======================= */}
        <div className="px-5 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <span>Showing 1-6 of 1,248 users</span>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setCurrentPage(1)}
              className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center transition-colors ${
                currentPage === 1
                  ? 'bg-[#2E7D32] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              1
            </button>
            <button
              onClick={() => setCurrentPage(2)}
              className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center transition-colors ${
                currentPage === 2
                  ? 'bg-[#2E7D32] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              2
            </button>
            <button
              onClick={() => setCurrentPage(3)}
              className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center transition-colors ${
                currentPage === 3
                  ? 'bg-[#2E7D32] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              3
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, 3))}
              className="w-7 h-7 rounded-lg text-gray-600 hover:bg-gray-100 flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ======================= EDIT USER MODAL ======================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                Edit User Account
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-gray-500">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 w-full p-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-[#2E7D32] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500">Email Address (Read-only)</label>
                <p className="text-xs font-medium text-gray-500 mt-0.5 bg-gray-50 p-2 rounded-lg border border-gray-100">{editingUser.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500">Phone</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+91..."
                    className="mt-1 w-full p-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-[#2E7D32] outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">City / Area</label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    placeholder="e.g. Mumbai, MH"
                    className="mt-1 w-full p-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-[#2E7D32] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500">Account Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="mt-1 w-full p-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-[#2E7D32] outline-none cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500">Admin Audit Notes</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Reason for status change or internal notes..."
                  rows={2}
                  className="mt-1 w-full p-2.5 rounded-xl border border-gray-200 text-xs text-gray-800 focus:ring-2 focus:ring-[#2E7D32] outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-2">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#2E7D32] hover:bg-[#1B5E20] text-white shadow-2xs"
              >
                Save Changes
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
