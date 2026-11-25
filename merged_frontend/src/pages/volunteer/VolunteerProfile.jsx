import { useState, useEffect, useRef } from 'react'
import {
  Camera,
  Edit3,
  Lock,
  Bike,
  Car,
  Footprints,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  Shield,
  Bell,
  Eye,
  EyeOff,
  ShieldCheck,
  Check,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { volunteerService } from '../../services/volunteerService'
import authService from '../../services/authService'
import { getAvatarUrl } from '../../utils/imageHelper'

export default function VolunteerProfile() {
  const { user, updateUser } = useAuth()
  const fileInputRef = useRef(null)

  const [activeTab, setActiveTab] = useState('profile') // 'profile' | 'security' | 'notifications'
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [pendingPhotoFile, setPendingPhotoFile] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Form states (Tab 1: Profile & Courier)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')
  const [transportType, setTransportType] = useState('bicycle')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [radiusKm, setRadiusKm] = useState(5)
  const [reviewStatus, setReviewStatus] = useState('approved')

  // Snapshot for Cancel functionality
  const [savedSnapshot, setSavedSnapshot] = useState({
    fullName: '',
    phone: '',
    emergencyContact: '',
    transportType: 'bicycle',
    vehicleNumber: '',
    radiusKm: 5,
  })

  // Security Form States (Tab 2: Security)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdError, setPwdError] = useState('')
  const [pwdSuccess, setPwdSuccess] = useState('')

  // Notifications Form States (Tab 3: Notifications)
  const [notifPrefs, setNotifPrefs] = useState({
    nearbyPickups: true,
    urgentExpiryAlerts: true,
    exchangeStatusUpdates: true,
    weeklyImpactDigest: true,
  })
  const [prefsLoading, setPrefsLoading] = useState(false)
  const [prefsSaving, setPrefsSaving] = useState(false)
  const [prefsSuccess, setPrefsSuccess] = useState('')
  const [prefsError, setPrefsError] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const [profileRes, notifRes] = await Promise.allSettled([
          volunteerService.getProfile(),
          volunteerService.getNotificationPreferences(),
        ])

        if (profileRes.status === 'fulfilled' && profileRes.value?.data) {
          const p = profileRes.value.data.profile || {}
          const u = p.user || user || {}

          const initName = u.fullName || user?.fullName || ''
          const initPhone = u.phone || user?.phone || ''
          const initEmail = u.email || user?.email || ''
          const initEmergency = p.emergencyContact || ''
          const initTransport = p.transportType || 'bicycle'
          const initVehicleNo = p.vehicleNumber || ''
          const initRadius = parseInt(p.serviceRadius) || 5
          const initStatus = p.reviewStatus || 'approved'

          setFullName(initName)
          setPhone(initPhone)
          setEmail(initEmail)
          setEmergencyContact(initEmergency)
          setTransportType(initTransport)
          setVehicleNumber(initVehicleNo)
          setRadiusKm(initRadius)
          setReviewStatus(initStatus)

          setSavedSnapshot({
            fullName: initName,
            phone: initPhone,
            emergencyContact: initEmergency,
            transportType: initTransport,
            vehicleNumber: initVehicleNo,
            radiusKm: initRadius,
          })
        }

        if (notifRes.status === 'fulfilled' && notifRes.value?.data?.data) {
          setNotifPrefs((prev) => ({
            ...prev,
            ...notifRes.value.data.data,
          }))
        }
      } catch (err) {
        console.error('Failed to load volunteer profile:', err)
        setErrorMsg('Failed to load profile. Please refresh to try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  const handleStartEdit = () => {
    setSavedSnapshot({
      fullName,
      phone,
      emergencyContact,
      transportType,
      vehicleNumber,
      radiusKm,
    })
    setErrorMsg('')
    setSuccessMsg('')
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    // Discard pending photo preview
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setPendingPhotoFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    // Restore saved snapshot values
    setFullName(savedSnapshot.fullName)
    setPhone(savedSnapshot.phone)
    setEmergencyContact(savedSnapshot.emergencyContact)
    setTransportType(savedSnapshot.transportType)
    setVehicleNumber(savedSnapshot.vehicleNumber)
    setRadiusKm(savedSnapshot.radiusKm)
    setIsEditing(false)
    setErrorMsg('')
  }

  const handlePhotoChange = (e) => {
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

  const handleSave = async (e) => {
    e.preventDefault()
    if (!isEditing) return

    if (!fullName.trim()) {
      setErrorMsg('Full Name is required.')
      return
    }
    if (!phone.trim()) {
      setErrorMsg('Phone Number is required.')
      return
    }

    try {
      setSaving(true)
      setErrorMsg('')
      setSuccessMsg('')

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

      // 2. Save profile information
      const isNonMotorized = ['walking', 'bicycle'].includes(transportType)
      const cleanedVehicleNumber = isNonMotorized ? '' : vehicleNumber.trim()
      const cfg = getTransportConfig(transportType)
      const clampedRadius = Math.min(Math.max(1, radiusKm), cfg.maxKm)

      await volunteerService.updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        emergencyContact: emergencyContact.trim(),
        transportType,
        vehicleNumber: cleanedVehicleNumber,
        serviceRadius: `${clampedRadius} km`,
      })

      if (updateUser) {
        updateUser({
          fullName: fullName.trim(),
          phone: phone.trim(),
        })
      }

      setSavedSnapshot({
        fullName: fullName.trim(),
        phone: phone.trim(),
        emergencyContact: emergencyContact.trim(),
        transportType,
        vehicleNumber: cleanedVehicleNumber,
        radiusKm: clampedRadius,
      })

      setIsEditing(false)
      setSuccessMsg('Profile updated successfully!')
      setTimeout(() => setSuccessMsg(''), 4500)
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save profile changes.')
    } finally {
      setSaving(false)
      setUploadingPhoto(false)
    }
  }

  // Handle Password Update (Tab 2)
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

  // Handle Toggle Notification Preference (Tab 3)
  const handleTogglePref = async (key) => {
    const nextVal = !notifPrefs[key]
    const updated = {
      ...notifPrefs,
      [key]: nextVal,
    }
    setNotifPrefs(updated)
    setPrefsSaving(true)
    setPrefsSuccess('')
    setPrefsError('')

    try {
      const res = await volunteerService.updateNotificationPreferences(updated)
      if (res.data?.data) {
        setNotifPrefs(res.data.data)
      }
      setPrefsSuccess('Notification preferences saved.')
      setTimeout(() => setPrefsSuccess(''), 3500)
    } catch (err) {
      setPrefsError(err.response?.data?.message || 'Failed to save notification preferences.')
      // revert on failure
      setNotifPrefs(notifPrefs)
    } finally {
      setPrefsSaving(false)
    }
  }

  // Get Initials for avatar
  const getInitials = (name) => {
    if (!name) return 'VL'
    const parts = name.trim().split(' ').filter(Boolean)
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  // Member since date
  const memberSince = user?.createdAt
    ? new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(
        new Date(user.createdAt)
      )
    : '2026'

  const transportOptions = [
    { key: 'bicycle', label: 'Bicycle', icon: Bike },
    { key: 'motorcycle', label: 'Motorcycle', icon: Bike },
    { key: 'car', label: 'Car', icon: Car },
    { key: 'walking', label: 'Walking', icon: Footprints },
  ]

  const getTransportConfig = (type) => {
    switch (type) {
      case 'walking':
        return {
          maxKm: 5,
          defaultKm: 3,
          label: 'Walking (On Foot)',
          registrationStatus: 'Not applicable on foot',
          valueDisplay: 'Not Applicable (On Foot)',
          hint: 'Walking radius: 1 to 5 km (Recommended: 1 – 3 km for foot deliveries)',
        }
      case 'bicycle':
        return {
          maxKm: 12,
          defaultKm: 5,
          label: 'Bicycle',
          registrationStatus: 'Not applicable for bicycle',
          valueDisplay: 'Not Applicable (Bicycle)',
          hint: 'Bicycle radius: 1 to 12 km (Recommended: 3 – 8 km for cycling)',
        }
      case 'motorcycle':
        return {
          maxKm: 20,
          defaultKm: 15,
          label: 'Motorcycle',
          registrationStatus: 'Required for motor vehicles',
          valueDisplay: null,
          hint: 'Motorcycle radius: 1 to 20 km (Fast citywide deliveries)',
        }
      case 'car':
      default:
        return {
          maxKm: 25,
          defaultKm: 20,
          label: 'Car',
          registrationStatus: 'Required for motor vehicles',
          valueDisplay: null,
          hint: 'Car radius: 1 to 25 km (Bulk packaging & long distance citywide)',
        }
    }
  }

  const currentConfig = getTransportConfig(transportType)

  const handleSelectTransport = (newType) => {
    if (!isEditing) return
    setTransportType(newType)
    const cfg = getTransportConfig(newType)
    if (radiusKm > cfg.maxKm) {
      setRadiusKm(cfg.maxKm)
    } else if (newType === 'walking' && radiusKm > 3) {
      setRadiusKm(3)
    } else if (newType === 'bicycle' && radiusKm > 8) {
      setRadiusKm(5)
    }
  }

  const tabs = [
    { key: 'profile', label: 'Profile & Courier', icon: User },
    { key: 'security', label: 'Security', icon: Shield },
    { key: 'notifications', label: 'Notifications', icon: Bell },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">My Profile</h1>
        <p className="text-xs text-gray-500 font-medium mt-0.5">
          Manage your volunteer identity, vehicle details, security credentials, and alerts.
        </p>
      </div>

      {/* 3 Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-100 pb-2 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#2E7D32] text-white shadow-xs'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Messages */}
      {successMsg && activeTab === 'profile' && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2E7D32]" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && activeTab === 'profile' && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TAB 1: Profile & Courier Settings */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-xs space-y-6">
          {/* Top Profile Header Row */}
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
                  getInitials(fullName)
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{fullName || 'Volunteer'}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Volunteer Courier • Member since {memberSince}
                </p>
                {isEditing ? (
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
                ) : null}
              </div>
            </div>

            <button
              type="button"
              onClick={isEditing ? handleCancelEdit : handleStartEdit}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#256428] text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
            </button>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSave} className="space-y-6">
            {/* Row 1: Full Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                      : 'border-transparent bg-gray-50 text-gray-700 cursor-not-allowed'
                  }`}
                />
              </div>

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
            </div>

            {/* Row 2: Phone & Emergency Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Phone
                </label>
                <input
                  type="text"
                  required
                  disabled={!isEditing}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-hidden transition-all ${
                    isEditing
                      ? 'border-gray-200 focus:border-[#2E7D32] bg-white'
                      : 'border-transparent bg-gray-50 text-gray-700 cursor-not-allowed'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Emergency Contact
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="+91 98000 00000"
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-hidden transition-all ${
                    isEditing
                      ? 'border-gray-200 focus:border-[#2E7D32] bg-white'
                      : 'border-transparent bg-gray-50 text-gray-700 cursor-not-allowed'
                  }`}
                />
              </div>
            </div>

            {/* Vehicle Type Selection */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Vehicle Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {transportOptions.map((opt) => {
                  const Icon = opt.icon
                  const isSelected = transportType === opt.key
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => handleSelectTransport(opt.key)}
                      disabled={!isEditing}
                      className={`p-3.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                        isSelected
                          ? 'border-[#2E7D32] bg-emerald-50/60 ring-1 ring-[#2E7D32] text-[#2E7D32] font-bold shadow-2xs'
                          : isEditing
                          ? 'border-gray-200 bg-white hover:border-gray-300 text-gray-700 cursor-pointer'
                          : 'border-transparent bg-gray-50 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Icon className="w-5 h-5 mb-1.5" />
                      <span className="text-xs">{opt.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Vehicle Registration Number */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Vehicle Registration Number
                </label>
                <span className="text-[11px] font-medium text-gray-400">
                  {currentConfig.registrationStatus}
                </span>
              </div>
              <input
                type="text"
                disabled={!isEditing || currentConfig.valueDisplay !== null}
                value={currentConfig.valueDisplay !== null ? currentConfig.valueDisplay : vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder={
                  currentConfig.valueDisplay !== null
                    ? currentConfig.valueDisplay
                    : 'e.g. MP-09-AB-1234'
                }
                className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-hidden transition-all ${
                  currentConfig.valueDisplay !== null
                    ? 'border-transparent bg-gray-100/80 text-gray-400 cursor-not-allowed italic'
                    : isEditing
                    ? 'border-gray-200 focus:border-[#2E7D32] bg-white text-gray-900'
                    : 'border-transparent bg-gray-50 text-gray-700 cursor-not-allowed'
                }`}
              />
            </div>

            {/* Delivery Preferences: Preferred Max Distance */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Preferred Max Distance
                </label>
                <span className="text-xs font-bold text-[#2E7D32]">
                  Within {Math.min(radiusKm, currentConfig.maxKm)} km radius
                </span>
              </div>
              <input
                type="range"
                min="1"
                max={currentConfig.maxKm}
                step="1"
                value={Math.min(radiusKm, currentConfig.maxKm)}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                disabled={!isEditing}
                className={`w-full accent-[#2E7D32] ${
                  isEditing ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                }`}
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-semibold mt-1">
                <span>1 km</span>
                <span>{Math.round(currentConfig.maxKm / 2)} km</span>
                <span>{currentConfig.maxKm} km</span>
              </div>
              <p className="text-[11px] text-emerald-800 bg-emerald-50/70 border border-emerald-100/80 rounded-xl px-3 py-1.5 font-medium mt-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32] shrink-0" />
                <span>{currentConfig.hint}</span>
              </p>
            </div>

            {/* Bottom Edit Actions */}
            {isEditing && (
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
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

      {/* TAB 2: Security */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Identity & Verification Status Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#2E7D32] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Volunteer Trust & Verification</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Verified couriers have priority dispatch for fresh food deliveries.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-[#2E7D32] border border-emerald-200 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                Identity Verified ✓
              </span>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Change Password</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Update your account password to protect your volunteer account and assignments.
              </p>
            </div>

            {pwdSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0" />
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
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
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
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
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
        </div>
      )}

      {/* TAB 3: Notifications */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Volunteer Delivery Alerts</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Customize your dispatch notifications and delivery reminders.
              </p>
            </div>
            {prefsSaving && (
              <span className="text-[11px] text-[#2E7D32] flex items-center gap-1.5 font-semibold">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving...
              </span>
            )}
          </div>

          {prefsSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0" />
              <span>{prefsSuccess}</span>
            </div>
          )}

          {prefsError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{prefsError}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* 1. Nearby Pickups */}
            <label className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50/60 cursor-pointer transition-colors">
              <div className="pr-4">
                <p className="text-xs font-bold text-gray-900">Nearby Food Pickup Alerts</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Get notified when fresh surplus food is posted within your preferred delivery radius ({radiusKm} km).
                </p>
              </div>
              <input
                type="checkbox"
                checked={!!notifPrefs.nearbyPickups}
                onChange={() => handleTogglePref('nearbyPickups')}
                className="w-4 h-4 text-[#2E7D32] accent-[#2E7D32] rounded-sm focus:ring-[#2E7D32] cursor-pointer shrink-0"
              />
            </label>

            {/* 2. Urgent Expiry Alerts */}
            <label className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50/60 cursor-pointer transition-colors">
              <div className="pr-4">
                <p className="text-xs font-bold text-gray-900">Urgent Food Rescue Alerts</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  High-priority alerts for perishable donations expiring in less than 2 hours.
                </p>
              </div>
              <input
                type="checkbox"
                checked={!!notifPrefs.urgentExpiryAlerts}
                onChange={() => handleTogglePref('urgentExpiryAlerts')}
                className="w-4 h-4 text-[#2E7D32] accent-[#2E7D32] rounded-sm focus:ring-[#2E7D32] cursor-pointer shrink-0"
              />
            </label>

            {/* 3. Handover & Status Updates */}
            <label className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50/60 cursor-pointer transition-colors">
              <div className="pr-4">
                <p className="text-xs font-bold text-gray-900">Order & Handover Updates</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Alerts when donors confirm pickup packages or receivers send drop-off instructions.
                </p>
              </div>
              <input
                type="checkbox"
                checked={!!notifPrefs.exchangeStatusUpdates}
                onChange={() => handleTogglePref('exchangeStatusUpdates')}
                className="w-4 h-4 text-[#2E7D32] accent-[#2E7D32] rounded-sm focus:ring-[#2E7D32] cursor-pointer shrink-0"
              />
            </label>

            {/* 4. Weekly Impact Digest */}
            <label className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50/60 cursor-pointer transition-colors">
              <div className="pr-4">
                <p className="text-xs font-bold text-gray-900">Weekly Impact & Leaderboard Digest</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Summary of your weekly deliveries completed, meals safely delivered, and community badges earned.
                </p>
              </div>
              <input
                type="checkbox"
                checked={!!notifPrefs.weeklyImpactDigest}
                onChange={() => handleTogglePref('weeklyImpactDigest')}
                className="w-4 h-4 text-[#2E7D32] accent-[#2E7D32] rounded-sm focus:ring-[#2E7D32] cursor-pointer shrink-0"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  )
}
