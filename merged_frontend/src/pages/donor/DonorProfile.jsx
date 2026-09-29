import { useState, useEffect } from 'react'
import {
  User,
  Shield,
  Bell,
  Camera,
  Edit3,
  Check,
  Lock,
  Mail,
  Phone,
  Building,
  MapPin,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import donorService from '../../services/donorService'

export default function DonorProfile() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('info') // 'info' | 'security' | 'notifications'
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Form State
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [pickupAddress, setPickupAddress] = useState('')
  const [about, setAbout] = useState('')

  useEffect(() => {
    let isMounted = true
    const loadProfile = async () => {
      try {
        setLoading(true)
        const res = await donorService.getProfile()
        if (isMounted && res.data) {
          const u = res.data.user || user
          const p = res.data.profile || {}
          setFullName(u?.fullName || 'Maria Chen')
          setEmail(u?.email || 'maria.chen@email.com')
          setPhone(u?.phone || '+1 (415) 555-0192')
          setOrganizationName(p?.organizationName || 'Green Community Collective')
          setPickupAddress(p?.pickupAddress || '742 Evergreen Terrace, San Francisco, CA 94102')
          setAbout(
            p?.about ||
              'Home cook and community volunteer. I love sharing surplus food from my weekend cooking sessions and garden harvest with neighbors in need.'
          )
        }
      } catch (err) {
        console.error('Failed to load profile:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadProfile()
    return () => {
      isMounted = false
    }
  }, [user])

  const handleSave = async (e) => {
    e.preventDefault()
    setSuccessMsg('')
    setErrorMsg('')
    setSaving(true)

    try {
      await donorService.updateProfile({
        fullName,
        phone,
        organizationName,
        pickupAddress,
        about,
      })
      setSuccessMsg('Profile updated successfully!')
      setIsEditing(false)
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const initials = (fullName || 'MC')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  const tabs = [
    { key: 'info', label: 'Profile Info', icon: User },
    { key: 'security', label: 'Security', icon: Shield },
    { key: 'notifications', label: 'Notifications', icon: Bell },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header (Page 11 in PDF) */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Profile</h1>
        <p className="text-xs text-gray-500 font-medium mt-0.5">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Tabs (Page 11 in PDF) */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                isActive
                  ? 'bg-[#2E7D32] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2E7D32]" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TAB 1: Profile Info */}
      {activeTab === 'info' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-xs space-y-8">
          {/* Top user chip & photo (Page 11 in PDF) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#1F2937] text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
                {initials}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{fullName}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Donor • Member since Oct 2025
                </p>
                <button
                  type="button"
                  onClick={() => alert('Photo upload dialog: Choose JPG, PNG or WEBP.')}
                  className="mt-2 text-xs font-semibold text-[#2E7D32] hover:text-[#256428] flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Upload Photo</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#256428] text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
            </button>
          </div>

          {/* Profile Form (Page 11 in PDF) */}
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  disabled={!isEditing}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-hidden transition-all ${
                    isEditing
                      ? 'border-gray-200 focus:border-[#2E7D32] bg-white'
                      : 'border-transparent bg-gray-50 text-gray-700'
                  }`}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full px-4 py-2.5 rounded-xl border border-transparent bg-gray-50 text-gray-500 text-xs cursor-not-allowed"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] text-gray-400 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Verified</span>
                  </span>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Phone
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-hidden transition-all ${
                    isEditing
                      ? 'border-gray-200 focus:border-[#2E7D32] bg-white'
                      : 'border-transparent bg-gray-50 text-gray-700'
                  }`}
                />
              </div>

              {/* Organization Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Organization Name
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Individual or Organization name"
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-hidden transition-all ${
                    isEditing
                      ? 'border-gray-200 focus:border-[#2E7D32] bg-white'
                      : 'border-transparent bg-gray-50 text-gray-700'
                  }`}
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Pickup Address
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  disabled={!isEditing}
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs outline-hidden transition-all ${
                    isEditing
                      ? 'border-gray-200 focus:border-[#2E7D32] bg-white'
                      : 'border-transparent bg-gray-50 text-gray-700'
                  }`}
                />
              </div>
            </div>

            {/* About / Bio */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                About
              </label>
              <textarea
                rows={3}
                disabled={!isEditing}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-hidden transition-all resize-none ${
                  isEditing
                    ? 'border-gray-200 focus:border-[#2E7D32] bg-white'
                    : 'border-transparent bg-gray-50 text-gray-700'
                }`}
              />
            </div>

            {isEditing && (
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#256428] text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* TAB 2: Security */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Account Security</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Update password and review session controls.
            </p>
          </div>

          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-[#2E7D32] outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-[#2E7D32] outline-hidden"
              />
            </div>

            <button
              onClick={() => alert('Password update request sent.')}
              className="px-4 py-2 rounded-xl bg-[#2E7D32] text-white text-xs font-semibold hover:bg-[#256428] transition-colors"
            >
              Update Password
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: Notifications */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Notification Preferences</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Choose what notifications you receive about requests and couriers.
            </p>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50 cursor-pointer">
              <div>
                <p className="text-xs font-bold text-gray-900">New Food Requests</p>
                <p className="text-[11px] text-gray-500">
                  Notify when a receiver requests surplus food from your listings
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 text-[#2E7D32] rounded-sm focus:ring-[#2E7D32]"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50 cursor-pointer">
              <div>
                <p className="text-xs font-bold text-gray-900">
                  Volunteer Courier Updates
                </p>
                <p className="text-[11px] text-gray-500">
                  Notify when a volunteer courier accepts, arrives, or picks up food
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 text-[#2E7D32] rounded-sm focus:ring-[#2E7D32]"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50 cursor-pointer">
              <div>
                <p className="text-xs font-bold text-gray-900">Exchange Completed</p>
                <p className="text-[11px] text-gray-500">
                  Receive a recap when meals are confirmed delivered to the receiver
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 text-[#2E7D32] rounded-sm focus:ring-[#2E7D32]"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  )
}
