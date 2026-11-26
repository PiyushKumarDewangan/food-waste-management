import { useState, useEffect, useRef } from 'react'
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
  Eye,
  EyeOff,
  Loader2,
  Star,
  MessageSquare,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import donorService from '../../services/donorService'
import authService from '../../services/authService'
import { getAvatarUrl } from '../../utils/imageHelper'
import AddressAutocompleteInput from '../../components/common/AddressAutocompleteInput'

export default function DonorProfile() {
  const { user, updateUser } = useAuth()
  const fileInputRef = useRef(null)
  const [activeTab, setActiveTab] = useState('info') // 'info' | 'reviews' | 'security' | 'notifications'
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [reviewsData, setReviewsData] = useState({ reviews: [], averageRating: 0, count: 0 })
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Form State
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [pickupAddress, setPickupAddress] = useState('')
  const [coords, setCoords] = useState({ lat: null, lng: null })
  const [about, setAbout] = useState('')
  const [savedProfile, setSavedProfile] = useState({
    fullName: '',
    phone: '',
    organizationName: '',
    pickupAddress: '',
    about: '',
    lat: null,
    lng: null,
  })
  const [pendingPhotoFile, setPendingPhotoFile] = useState(null)

  // Security / Password State
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdError, setPwdError] = useState('')
  const [pwdSuccess, setPwdSuccess] = useState('')

  // Notification Preferences State
  const [notificationPreferences, setNotificationPreferences] = useState({
    newFoodRequest: true,
    volunteerCourierUpdates: true,
    exchangeCompleted: true,
  })
  const [prefsLoading, setPrefsLoading] = useState(false)
  const [prefsSaving, setPrefsSaving] = useState(false)
  const [prefsMessage, setPrefsMessage] = useState('')
  const [prefsError, setPrefsError] = useState('')

  useEffect(() => {
    let isMounted = true
    const loadProfile = async () => {
      try {
        setLoading(true)
        const res = await donorService.getProfile()
        if (isMounted && res.data) {
          const u = res.data.user || user
          const p = res.data.profile || {}
          const loadedFullName = u?.fullName || 'Maria Chen'
          const loadedEmail = u?.email || 'maria.chen@email.com'
          const loadedPhone = u?.phone || '+1 (415) 555-0192'
          const loadedOrg = p?.organizationName || 'Green Community Collective'
          const loadedAddress = p?.pickupAddress || '742 Evergreen Terrace, San Francisco, CA 94102'
          const loadedAbout = p?.about ||
            'Home cook and community volunteer. I love sharing surplus food from my weekend cooking sessions and garden harvest with neighbors in need.'

          const loadedLat = p?.lat ?? null
          const loadedLng = p?.lng ?? null

          setFullName(loadedFullName)
          setEmail(loadedEmail)
          setPhone(loadedPhone)
          setOrganizationName(loadedOrg)
          setPickupAddress(loadedAddress)
          setCoords({ lat: loadedLat, lng: loadedLng })
          setAbout(loadedAbout)
          setSavedProfile({
            fullName: loadedFullName,
            phone: loadedPhone,
            organizationName: loadedOrg,
            pickupAddress: loadedAddress,
            about: loadedAbout,
            lat: loadedLat,
            lng: loadedLng,
          })
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

  useEffect(() => {
    let isMounted = true
    const loadPreferences = async () => {
      try {
        setPrefsLoading(true)
        const res = await donorService.getNotificationPreferences()
        if (isMounted && res.data?.preferences) {
          setNotificationPreferences({
            newFoodRequest: res.data.preferences.newFoodRequest !== false,
            volunteerCourierUpdates: res.data.preferences.volunteerCourierUpdates !== false,
            exchangeCompleted: res.data.preferences.exchangeCompleted !== false,
          })
        }
      } catch (err) {
        console.error('Failed to load notification preferences:', err)
      } finally {
        if (isMounted) setPrefsLoading(false)
      }
    }

    loadPreferences()
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    if (activeTab === 'reviews') {
      const fetchReviews = async () => {
        try {
          setLoadingReviews(true)
          const res = await donorService.getReviews()
          if (isMounted && res.data) {
            setReviewsData(res.data)
          }
        } catch (err) {
          console.error('Failed to load donor reviews:', err)
        } finally {
          if (isMounted) setLoadingReviews(false)
        }
      }
      fetchReviews()
    }
    return () => {
      isMounted = false
    }
  }, [activeTab])

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    setPwdError('')
    setPwdSuccess('')

    if (!newPassword) {
      setPwdError('New password is required.')
      return
    }
    if (newPassword.length < 8) {
      setPwdError('New password must be at least 8 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPwdError('New password and confirm password do not match.')
      return
    }

    try {
      setPwdLoading(true)
      const res = await authService.changePassword({
        newPassword,
        confirmPassword,
      })
      setPwdSuccess(res.message || 'Password updated successfully!')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPwdSuccess(''), 5000)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update password.'
      setPwdError(msg)
    } finally {
      setPwdLoading(false)
    }
  }

  const handleTogglePref = async (key) => {
    const nextVal = !notificationPreferences[key]
    const updated = {
      ...notificationPreferences,
      [key]: nextVal,
    }
    setNotificationPreferences(updated)
    setPrefsSaving(true)
    setPrefsMessage('')
    setPrefsError('')

    try {
      const res = await donorService.updateNotificationPreferences(updated)
      if (res.data?.preferences) {
        setNotificationPreferences(res.data.preferences)
      }
      setPrefsMessage('Notification preferences saved.')
      setTimeout(() => setPrefsMessage(''), 3000)
    } catch (err) {
      setPrefsError(err.response?.data?.message || err.message || 'Failed to update preferences.')
      // revert on failure
      setNotificationPreferences(notificationPreferences)
    } finally {
      setPrefsSaving(false)
    }
  }

  const handlePhotoChange = (e) => {
    // Guard: strictly ignore file selections if not in edit mode
    if (!isEditing) return

    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type.toLowerCase())) {
      setErrorMsg('Invalid format. Please select a JPG, JPEG, PNG, or WebP image.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('File size too large. Maximum photo size is 5MB.')
      return
    }

    setErrorMsg('')
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }

    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    setPendingPhotoFile(file)
  }

  const handleCancelEdit = () => {
    // Discard pending photo selection and clean up temporary object URL
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setPendingPhotoFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    // Restore original profile information
    setFullName(savedProfile.fullName)
    setPhone(savedProfile.phone)
    setOrganizationName(savedProfile.organizationName)
    setPickupAddress(savedProfile.pickupAddress)
    setCoords({ lat: savedProfile.lat, lng: savedProfile.lng })
    setAbout(savedProfile.about)
    setErrorMsg('')
    setIsEditing(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!isEditing) return

    setSuccessMsg('')
    setErrorMsg('')
    setSaving(true)

    try {
      // 1. Upload pending photo if selected during edit mode
      if (pendingPhotoFile) {
        setUploadingPhoto(true)
        const uploadRes = await authService.uploadAvatar(pendingPhotoFile)
        if (uploadRes.data?.avatar && updateUser) {
          updateUser({ avatar: uploadRes.data.avatar })
        }
        if (previewUrl && previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(previewUrl)
        }
        setPreviewUrl(null)
        setPendingPhotoFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }

      // 2. Save profile information with GPS coordinates
      await donorService.updateProfile({
        fullName,
        phone,
        organizationName,
        pickupAddress,
        about,
        lat: coords.lat,
        lng: coords.lng,
      })

      setSavedProfile({
        fullName,
        phone,
        organizationName,
        pickupAddress,
        about,
        lat: coords.lat,
        lng: coords.lng,
      })

      setSuccessMsg('Profile updated successfully!')
      setIsEditing(false)
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to update profile.')
    } finally {
      setUploadingPhoto(false)
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
    { key: 'reviews', label: 'Reviews', icon: Star },
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
              <div className="w-16 h-16 rounded-full bg-[#1F2937] text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0 overflow-hidden border-2 border-[#2E7D32]/20">
                {previewUrl || user?.avatar ? (
                  <img
                    src={previewUrl || getAvatarUrl(user?.avatar)}
                    alt={fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{fullName}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Donor • Member since {user?.createdAt ? new Date(user.createdAt).getFullYear() : '2026'}
                </p>
                {isEditing && (
                  <>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoChange}
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto || saving}
                      className="mt-2 text-xs font-semibold text-[#2E7D32] hover:text-[#256428] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{pendingPhotoFile ? 'Change Selected Photo' : 'Upload Photo'}</span>
                    </button>
                    {pendingPhotoFile && (
                      <p className="text-[11px] text-emerald-700 font-medium mt-1">
                        Photo selected. Click &quot;Save Profile Changes&quot; to apply.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={isEditing ? handleCancelEdit : () => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#256428] text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
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

              {/* Business / Establishment Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Business / Establishment Name
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="e.g., Grand Hotel, Spice Bistro, Daily Bakery, or Personal Kitchen"
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
              <AddressAutocompleteInput
                label="Pickup Address"
                value={pickupAddress}
                onChange={(addr) => setPickupAddress(addr)}
                onSelectLocation={(loc) => {
                  setPickupAddress(loc.address)
                  if (loc.lat != null && loc.lng != null) {
                    setCoords({ lat: loc.lat, lng: loc.lng })
                  }
                }}
                disabled={!isEditing}
                currentCoords={coords}
                required
              />
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
                  onClick={handleCancelEdit}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingPhoto}
                  className="px-5 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#256428] text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {(saving || uploadingPhoto) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{saving || uploadingPhoto ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* TAB: Reviews */}
      {activeTab === 'reviews' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900">Community Reviews & Feedback</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Ratings and reviews submitted by receivers after completing food donations.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 shrink-0">
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span className="text-base font-extrabold text-gray-900">
                  {reviewsData.averageRating ? reviewsData.averageRating.toFixed(1) : '5.0'}
                </span>
              </div>
              <span className="text-xs font-semibold text-emerald-800">
                ({reviewsData.count || 0} {reviewsData.count === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          </div>

          {loadingReviews ? (
            <div className="py-12 text-center text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#2E7D32]" />
              <p className="text-xs">Loading reviews...</p>
            </div>
          ) : !reviewsData.reviews || reviewsData.reviews.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-700">No Reviews Received Yet</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                When community receivers claim your surplus food listings and submit ratings, their feedback will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviewsData.reviews.map((rev) => (
                <div
                  key={rev._id}
                  className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-gray-900">{rev.reviewerName}</span>
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium">
                      {new Date(rev.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-gray-700 font-normal">
                    {rev.comment || 'No comment provided.'}
                  </p>

                  <div className="text-[11px] text-gray-400 pt-1 border-t border-gray-100">
                    Food Listing: <span className="font-semibold text-gray-600">{rev.donationTitle}</span> · Order #{rev.orderNo}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Security */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Change Password</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Update your account password to keep your FoodShare account secure.
            </p>
          </div>

          {pwdSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{pwdSuccess}</span>
            </div>
          )}

          {pwdError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{pwdError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] outline-hidden transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] outline-hidden transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={pwdLoading}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#2E7D32] text-white text-xs font-semibold hover:bg-[#256428] transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {pwdLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{pwdLoading ? 'Updating Password...' : 'Update Password'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: Notifications */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Notification Preferences</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Choose what notifications you receive about food requests and volunteer courier actions.
              </p>
            </div>
            {prefsSaving && (
              <span className="text-[11px] text-gray-400 flex items-center gap-1.5 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2E7D32]" />
                Saving...
              </span>
            )}
          </div>

          {prefsMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{prefsMessage}</span>
            </div>
          )}

          {prefsError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{prefsError}</span>
            </div>
          )}

          {prefsLoading ? (
            <div className="py-8 flex justify-center items-center text-xs text-gray-400 gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#2E7D32]" />
              Loading preferences...
            </div>
          ) : (
            <div className="space-y-4">
              {/* Option 1: New Food Requests */}
              <label className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50/50 cursor-pointer transition-colors">
                <div>
                  <p className="text-xs font-bold text-gray-900">New Food Request</p>
                  <p className="text-[11px] text-gray-500">
                    Notify when a receiver requests surplus food from your listings
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={!!notificationPreferences.newFoodRequest}
                  onChange={() => handleTogglePref('newFoodRequest')}
                  className="w-4 h-4 text-[#2E7D32] accent-[#2E7D32] rounded-sm focus:ring-[#2E7D32] cursor-pointer"
                />
              </label>

              {/* Option 2: Volunteer Courier Updates */}
              <label className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50/50 cursor-pointer transition-colors">
                <div>
                  <p className="text-xs font-bold text-gray-900">Volunteer Courier Updates</p>
                  <p className="text-[11px] text-gray-500">
                    Notify when a volunteer courier accepts, arrives, or picks up food
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={!!notificationPreferences.volunteerCourierUpdates}
                  onChange={() => handleTogglePref('volunteerCourierUpdates')}
                  className="w-4 h-4 text-[#2E7D32] accent-[#2E7D32] rounded-sm focus:ring-[#2E7D32] cursor-pointer"
                />
              </label>

              {/* Option 3: Exchange Completed */}
              <label className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50/50 cursor-pointer transition-colors">
                <div>
                  <p className="text-xs font-bold text-gray-900">Exchange Completed</p>
                  <p className="text-[11px] text-gray-500">
                    Receive a recap when meals are confirmed delivered to the receiver
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={!!notificationPreferences.exchangeCompleted}
                  onChange={() => handleTogglePref('exchangeCompleted')}
                  className="w-4 h-4 text-[#2E7D32] accent-[#2E7D32] rounded-sm focus:ring-[#2E7D32] cursor-pointer"
                />
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
