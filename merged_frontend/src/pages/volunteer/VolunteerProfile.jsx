import { useState, useEffect, useRef } from 'react'
import {
  User,
  ShieldCheck,
  Bike,
  Car,
  Footprints,
  Sliders,
  CheckCircle,
  AlertCircle,
  Save,
  RefreshCw,
  Camera,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { volunteerService } from '../../services/volunteerService'
import authService from '../../services/authService'
import { getAvatarUrl } from '../../utils/imageHelper'

export default function VolunteerProfile() {
  const { user, updateUser } = useAuth()
  const fileInputRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Form states
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')
  const [transportType, setTransportType] = useState('bicycle')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [radiusKm, setRadiusKm] = useState(5)
  const [operatingNeighborhood, setOperatingNeighborhood] = useState('Central Indore')
  const [smartDispatch, setSmartDispatch] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const res = await volunteerService.getProfile()
        const p = res.data?.profile || {}
        const u = p.user || user || {}

        setFullName(u.fullName || user?.fullName || '')
        setPhone(u.phone || user?.phone || '')
        setEmail(u.email || user?.email || '')
        setEmergencyContact(p.emergencyContact || '')
        setTransportType(p.transportType || 'bicycle')
        setVehicleNumber(p.vehicleNumber || '')

        const parsedRadius = parseInt(p.serviceRadius) || 5
        setRadiusKm(parsedRadius)
        setOperatingNeighborhood(p.operatingNeighborhood || 'Central Indore')
        setSmartDispatch(p.smartDispatch !== false)
      } catch (err) {
        console.error('Failed to load volunteer profile:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  const handlePhotoChange = async (e) => {
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

    try {
      setUploadingPhoto(true)
      setErrorMsg('')

      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)

      const res = await authService.uploadAvatar(file)
      if (res.data?.avatar) {
        if (updateUser) {
          updateUser({ avatar: res.data.avatar })
        }
        setSuccessMsg('Profile photo updated successfully!')
        setTimeout(() => setSuccessMsg(''), 4000)
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to upload photo.')
      setPreviewUrl(null)
    } finally {
      setUploadingPhoto(false)
      e.target.value = ''
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      setErrorMsg('')
      setSuccessMsg('')

      await volunteerService.updateProfile({
        fullName,
        phone,
        emergencyContact,
        transportType,
        vehicleNumber,
        serviceRadius: `${radiusKm} km`,
        operatingNeighborhood,
        smartDispatch,
      })

      setSuccessMsg('Profile and vehicle settings saved successfully!')
      setTimeout(() => setSuccessMsg(''), 4500)
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  // Get Initials for avatar
  const getInitials = (name) => {
    if (!name) return 'VD'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  const transportOptions = [
    { key: 'bicycle', label: 'Bicycle', icon: Bike },
    { key: 'motorcycle', label: 'Motorcycle', icon: Bike },
    { key: 'car', label: 'Car', icon: Car },
    { key: 'walking', label: 'Walking', icon: Footprints },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight">
          Profile & Vehicle
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Keep your courier details and preferences current.
        </p>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-[#2E7D32]" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Personal Info & Vehicle Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information Card */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-7 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-[#2E7D32] flex items-center justify-center font-extrabold text-lg shadow-xs overflow-hidden border border-emerald-200">
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
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900">{fullName || 'Volunteer'}</h3>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3 text-[#2E7D32]" />
                      Verified Volunteer Courier
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Volunteer Courier Since{' '}
                    {user?.createdAt
                      ? new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
                          new Date(user.createdAt)
                        )
                      : 'Recently'}{' '}
                    · ID: FS-V-{(user?._id || '0000').slice(-4).toUpperCase()}
                  </p>
                </div>
              </div>

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
                disabled={uploadingPhoto}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 self-start sm:self-auto cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{uploadingPhoto ? 'Uploading...' : 'Change photo'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-gray-50/70 border border-gray-200 focus:bg-white focus:border-[#2E7D32] outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-gray-50/70 border border-gray-200 focus:bg-white focus:border-[#2E7D32] outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full text-xs p-3 rounded-xl bg-gray-100/80 border border-gray-200 text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Emergency Contact
                </label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-gray-50/70 border border-gray-200 focus:bg-white focus:border-[#2E7D32] outline-none transition-all"
                  placeholder="+91 98000 00000"
                />
              </div>
            </div>
          </div>

          {/* Vehicle Settings Card */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-7 shadow-xs space-y-5">
            <div>
              <h4 className="text-sm font-bold text-gray-900">Vehicle Settings</h4>
              <p className="text-xs text-gray-400 mt-0.5">Choose how you make your deliveries</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {transportOptions.map((opt) => {
                const Icon = opt.icon
                const isSelected = transportType === opt.key

                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setTransportType(opt.key)}
                    className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#2E7D32] bg-emerald-50/50 ring-2 ring-emerald-500/20 text-[#2E7D32]'
                        : 'border-gray-200 bg-white hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1.5" />
                    <span className="text-xs font-bold">{opt.label}</span>
                  </button>
                )
              })}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                Vehicle Registration Number
              </label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="e.g. MP-09-AB-1234 (leave blank for walking/bicycle)"
                className="w-full text-xs p-3 rounded-xl bg-gray-50/70 border border-gray-200 focus:bg-white focus:border-[#2E7D32] outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Right Column (1/3): Delivery Preferences & Save Button */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-6">
            <div>
              <h4 className="text-sm font-bold text-gray-900">Delivery Preferences</h4>
              <p className="text-xs text-gray-400 mt-0.5">Set your ideal delivery zone</p>
            </div>

            {/* Radius Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-700">Preferred Max Distance</span>
                <span className="font-bold text-[#2E7D32]">Within {radiusKm} km radius</span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                step="1"
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-full accent-[#2E7D32] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-semibold">
                <span>1 km</span>
                <span>10 km</span>
                <span>25 km</span>
              </div>
            </div>

            {/* Operating Neighborhood */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                Operating Neighborhood
              </label>
              <select
                value={operatingNeighborhood}
                onChange={(e) => setOperatingNeighborhood(e.target.value)}
                className="w-full text-xs p-3 rounded-xl bg-gray-50/70 border border-gray-200 focus:bg-white focus:border-[#2E7D32] outline-none cursor-pointer"
              >
                <option value="Central Indore">Central Indore</option>
                <option value="Vijay Nagar & Palasia">Vijay Nagar & Palasia</option>
                <option value="Rajwada & Sarafa">Rajwada & Sarafa</option>
                <option value="Bhawarkua & Annapurna">Bhawarkua & Annapurna</option>
                <option value="All Indore Zones">All Indore Zones</option>
              </select>
            </div>

            {/* Smart Dispatch Toggle */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900">Smart dispatch matching</span>
                <button
                  type="button"
                  onClick={() => setSmartDispatch(!smartDispatch)}
                  className={`w-8 h-4 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                    smartDispatch ? 'bg-[#2E7D32]' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${
                      smartDispatch ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                91% of similar couriers save time with smart auto-suggestions based on your vehicle and radius.
              </p>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 rounded-2xl bg-[#2E7D32] hover:bg-[#256828] text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Preferences...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
