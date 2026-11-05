import { useState, useEffect, useRef } from 'react'
import {
  MapPin,
  Lock,
  Edit3,
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building,
  Utensils,
  Bell,
  Check,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import receiverService from '../../services/receiverService'
import authService from '../../services/authService'
import { getAvatarUrl } from '../../utils/imageHelper'

export default function ProfileNeeds() {
  const { user, updateUser } = useAuth()
  const fileInputRef = useRef(null)

  const [activeTab, setActiveTab] = useState('org_info') // 'org_info' | 'capacity' | 'notifications'
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [error, setError] = useState('')

  // Tab 1: Organization / Profile Form Fields (Matching Screenshot)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [dropoffAddress, setDropoffAddress] = useState('')
  const [about, setAbout] = useState('')
  const [coords, setCoords] = useState({ lat: null, lng: null })

  // Saved snapshot for Cancel functionality
  const [savedSnapshot, setSavedSnapshot] = useState({
    fullName: '',
    email: '',
    phone: '',
    organizationName: '',
    dropoffAddress: '',
    about: '',
  })

  // Pending photo upload state
  const [photoFile, setPhotoFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  // Tab 2: Capacity & Dietary Form State
  const [capacityForm, setCapacityForm] = useState({
    storageTypes: ['refrigerated', 'dry'],
    maxServingsPerPickup: 100,
    peopleServedPerDay: 150,
    preferredPickupWindows: ['Morning (09:00 - 12:00)', 'Afternoon (12:00 - 16:00)'],
    vehicleAvailable: true,
    dietaryPrefs: ['Halal', 'Vegetarian', 'Vegan', 'Gluten-Free'],
    preferredCategories: ['Cooked Meals', 'Fresh Produce', 'Bakery', 'Dairy & Eggs', 'Packaged Goods', 'Beverages & Other'],
  })

  // Tab 3: Notifications Form State
  const [notifForm, setNotifForm] = useState({
    newFoodAvailable: true,
    requestStatusUpdates: true,
    deliveryAlerts: true,
    urgentExpiryAlerts: true,
    weeklyImpactDigest: true,
    smsNotifications: false,
  })

  const loadProfile = async () => {
    try {
      setLoading(true)
      const res = await receiverService.getProfile()
      if (res.data?.profile) {
        const p = res.data.profile
        const u = res.data.user || user

        const initialFullName = p.contactPerson || u?.fullName || ''
        const initialEmail = u?.email || p.email || ''
        const initialPhone = p.phone || u?.phone || ''
        const initialOrg = p.organizationName || ''
        const initialAddress = p.dropoffAddress || p.organizationAddress || ''
        const initialAbout = p.about || 'Community organization dedicated to feeding families and reducing food waste.'

        setFullName(initialFullName)
        setEmail(initialEmail)
        setPhone(initialPhone)
        setOrganizationName(initialOrg)
        setDropoffAddress(initialAddress)
        setAbout(initialAbout)
        setCoords({ lat: p.lat ?? null, lng: p.lng ?? null })

        setSavedSnapshot({
          fullName: initialFullName,
          email: initialEmail,
          phone: initialPhone,
          organizationName: initialOrg,
          dropoffAddress: initialAddress,
          about: initialAbout,
        })

        if (p.capacity) {
          setCapacityForm((prev) => ({
            ...prev,
            storageTypes: p.capacity.storageTypes || prev.storageTypes,
            maxServingsPerPickup: p.capacity.maxServingsPerPickup || prev.maxServingsPerPickup,
            peopleServedPerDay: p.capacity.peopleServedPerDay || prev.peopleServedPerDay,
            preferredPickupWindows: p.capacity.preferredPickupWindows || prev.preferredPickupWindows,
            vehicleAvailable: p.capacity.vehicleAvailable ?? prev.vehicleAvailable,
            dietaryPrefs: p.dietaryPrefs || prev.dietaryPrefs,
            preferredCategories: p.preferredCategories || prev.preferredCategories,
          }))
        }

        if (p.notificationPrefs) {
          setNotifForm({
            newFoodAvailable: p.notificationPrefs.newFoodAvailable ?? true,
            requestStatusUpdates: p.notificationPrefs.requestStatusUpdates ?? true,
            deliveryAlerts: p.notificationPrefs.deliveryAlerts ?? true,
            urgentExpiryAlerts: p.notificationPrefs.urgentExpiryAlerts ?? true,
            weeklyImpactDigest: p.notificationPrefs.weeklyImpactDigest ?? true,
            smsNotifications: p.notificationPrefs.smsNotifications ?? false,
          })
        }
      }
    } catch (err) {
      console.error('Failed to load receiver profile:', err)
      setError('Unable to load profile data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  // Member since date
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : 'Oct 2025'

  // Photo change handler (edit mode)
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type.toLowerCase())) {
      setError('Invalid format. Please select a JPG, JPEG, PNG, or WebP image.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size too large. Maximum photo size is 5MB.')
      return
    }

    setError('')
    setPhotoFile(file)
    const objUrl = URL.createObjectURL(file)
    setPreviewUrl(objUrl)
  }

  const handleCancel = () => {
    // Revert form fields to saved snapshot
    setFullName(savedSnapshot.fullName)
    setEmail(savedSnapshot.email)
    setPhone(savedSnapshot.phone)
    setOrganizationName(savedSnapshot.organizationName)
    setDropoffAddress(savedSnapshot.dropoffAddress)
    setAbout(savedSnapshot.about)

    // Revert photo preview
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setPhotoFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''

    setError('')
    setIsEditing(false)
  }

  // Save Tab 1: Organization Info
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!isEditing) return

    setError('')
    if (!fullName.trim()) return setError('Full name / contact person is required.')
    if (!email.trim()) return setError('Email address is required.')
    if (!organizationName.trim()) return setError('Organization name is required.')
    if (!dropoffAddress.trim()) return setError('Drop-off address is required.')

    try {
      setSaving(true)

      // 1. Upload new photo if selected
      if (photoFile) {
        setUploadingPhoto(true)
        const uploadRes = await authService.uploadAvatar(photoFile)
        if (uploadRes.data?.avatar && updateUser) {
          updateUser({ avatar: uploadRes.data.avatar })
        }
        if (previewUrl && previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(previewUrl)
        }
        setPreviewUrl(null)
        setPhotoFile(null)
      }

      // 2. Save profile updates
      const payload = {
        organizationName,
        contactPerson: fullName,
        phone,
        email,
        dropoffAddress,
        about,
      }
      if (coords.lat != null && coords.lng != null) {
        payload.lat = coords.lat
        payload.lng = coords.lng
      }

      await receiverService.updateProfile(payload)

      // Update snapshot
      setSavedSnapshot({
        fullName,
        email,
        phone,
        organizationName,
        dropoffAddress,
        about,
      })

      if (updateUser) {
        updateUser({
          fullName,
          email,
          phone,
          organizationName,
        })
      }

      setToastMessage('Profile updated successfully!')
      setTimeout(() => setToastMessage(''), 4500)
      setIsEditing(false)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
      setUploadingPhoto(false)
    }
  }

  // Save Tab 2: Capacity
  const handleSaveCapacity = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      await receiverService.updateCapacity(capacityForm)
      setToastMessage('Capacity preferences saved successfully!')
      setTimeout(() => setToastMessage(''), 4500)
    } catch (err) {
      alert(err.message || 'Failed to update capacity.')
    } finally {
      setSaving(false)
    }
  }

  // Save Tab 3: Notifications
  const handleSaveNotifications = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      await receiverService.updateNotifications(notifForm)
      setToastMessage('Notification preferences updated!')
      setTimeout(() => setToastMessage(''), 4500)
    } catch (err) {
      alert(err.message || 'Failed to update notifications.')
    } finally {
      setSaving(false)
    }
  }

  const initials = (fullName || organizationName || 'RP')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  const currentAvatar = previewUrl || (user?.avatar ? getAvatarUrl(user.avatar) : null)

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-3xl border border-gray-100 animate-pulse space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-200" />
          <div className="space-y-2">
            <div className="h-5 bg-gray-200 rounded w-48" />
            <div className="h-3 bg-gray-200 rounded w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-[#2E7D32] text-white rounded-xl shadow-xl text-xs font-semibold animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Tabs Header */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-1 flex-wrap">
        <button
          type="button"
          onClick={() => setActiveTab('org_info')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'org_info'
              ? 'bg-[#2E7D32] text-white shadow-2xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-white border border-gray-200'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Organization Info</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('capacity')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'capacity'
              ? 'bg-[#2E7D32] text-white shadow-2xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-white border border-gray-200'
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Capacity</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'notifications'
              ? 'bg-[#2E7D32] text-white shadow-2xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-white border border-gray-200'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Notifications</span>
        </button>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* TAB 1: ORGANIZATION INFO (Exact Screenshot Layout)          */}
      {/* ----------------------------------------------------------- */}
      {activeTab === 'org_info' && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-xs space-y-8">
          {/* Header Row: Avatar + Info (Left) | Edit/Save/Cancel Button (Right) */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-16 h-16 rounded-full bg-[#1F2937] text-white flex items-center justify-center font-bold text-lg overflow-hidden shadow-xs">
                  {currentAvatar ? (
                    <img
                      src={currentAvatar}
                      alt={fullName || 'Receiver'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{initials || 'RP'}</span>
                  )}
                </div>

                {/* Camera Upload Button (Visible only during Edit Mode) */}
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/50 text-white flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
                    title="Change Organization Photo"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
              </div>

              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
                  {fullName || organizationName || 'Receiver Partner'}
                </h2>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  Receiver • Member since {memberSince}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div>
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-5 py-2.5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-full text-xs font-semibold flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving || uploadingPhoto}
                    className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={saving || uploadingPhoto}
                    className="px-5 py-2 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {(saving || uploadingPhoto) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{saving || uploadingPhoto ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Row 1: Full Name & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2 block">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  readOnly={!isEditing}
                  placeholder="Enter full name"
                  className={`w-full px-4 py-3 rounded-2xl text-xs sm:text-sm font-medium transition-all ${
                    isEditing
                      ? 'bg-white border border-gray-300 focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] text-gray-900 outline-none shadow-2xs'
                      : 'bg-[#F9FAFB] border border-transparent text-gray-800 cursor-default'
                  }`}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2 block">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    readOnly={!isEditing}
                    placeholder="Enter email address"
                    className={`w-full pl-4 pr-24 py-3 rounded-2xl text-xs sm:text-sm font-medium transition-all ${
                      isEditing
                        ? 'bg-white border border-gray-300 focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] text-gray-900 outline-none shadow-2xs'
                        : 'bg-[#F9FAFB] border border-transparent text-gray-800 cursor-default'
                    }`}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-gray-400 font-medium pointer-events-none">
                    <Lock className="w-3.5 h-3.5 text-gray-400" />
                    <span>Verified</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Phone & Organization Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2 block">
                  Phone
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  readOnly={!isEditing}
                  placeholder="Enter phone number"
                  className={`w-full px-4 py-3 rounded-2xl text-xs sm:text-sm font-medium transition-all ${
                    isEditing
                      ? 'bg-white border border-gray-300 focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] text-gray-900 outline-none shadow-2xs'
                      : 'bg-[#F9FAFB] border border-transparent text-gray-800 cursor-default'
                  }`}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2 block">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  readOnly={!isEditing}
                  placeholder="Enter organization name"
                  className={`w-full px-4 py-3 rounded-2xl text-xs sm:text-sm font-medium transition-all ${
                    isEditing
                      ? 'bg-white border border-gray-300 focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] text-gray-900 outline-none shadow-2xs'
                      : 'bg-[#F9FAFB] border border-transparent text-gray-800 cursor-default'
                  }`}
                />
              </div>
            </div>

            {/* Row 3: Drop-Off Address */}
            <div>
              <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2 block">
                Drop-off Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={dropoffAddress}
                  onChange={(e) => setDropoffAddress(e.target.value)}
                  readOnly={!isEditing}
                  placeholder="Enter drop-off address"
                  className={`w-full pl-11 pr-4 py-3 rounded-2xl text-xs sm:text-sm font-medium transition-all ${
                    isEditing
                      ? 'bg-white border border-gray-300 focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] text-gray-900 outline-none shadow-2xs'
                      : 'bg-[#F9FAFB] border border-transparent text-gray-800 cursor-default'
                  }`}
                />
              </div>
            </div>

            {/* Row 4: About */}
            <div>
              <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2 block">
                About
              </label>
              <textarea
                rows={3}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                readOnly={!isEditing}
                placeholder="Tell us about your organization and community impact..."
                className={`w-full px-4 py-3 rounded-2xl text-xs sm:text-sm font-medium transition-all resize-none ${
                  isEditing
                    ? 'bg-white border border-gray-300 focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] text-gray-900 outline-none shadow-2xs'
                    : 'bg-[#F9FAFB] border border-transparent text-gray-800 cursor-default'
                }`}
              />
            </div>
          </form>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* TAB 2: CAPACITY & DIETARY                                   */}
      {/* ----------------------------------------------------------- */}
      {activeTab === 'capacity' && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-xs space-y-6">
          <form onSubmit={handleSaveCapacity} className="space-y-6">
            <div className="space-y-1 pb-3 border-b border-gray-100">
              <h4 className="text-base font-bold text-gray-900">Facility Capacity & Storage</h4>
              <p className="text-xs text-gray-500">
                Let food donors know what types of food your organization can safely receive and store.
              </p>
            </div>

            {/* Storage Types */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Available Storage Facilities
              </label>
              <div className="flex items-center gap-2.5 flex-wrap">
                {['refrigerated', 'frozen', 'dry'].map((type) => {
                  const isChecked = capacityForm.storageTypes.includes(type)
                  return (
                    <button
                      type="button"
                      key={type}
                      onClick={() =>
                        setCapacityForm((prev) => ({
                          ...prev,
                          storageTypes: isChecked
                            ? prev.storageTypes.filter((t) => t !== type)
                            : [...prev.storageTypes, type],
                        }))
                      }
                      className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-[#2E7D32] text-white shadow-2xs'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type} Storage
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Servings & People Served Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Max Servings Per Pickup
                </label>
                <input
                  type="number"
                  min="1"
                  value={capacityForm.maxServingsPerPickup}
                  onChange={(e) =>
                    setCapacityForm((prev) => ({
                      ...prev,
                      maxServingsPerPickup: Number(e.target.value),
                    }))
                  }
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-xs sm:text-sm font-medium focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  People Served Per Day
                </label>
                <input
                  type="number"
                  min="1"
                  value={capacityForm.peopleServedPerDay}
                  onChange={(e) =>
                    setCapacityForm((prev) => ({
                      ...prev,
                      peopleServedPerDay: Number(e.target.value),
                    }))
                  }
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-xs sm:text-sm font-medium focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] outline-none"
                />
              </div>
            </div>

            {/* Preferred Categories */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Preferred Food Categories
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  'Cooked Meals',
                  'Fresh Produce',
                  'Bakery',
                  'Dairy & Eggs',
                  'Packaged Goods',
                  'Beverages & Other',
                ].map((cat) => {
                  const isChecked = capacityForm.preferredCategories.includes(cat)
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() =>
                        setCapacityForm((prev) => ({
                          ...prev,
                          preferredCategories: isChecked
                            ? prev.preferredCategories.filter((c) => c !== cat)
                            : [...prev.preferredCategories, cat],
                        }))
                      }
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-[#1565C0] text-white shadow-2xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Vehicle availability toggle */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-bold text-gray-900">Dedicated Transport Vehicle</p>
                <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                  Does your organization have a van or transport vehicle available for self-pickup?
                </p>
              </div>
              <input
                type="checkbox"
                checked={capacityForm.vehicleAvailable}
                onChange={(e) =>
                  setCapacityForm((prev) => ({ ...prev, vehicleAvailable: e.target.checked }))
                }
                className="w-5 h-5 accent-[#2E7D32] rounded cursor-pointer"
              />
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-2xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{saving ? 'Saving...' : 'Save Capacity & Dietary Preferences'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* TAB 3: NOTIFICATIONS                                        */}
      {/* ----------------------------------------------------------- */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-xs space-y-6">
          <form onSubmit={handleSaveNotifications} className="space-y-6">
            <div className="pb-3 border-b border-gray-100">
              <h4 className="text-base font-bold text-gray-900">Notification Preferences</h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Choose which real-time notifications and alerts you would like to receive.
              </p>
            </div>

            <div className="space-y-4">
              {/* Toggle 1: New Food Available */}
              <ToggleRow
                title="New Food Available"
                description="Get alerted when surplus food matching your preferences is posted nearby"
                checked={notifForm.newFoodAvailable}
                onChange={(checked) =>
                  setNotifForm((prev) => ({ ...prev, newFoodAvailable: checked }))
                }
              />

              {/* Toggle 2: Request Status Updates */}
              <ToggleRow
                title="Request Status Updates"
                description="Know when your surplus food requests are approved, ready, or declined by donors"
                checked={notifForm.requestStatusUpdates}
                onChange={(checked) =>
                  setNotifForm((prev) => ({ ...prev, requestStatusUpdates: checked }))
                }
              />

              {/* Toggle 3: Delivery Alerts */}
              <ToggleRow
                title="Delivery & Courier Alerts"
                description="Real-time updates when a volunteer courier accepts, picks up, or delivers food"
                checked={notifForm.deliveryAlerts}
                onChange={(checked) =>
                  setNotifForm((prev) => ({ ...prev, deliveryAlerts: checked }))
                }
              />

              {/* Toggle 4: Urgent Expiry Alerts */}
              <ToggleRow
                title="Urgent Expiry Alerts"
                description="Priority notifications for surplus food items expiring within the next 4 hours"
                checked={notifForm.urgentExpiryAlerts}
                onChange={(checked) =>
                  setNotifForm((prev) => ({ ...prev, urgentExpiryAlerts: checked }))
                }
              />

              {/* Toggle 5: Weekly Impact Digest */}
              <ToggleRow
                title="Weekly Impact Digest"
                description="Weekly email recap of your organization's food rescue volume and meals served"
                checked={notifForm.weeklyImpactDigest}
                onChange={(checked) =>
                  setNotifForm((prev) => ({ ...prev, weeklyImpactDigest: checked }))
                }
              />

              {/* Toggle 6: SMS Notifications */}
              <ToggleRow
                title="SMS Text Notifications"
                description="Receive critical food arrival verification codes and dispatch updates via SMS"
                checked={notifForm.smsNotifications}
                onChange={(checked) =>
                  setNotifForm((prev) => ({ ...prev, smsNotifications: checked }))
                }
              />
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-2xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{saving ? 'Saving...' : 'Save Notification Preferences'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function ToggleRow({ title, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
      <div className="min-w-0">
        <h4 className="text-xs sm:text-sm font-bold text-gray-900">{title}</h4>
        <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? 'bg-[#2E7D32]' : 'bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}
