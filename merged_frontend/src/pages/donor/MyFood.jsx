import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  MapPin,
  Calendar,
  Clock,
  Eye,
  Edit2,
  Trash2,
  Users,
  AlertCircle,
  X,
  Check,
  Search,
  Filter,
} from 'lucide-react'
import donorService from '../../services/donorService'
import { getFoodImageUrl, handleImageError } from '../../utils/imageHelper'
import { getExpiryCountdown } from '../../utils/dateHelper'

const CATEGORIES = [
  'All Categories',
  'Cooked Meal',
  'Bakery',
  'Fresh Produce',
  'Dairy & Eggs',
  'Packaged & Canned',
  'Beverages',
  'Other',
]

export default function MyFood() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')
  const [donations, setDonations] = useState([])
  const [counts, setCounts] = useState({ all: 0, available: 0, requested: 0, claimed: 0, completed: 0 })
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [editFormData, setEditFormData] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All Categories')

  const loadDonations = async (tab = activeTab) => {
    try {
      setLoading(true)
      const res = await donorService.getDonations(tab)
      if (res.data) {
        setDonations(res.data.donations || [])
        if (res.data.counts) setCounts(res.data.counts)
      }
    } catch (err) {
      console.error('Failed to load donations:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDonations(activeTab)
  }, [activeTab])

  const handleDelete = async (id) => {
    try {
      await donorService.deleteDonation(id)
      setDeleteConfirmId(null)
      loadDonations(activeTab)
    } catch (err) {
      alert(err.message || 'Failed to delete donation.')
    }
  }

  const handleEditOpen = (item) => {
    setEditingItem(item)
    setEditFormData({
      title: item.title,
      quantity: item.quantity,
      pickupWindow: item.pickupWindow,
      status: item.status,
    })
  }

  const handleEditSave = async (e) => {
    e.preventDefault()
    try {
      await donorService.updateDonation(editingItem._id, editFormData)
      setEditingItem(null)
      loadDonations(activeTab)
    } catch (err) {
      alert(err.message || 'Failed to update donation.')
    }
  }

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'available':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Available
          </span>
        )
      case 'requested':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Requested
          </span>
        )
      case 'claimed':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Claimed
          </span>
        )
      case 'completed':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            Completed
          </span>
        )
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
            {status}
          </span>
        )
    }
  }

  const tabs = [
    { key: 'all', label: `All (${counts.all || donations.length})` },
    { key: 'available', label: 'Available' },
    { key: 'requested', label: 'Requested' },
    { key: 'claimed', label: 'Claimed' },
    { key: 'completed', label: 'Completed' },
  ]

  const filteredDonations = donations.filter((item) => {
    const term = searchTerm.toLowerCase().trim()
    const matchesSearch =
      !term ||
      item.title?.toLowerCase().includes(term) ||
      item.category?.toLowerCase().includes(term) ||
      item.pickupAddress?.toLowerCase().includes(term) ||
      item.description?.toLowerCase().includes(term)

    const matchesCategory =
      categoryFilter === 'All Categories' || item.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      {/* Header (Page 4 in PDF) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">My Food</h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Manage your food donations and track listings in real time.
          </p>
        </div>
        <button
          onClick={() => navigate('/donor/add-food')}
          className="flex items-center gap-2 bg-[#2E7D32] hover:bg-[#256428] text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Food</span>
        </button>
      </div>

      {/* Search and Category Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search food by title, category, or address..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] outline-hidden bg-gray-50/50 focus:bg-white transition-all placeholder:text-gray-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-md cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <Filter className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-8 pr-8 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:border-gray-300 focus:border-[#2E7D32] outline-hidden cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {(searchTerm || categoryFilter !== 'All Categories') && (
            <button
              onClick={() => {
                setSearchTerm('')
                setCategoryFilter('All Categories')
              }}
              className="text-xs font-semibold text-gray-500 hover:text-emerald-700 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors whitespace-nowrap cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs (Page 4 in PDF) */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-1 gap-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#2E7D32] text-white shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {(searchTerm || categoryFilter !== 'All Categories') && (
          <span className="text-xs font-medium text-gray-500 hidden sm:inline whitespace-nowrap">
            Showing <strong className="text-gray-900">{filteredDonations.length}</strong> of {donations.length} items
          </span>
        )}
      </div>

      {/* Food Listings */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : donations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#2E7D32] flex items-center justify-center mx-auto mb-3">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No food listings found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            You don't have any donations in this category right now.
          </p>
          <button
            onClick={() => navigate('/donor/add-food')}
            className="mt-4 px-4 py-2 bg-[#2E7D32] text-white text-xs font-semibold rounded-xl hover:bg-[#256428] transition-colors cursor-pointer"
          >
            Post a Donation
          </button>
        </div>
      ) : filteredDonations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No matching food items</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            No listings found matching "{searchTerm}" {categoryFilter !== 'All Categories' ? `in ${categoryFilter}` : ''}.
          </p>
          <button
            onClick={() => {
              setSearchTerm('')
              setCategoryFilter('All Categories')
            }}
            className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDonations.map((item) => {
            const expiry = getExpiryCountdown(item.bestBefore)

            return (
              <div
                key={item._id}
                className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                {/* Left: Thumbnail & Details */}
                <div className="flex items-start sm:items-center gap-4 min-w-0">
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                    <img
                      src={getFoodImageUrl(item.imageUrl, item.category)}
                      alt={item.title}
                      onError={(e) => handleImageError(e, item.category)}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] font-semibold text-white">
                      {item.category}
                    </span>
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-gray-900 truncate">{item.title}</h3>
                      <span className="md:hidden">{getStatusBadge(item.status)}</span>
                      {expiry && (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] border font-semibold ${expiry.badgeClass}`}
                          title={`Expires: ${new Date(item.bestBefore).toLocaleString()}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${expiry.dotClass}`} />
                          <span>{expiry.label}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-[#2E7D32]">
                      {item.quantity} {item.unit}
                    </p>

                    <p className="text-xs text-gray-500 flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{item.pickupAddress}</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-400 pt-1">
                      <span>
                        Expires:{' '}
                        {new Date(item.bestBefore).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span>•</span>
                      <span>
                        Created:{' '}
                        {new Date(item.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                  {item.interestedCount > 0 && (
                    <div className="pt-1">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60">
                        <Users className="w-3 h-3" />
                        <span>{item.interestedCount} interested receivers</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Status badge & Actions */}
              <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100 shrink-0">
                <div className="hidden md:block">{getStatusBadge(item.status)}</div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/donor/food/${item._id}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Details</span>
                  </button>

                  <button
                    onClick={() => handleEditOpen(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => setDeleteConfirmId(item._id)}
                    className="p-1.5 rounded-xl border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
                    title="Remove Listing"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-gray-900">Delete Food Donation?</h3>
            <p className="text-xs text-gray-500">
              Are you sure you want to remove this listing? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Donation Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Edit Donation</h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleEditSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Food Title
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.title}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-[#2E7D32] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={editFormData.quantity}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, quantity: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-[#2E7D32] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Pickup Window
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.pickupWindow}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, pickupWindow: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-[#2E7D32] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={editFormData.status}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, status: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-[#2E7D32] outline-hidden bg-white"
                >
                  <option value="available">Available</option>
                  <option value="requested">Requested</option>
                  <option value="claimed">Claimed</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#256428] text-white text-xs font-semibold shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
