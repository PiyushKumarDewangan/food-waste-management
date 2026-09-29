import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Calendar,
  X,
  Sparkles,
} from 'lucide-react'
import donorService from '../../services/donorService'

const CATEGORIES = [
  'Cooked Meal',
  'Bakery',
  'Fresh Produce',
  'Dairy & Eggs',
  'Packaged & Canned',
  'Beverages',
  'Other',
]

const UNITS = ['servings', 'loaves', 'kg', 'items', 'boxes', 'liters']

export default function AddFood() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [savedAddress, setSavedAddress] = useState('')

  // Form State
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState(6)
  const [unit, setUnit] = useState('servings')
  const [bestBefore, setBestBefore] = useState('')
  const [pickupAddress, setPickupAddress] = useState('')
  const [pickupStart, setPickupStart] = useState('14:00')
  const [pickupEnd, setPickupEnd] = useState('19:00')
  const [pickupInstructions, setPickupInstructions] = useState('')
  const [safetyConfirmed, setSafetyConfirmed] = useState(false)

  // Photo
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview)
      }
    }
  }, [photoPreview])

  // Load saved profile pickup address
  useEffect(() => {
    let isMounted = true
    const loadProfile = async () => {
      try {
        const res = await donorService.getProfile()
        if (isMounted && res.data?.profile?.pickupAddress) {
          setSavedAddress(res.data.profile.pickupAddress)
        }
      } catch (err) {
        console.error('Error fetching donor profile:', err)
      }
    }
    loadProfile()
    return () => {
      isMounted = false
    }
  }, [])

  const handleUseSavedAddress = () => {
    if (savedAddress) {
      setPickupAddress(savedAddress)
    } else {
      setPickupAddress('742 Evergreen Terrace, San Francisco, CA 94102')
    }
  }

  const processFile = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPG, PNG or WEBP).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be less than 5 MB.')
      return
    }
    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview)
    }
    setPhotoFile(file)
    const previewUrl = URL.createObjectURL(file)
    setPhotoPreview(previewUrl)
    setError('')
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    processFile(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    processFile(file)
  }

  const removePhoto = () => {
    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview)
    }
    setPhotoFile(null)
    setPhotoPreview('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) return setError('Food title is required.')
    if (!category) return setError('Please select a food category.')
    if (!description.trim()) return setError('Description is required.')
    if (!quantity || quantity <= 0) return setError('Please enter a valid quantity.')
    if (!bestBefore) return setError('Please specify the Best Before date.')
    if (!pickupAddress.trim()) return setError('Pickup address is required.')
    if (!safetyConfirmed) return setError('You must confirm the food safety declaration.')

    const pickupWindowStr = `${pickupStart} - ${pickupEnd}`

    setLoading(true)
    try {
      if (photoFile) {
        const formData = new FormData()
        formData.append('foodPhoto', photoFile)
        formData.append('title', title)
        formData.append('category', category)
        formData.append('description', description)
        formData.append('quantity', quantity)
        formData.append('unit', unit)
        formData.append('bestBefore', bestBefore)
        formData.append('pickupAddress', pickupAddress)
        formData.append('pickupWindow', pickupWindowStr)
        formData.append('pickupInstructions', pickupInstructions)
        await donorService.createDonation(formData, true)
      } else {
        await donorService.createDonation({
          title,
          category,
          description,
          quantity: Number(quantity),
          unit,
          bestBefore,
          pickupAddress,
          pickupWindow: pickupWindowStr,
          pickupInstructions,
        })
      }

      navigate('/donor/my-food')
    } catch (err) {
      console.error('Error posting food:', err)
      setError(err.message || 'Failed to post food donation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header & Back Button (Page 2 in PDF) */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/donor/dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Add Food</h1>
          <p className="text-xs text-gray-500 font-medium">
            Share your surplus food with your community.
          </p>
        </div>
      </div>

      {/* Main Card (Pages 2 & 3 in PDF) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 sm:p-8">
        <h2 className="text-base font-bold text-gray-900 mb-6">
          Share Food with Your Community
        </h2>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo Upload Area */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Food Photo
            </label>

            {photoPreview ? (
              <div className="relative w-full h-56 rounded-2xl overflow-hidden border border-gray-200 group">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                  title="Remove Photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-2xl cursor-pointer transition-all p-4 text-center ${
                  isDragging
                    ? 'border-[#2E7D32] bg-emerald-50/50 scale-[0.99]'
                    : 'border-gray-200 hover:border-[#2E7D32] bg-gray-50/60 hover:bg-emerald-50/20'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#2E7D32] flex items-center justify-center mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  {isDragging ? 'Release to upload photo' : <>Drop photo here or <span className="text-[#2E7D32] underline">click to upload</span></>}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  JPG, PNG or WEBP. Max 5 MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Food Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Food Title <span className="text-emerald-700">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Homemade Lentil Soup"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] outline-hidden transition-all bg-white"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Category <span className="text-emerald-700">*</span>
            </label>
            <select
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] outline-hidden transition-all bg-white text-gray-700"
            >
              <option value="">Select a category...</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the food — ingredients, taste, any allergen info..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] outline-hidden transition-all bg-white resize-none"
            />
          </div>

          {/* Quantity & Unit */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Quantity
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-1/2 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-[#2E7D32] outline-hidden"
              />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-1/2 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-[#2E7D32] outline-hidden bg-white text-gray-700"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Best Before */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Best Before
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={bestBefore}
                onChange={(e) => setBestBefore(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-[#2E7D32] outline-hidden bg-white"
              />
            </div>
          </div>

          {/* Pickup Address */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Pickup Address
              </label>
              <button
                type="button"
                onClick={handleUseSavedAddress}
                className="text-xs font-semibold text-[#2E7D32] hover:text-[#256428] hover:underline"
              >
                Use my saved address
              </button>
            </div>
            <div className="relative">
              <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="742 Evergreen Terrace, San Francisco, CA"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-[#2E7D32] outline-hidden"
              />
            </div>
          </div>

          {/* Pickup Window */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Pickup Window
            </label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Clock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="time"
                  value={pickupStart}
                  onChange={(e) => setPickupStart(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-[#2E7D32] outline-hidden bg-white"
                />
              </div>
              <span className="text-gray-400 text-sm font-medium">to</span>
              <div className="relative flex-1">
                <Clock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="time"
                  value={pickupEnd}
                  onChange={(e) => setPickupEnd(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-[#2E7D32] outline-hidden bg-white"
                />
              </div>
            </div>
          </div>

          {/* Special Pickup Instructions */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Pickup Instructions (Optional)
            </label>
            <input
              type="text"
              value={pickupInstructions}
              onChange={(e) => setPickupInstructions(e.target.value)}
              placeholder="e.g. Ring doorbell at side porch, or leave food in container by entrance"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-[#2E7D32] outline-hidden"
            />
          </div>

          {/* Food Safety Declaration (Page 3 in PDF) */}
          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={safetyConfirmed}
                onChange={(e) => setSafetyConfirmed(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-[#2E7D32] focus:ring-[#2E7D32] border-gray-300"
              />
              <span className="text-xs text-gray-600 leading-relaxed">
                I confirm this food is safe to eat, stored correctly, and accurately described. I understand I'm responsible for its quality at the time of pickup.
              </span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate('/donor/dashboard')}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#256428] text-white text-sm font-semibold shadow-xs disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                <span>Post Food</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
