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
  Plus,
  Trash2,
  Utensils,
} from 'lucide-react'
import donorService from '../../services/donorService'
import { FOOD_UNITS } from '../../utils/unitHelper'

const CATEGORIES = [
  'Cooked Meal',
  'Bakery',
  'Fresh Produce',
  'Dairy & Eggs',
  'Packaged & Canned',
  'Beverages & Other',
]

const getDefaultTomorrow = () => {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
  return tomorrow.toISOString().split('T')[0]
}

const createDefaultItem = (idx = 1) => ({
  id: `item-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
  title: '',
  category: '',
  description: '',
  quantity: 6,
  unit: 'Servings',
  bestBefore: getDefaultTomorrow(),
  photoFile: null,
  photoPreview: '',
})

export default function AddFood() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [submitProgress, setSubmitProgress] = useState('')
  const [error, setError] = useState('')
  const [savedAddress, setSavedAddress] = useState('')
  const [coords, setCoords] = useState(null)

  // Multi-item state (supports up to 10 items in a single donation batch)
  const [items, setItems] = useState([createDefaultItem(1)])

  // Common Pickup Logistics (Shared by all items in this donation batch)
  const [pickupAddress, setPickupAddress] = useState('')
  const [pickupStart, setPickupStart] = useState('14:00')
  const [pickupEnd, setPickupEnd] = useState('19:00')
  const [pickupInstructions, setPickupInstructions] = useState('')
  const [safetyConfirmed, setSafetyConfirmed] = useState(false)

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      items.forEach((it) => {
        if (it.photoPreview && it.photoPreview.startsWith('blob:')) {
          URL.revokeObjectURL(it.photoPreview)
        }
      })
    }
  }, [items])

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6)),
          })
        },
        () => {},
        { timeout: 8000 }
      )
    }
  }, [])

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

  // Multi-item management
  const handleAddItem = () => {
    if (items.length >= 10) {
      setError('You can add up to 10 food items in a single donation batch.')
      return
    }
    setError('')
    setItems((prev) => [...prev, createDefaultItem(prev.length + 1)])
  }

  const handleRemoveItem = (id) => {
    if (items.length <= 1) return
    setItems((prev) => {
      const target = prev.find((i) => i.id === id)
      if (target?.photoPreview && target.photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(target.photoPreview)
      }
      return prev.filter((i) => i.id !== id)
    })
  }

  const handleUpdateItem = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

  const handleItemFileChange = (id, file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPG, PNG or WEBP).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be less than 5 MB.')
      return
    }
    setError('')
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        if (item.photoPreview && item.photoPreview.startsWith('blob:')) {
          URL.revokeObjectURL(item.photoPreview)
        }
        return {
          ...item,
          photoFile: file,
          photoPreview: URL.createObjectURL(file),
        }
      })
    )
  }

  const handleRemoveItemPhoto = (id) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        if (item.photoPreview && item.photoPreview.startsWith('blob:')) {
          URL.revokeObjectURL(item.photoPreview)
        }
        return {
          ...item,
          photoFile: null,
          photoPreview: '',
        }
      })
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validate overall logistics
    if (!pickupAddress.trim()) {
      return setError('Pickup address is required for food collection.')
    }
    if (!safetyConfirmed) {
      return setError('You must confirm the food safety declaration.')
    }

    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      const num = i + 1
      if (!it.title.trim()) {
        return setError(`Item #${num}: Food title is required.`)
      }
      if (!it.category) {
        return setError(`Item #${num} ("${it.title || 'Untitled'}"): Please select a category.`)
      }
      if (!it.description.trim()) {
        return setError(`Item #${num} ("${it.title}"): Description is required.`)
      }
      if (!it.quantity || Number(it.quantity) <= 0) {
        return setError(`Item #${num} ("${it.title}"): Quantity must be greater than zero.`)
      }
      if (!it.bestBefore) {
        return setError(`Item #${num} ("${it.title}"): Best Before date is required.`)
      }
    }

    const pickupWindowStr = `${pickupStart} - ${pickupEnd}`

    setLoading(true)
    try {
      let finalCoords = coords
      if (!finalCoords && typeof window !== 'undefined' && navigator?.geolocation) {
        try {
          finalCoords = await new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (pos) =>
                resolve({
                  lat: Number(pos.coords.latitude.toFixed(6)),
                  lng: Number(pos.coords.longitude.toFixed(6)),
                }),
              () => resolve(null),
              { timeout: 3000 }
            )
          })
        } catch {
          finalCoords = null
        }
      }

      // Publish each food item sequentially to ensure safe uploads
      for (let i = 0; i < items.length; i++) {
        const it = items[i]
        setSubmitProgress(
          `Publishing item ${i + 1} of ${items.length}: "${it.title.trim()}"...`
        )

        if (it.photoFile) {
          const formData = new FormData()
          formData.append('foodPhoto', it.photoFile)
          formData.append('title', it.title.trim())
          formData.append('category', it.category)
          formData.append('description', it.description.trim())
          formData.append('quantity', it.quantity)
          formData.append('unit', it.unit)
          formData.append('bestBefore', it.bestBefore)
          formData.append('pickupAddress', pickupAddress.trim())
          formData.append('pickupWindow', pickupWindowStr)
          formData.append('pickupInstructions', pickupInstructions.trim())
          if (finalCoords) {
            formData.append('lat', finalCoords.lat)
            formData.append('lng', finalCoords.lng)
          }
          await donorService.createDonation(formData, true)
        } else {
          const payload = {
            title: it.title.trim(),
            category: it.category,
            description: it.description.trim(),
            quantity: Number(it.quantity),
            unit: it.unit,
            bestBefore: it.bestBefore,
            pickupAddress: pickupAddress.trim(),
            pickupWindow: pickupWindowStr,
            pickupInstructions: pickupInstructions.trim(),
          }
          if (finalCoords) {
            payload.lat = finalCoords.lat
            payload.lng = finalCoords.lng
          }
          await donorService.createDonation(payload)
        }
      }

      navigate('/donor/my-food')
    } catch (err) {
      console.error('Error posting food:', err)
      setError(err.message || 'Failed to post food donations. Please try again.')
    } finally {
      setLoading(false)
      setSubmitProgress('')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Back Button */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/donor/dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Add Food</h1>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-[#2E7D32] border border-emerald-200">
              {items.length} {items.length === 1 ? 'Item' : 'Items'} in Batch
            </span>
          </div>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Donate one or multiple surplus food items in a single submission (up to 10 items).
          </p>
        </div>

        {items.length < 10 && (
          <button
            type="button"
            onClick={handleAddItem}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#256428] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Another Item</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: FOOD ITEMS LIST */}
        <div className="space-y-5">
          {items.map((item, index) => (
            <FoodItemCard
              key={item.id}
              item={item}
              index={index}
              totalItems={items.length}
              onUpdate={handleUpdateItem}
              onFileChange={handleItemFileChange}
              onRemovePhoto={handleRemoveItemPhoto}
              onRemove={handleRemoveItem}
            />
          ))}
        </div>

        {/* Add Another Item Button Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-gray-100 shadow-2xs">
          <div className="text-xs text-gray-600">
            <span>Currently adding </span>
            <strong className="text-[#2E7D32]">{items.length}</strong>
            <span> of max 10 food items in this batch.</span>
          </div>
          {items.length < 10 && (
            <button
              type="button"
              onClick={handleAddItem}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#2E7D32] text-xs font-bold border border-emerald-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Item</span>
            </button>
          )}
        </div>

        {/* SECTION 2: COMMON PICKUP LOGISTICS CARD */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#2E7D32]" />
              <span>Pickup & Handover Logistics</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              These pickup details apply to all {items.length} {items.length === 1 ? 'item' : 'items'} in this donation batch.
            </p>
          </div>

          {/* Pickup Address */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Pickup Address <span className="text-emerald-700">*</span>
              </label>
              <button
                type="button"
                onClick={handleUseSavedAddress}
                className="text-xs font-semibold text-[#2E7D32] hover:text-[#256428] hover:underline cursor-pointer"
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
                placeholder="e.g. 742 Evergreen Terrace, San Francisco, CA"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-[#2E7D32] outline-hidden bg-white"
              />
            </div>
          </div>

          {/* Pickup Window */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Pickup Window <span className="text-emerald-700">*</span>
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
              placeholder="e.g. Ring side buzzer, kitchen entrance at rear, packaging boxes ready"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-[#2E7D32] outline-hidden bg-white"
            />
          </div>

          {/* Food Safety Declaration */}
          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={safetyConfirmed}
                onChange={(e) => setSafetyConfirmed(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-[#2E7D32] accent-[#2E7D32] focus:ring-[#2E7D32] border-gray-300 cursor-pointer"
              />
              <span className="text-xs text-gray-600 leading-relaxed">
                I confirm that all {items.length} {items.length === 1 ? 'item' : 'items'} in this batch are fresh, safe to consume, stored hygienically, and accurately described.
              </span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate('/donor/dashboard')}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#256428] text-white text-sm font-bold shadow-xs disabled:opacity-50 transition-colors flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{submitProgress || 'Posting Donations...'}</span>
                </>
              ) : (
                <span>
                  {items.length > 1
                    ? `Post All ${items.length} Food Donations`
                    : 'Post Food Donation'}
                </span>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

function FoodItemCard({
  item,
  index,
  totalItems,
  onUpdate,
  onFileChange,
  onRemovePhoto,
  onRemove,
}) {
  const fileInputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)

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
    if (file) onFileChange(item.id, file)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 sm:p-7 space-y-5 transition-shadow hover:shadow-md">
      {/* Item Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#2E7D32] flex items-center justify-center font-extrabold text-xs shadow-2xs">
            #{index + 1}
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900">
              {item.title ? item.title : `Food Item ${index + 1}`}
            </h3>
            <span className="text-[11px] text-gray-500 font-medium">
              {item.category || 'Category not chosen'} · {item.quantity} {item.unit}
            </span>
          </div>
        </div>

        {totalItems > 1 && (
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors cursor-pointer"
            title="Remove this item"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove</span>
          </button>
        )}
      </div>

      {/* Row 1: Title & Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
            Food Title <span className="text-emerald-700">*</span>
          </label>
          <input
            type="text"
            required
            value={item.title}
            onChange={(e) => onUpdate(item.id, 'title', e.target.value)}
            placeholder="e.g. Mixed Veg Curry & Rice"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] outline-hidden bg-white"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
            Category <span className="text-emerald-700">*</span>
          </label>
          <select
            required
            value={item.category}
            onChange={(e) => onUpdate(item.id, 'category', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] outline-hidden bg-white text-gray-700 cursor-pointer"
          >
            <option value="">Select category...</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: Quantity & Unit and Best Before */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Quantity & Unit */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
            Quantity & Unit <span className="text-emerald-700">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              required
              value={item.quantity}
              onChange={(e) => onUpdate(item.id, 'quantity', e.target.value)}
              className="w-1/2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#2E7D32] outline-hidden bg-white"
            />
            <select
              value={item.unit}
              onChange={(e) => onUpdate(item.id, 'unit', e.target.value)}
              className="w-1/2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#2E7D32] outline-hidden bg-white text-gray-700 cursor-pointer"
            >
              {FOOD_UNITS.map((u) => (
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
            Best Before Date <span className="text-emerald-700">*</span>
          </label>
          <input
            type="date"
            required
            value={item.bestBefore}
            onChange={(e) => onUpdate(item.id, 'bestBefore', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#2E7D32] outline-hidden bg-white"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
          Description & Ingredients <span className="text-emerald-700">*</span>
        </label>
        <textarea
          rows={2}
          required
          value={item.description}
          onChange={(e) => onUpdate(item.id, 'description', e.target.value)}
          placeholder="Describe ingredients, allergens (nuts, dairy, gluten), and packaging..."
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] outline-hidden bg-white resize-none"
        />
      </div>

      {/* Item Photo Upload */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
          Photo (Optional)
        </label>

        {item.photoPreview ? (
          <div className="relative w-full h-40 sm:h-44 rounded-xl overflow-hidden border border-gray-200 group">
            <img
              src={item.photoPreview}
              alt={item.title || 'Food Item'}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => onRemovePhoto(item.id)}
              className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
              title="Remove Photo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <label
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all p-3 text-center ${
              isDragging
                ? 'border-[#2E7D32] bg-emerald-50/50 scale-[0.99]'
                : 'border-gray-200 hover:border-[#2E7D32] bg-gray-50/60 hover:bg-emerald-50/20'
            }`}
          >
            <div className="w-9 h-9 rounded-full bg-emerald-50 text-[#2E7D32] flex items-center justify-center mb-1.5">
              <UploadCloud className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-gray-800">
              {isDragging ? 'Drop photo here' : <>Drop photo or <span className="text-[#2E7D32] underline">browse</span></>}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">JPG, PNG or WEBP (Max 5 MB)</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => onFileChange(item.id, e.target.files?.[0])}
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>
  )
}
