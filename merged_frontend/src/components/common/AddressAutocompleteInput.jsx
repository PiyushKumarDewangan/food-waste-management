import React, { useState, useEffect, useRef } from 'react'
import { MapPin, Search, Loader2, X, CheckCircle2, Crosshair } from 'lucide-react'
import { getAddressSuggestions, getPlaceLocation } from '../../services/mapsService'

export default function AddressAutocompleteInput({
  value = '',
  onChange,
  onSelectLocation,
  placeholder = 'Enter full street address or search landmark...',
  label,
  error,
  required = false,
  disabled = false,
  className = '',
  currentCoords = null,
  showLocateMe = true,
}) {
  const [inputValue, setInputValue] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const [locating, setLocating] = useState(false)
  const [hasVerifiedCoords, setHasVerifiedCoords] = useState(
    currentCoords?.lat != null && currentCoords?.lng != null
  )

  const containerRef = useRef(null)
  const debounceTimerRef = useRef(null)

  // Sync external value changes
  useEffect(() => {
    setInputValue(value || '')
  }, [value])

  useEffect(() => {
    setHasVerifiedCoords(currentCoords?.lat != null && currentCoords?.lng != null)
  }, [currentCoords?.lat, currentCoords?.lng])

  // Handle outside click to close suggestions
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search
  const handleInputChange = (e) => {
    const text = e.target.value
    setInputValue(text)
    if (onChange) onChange(text)
    setHasVerifiedCoords(false) // Reset verified flag until selected or relocated

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (!text || text.trim().length < 2) {
      setSuggestions([])
      setIsOpen(false)
      setLoading(false)
      return
    }

    setLoading(true)
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await getAddressSuggestions(text)
        setSuggestions(results)
        setIsOpen(results.length > 0)
      } catch (err) {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  // Handle selecting a place suggestion
  const handleSelect = async (suggestion) => {
    const selectedText = suggestion.description || suggestion.mainText
    setInputValue(selectedText)
    setIsOpen(false)
    setSuggestions([])
    setLoading(true)

    if (onChange) onChange(selectedText)

    try {
      const details = await getPlaceLocation(suggestion.placeId)
      if (details && details.lat != null && details.lng != null) {
        setHasVerifiedCoords(true)
        if (onSelectLocation) {
          onSelectLocation({
            address: details.address || selectedText,
            lat: details.lat,
            lng: details.lng,
            name: details.name,
            placeId: details.placeId,
          })
        }
      } else {
        if (onSelectLocation) {
          onSelectLocation({
            address: selectedText,
            lat: null,
            lng: null,
            placeId: suggestion.placeId,
          })
        }
      }
    } catch (err) {
      console.warn('Failed to fetch place details:', err)
    } finally {
      setLoading(false)
    }
  }

  // Quick Locate Me via GPS
  const handleLocateMe = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert('Geolocation is not supported by your browser.')
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6))
        const lng = Number(pos.coords.longitude.toFixed(6))
        setHasVerifiedCoords(true)
        setLocating(false)

        // If input already has a name, keep it, otherwise show coordinates label
        const addressText = inputValue && inputValue.trim().length > 3
          ? inputValue
          : `GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`

        setInputValue(addressText)
        if (onChange) onChange(addressText)
        if (onSelectLocation) {
          onSelectLocation({
            address: addressText,
            lat,
            lng,
            isCurrentLocation: true,
          })
        }
      },
      (err) => {
        setLocating(false)
        console.warn('Geolocation error:', err.message)
        alert('Could not retrieve current location. Please enter your address manually.')
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((prev) => (prev > 0 ? prev - 1 : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIdx >= 0 && activeIdx < suggestions.length) {
        handleSelect(suggestions[activeIdx])
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const handleClear = () => {
    setInputValue('')
    setSuggestions([])
    setIsOpen(false)
    setHasVerifiedCoords(false)
    if (onChange) onChange('')
    if (onSelectLocation) {
      onSelectLocation({ address: '', lat: null, lng: null })
    }
  }

  return (
    <div ref={containerRef} className={`relative flex flex-col gap-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          {hasVerifiedCoords && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Verified GPS Coordinates
            </span>
          )}
        </div>
      )}

      <div className="relative flex items-center">
        <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
          <MapPin className="w-4 h-4 text-emerald-600" />
        </div>

        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true)
          }}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full pl-9 pr-20 py-2.5 text-sm rounded-xl border transition-all duration-200 outline-none ${
            error
              ? 'border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-2 focus:ring-red-200'
              : 'border-slate-200 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 hover:border-slate-300'
          } ${disabled ? 'bg-slate-100 cursor-not-allowed text-slate-400' : 'text-slate-800'}`}
        />

        <div className="absolute right-2.5 flex items-center gap-1.5">
          {loading && <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />}

          {!loading && inputValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Clear address"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {showLocateMe && !disabled && (
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={locating}
              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 transition-all title='Use current GPS location'"
              title="Locate me using GPS"
            >
              {locating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              ) : (
                <Crosshair className="w-3.5 h-3.5 text-emerald-600" />
              )}
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}

      {/* Dropdown Suggestions */}
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
            <span>Google Places Suggestions</span>
            <span className="text-[9px] lowercase text-slate-400 font-normal">select for exact routing</span>
          </div>
          {suggestions.map((item, idx) => {
            const isSelected = idx === activeIdx
            return (
              <li
                key={item.placeId || idx}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setActiveIdx(idx)}
                className={`flex items-start gap-2.5 px-3 py-2 cursor-pointer transition-colors text-left ${
                  isSelected ? 'bg-emerald-50 text-emerald-900' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <MapPin className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate text-slate-800">
                    {item.mainText || item.description}
                  </p>
                  {item.secondaryText && (
                    <p className="text-[11px] text-slate-400 truncate">
                      {item.secondaryText}
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
