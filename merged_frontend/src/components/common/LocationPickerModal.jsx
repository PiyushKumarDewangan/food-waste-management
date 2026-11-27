import React, { useState, useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  MapPin,
  Search,
  Crosshair,
  X,
  Check,
  Loader2,
  Navigation,
  Compass,
  AlertCircle,
} from 'lucide-react'
import {
  getAddressSuggestions,
  getPlaceLocation,
  reverseGeocodeCoords,
} from '../../services/mapsService'

// Default center: Central Chhattisgarh corridor (Bhilai / Durg / Raipur)
const DEFAULT_CENTER = { lat: 21.2144, lng: 81.3805 }

export default function LocationPickerModal({
  isOpen,
  onClose,
  initialCoords = null,
  initialAddress = '',
  onConfirm,
  title = 'Pin Exact Location on Map',
}) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const searchDebounceRef = useRef(null)

  // Current selected coordinates and address
  const [selectedCoords, setSelectedCoords] = useState(
    initialCoords?.lat != null && initialCoords?.lng != null
      ? { lat: Number(initialCoords.lat), lng: Number(initialCoords.lng) }
      : DEFAULT_CENTER
  )
  const [addressText, setAddressText] = useState(initialAddress || '')
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false)

  // Search autocomplete inside modal
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [locatingGps, setLocatingGps] = useState(false)

  // Update when modal opens
  useEffect(() => {
    if (!isOpen) return

    const initial =
      initialCoords?.lat != null && initialCoords?.lng != null
        ? { lat: Number(initialCoords.lat), lng: Number(initialCoords.lng) }
        : DEFAULT_CENTER

    setSelectedCoords(initial)
    setAddressText(initialAddress || '')
    setSearchQuery('')
    setSuggestions([])
    setShowSuggestions(false)
  }, [isOpen, initialCoords?.lat, initialCoords?.lng, initialAddress])

  // Custom modern pin marker
  const createDraggableIcon = () =>
    L.divIcon({
      className: 'custom-pin-marker',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: grab; filter: drop-shadow(0 6px 14px rgba(22, 101, 52, 0.45)); transform: translate(0, -50%);">
          <div style="width: 40px; height: 40px; border-radius: 50% 50% 50% 4px; transform: rotate(-45deg); background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); border: 3px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.25);">
            <div style="transform: rotate(45deg); width: 12px; height: 12px; background: #ffffff; border-radius: 50%;"></div>
          </div>
          <div style="margin-top: -6px; background: #0f172a; color: #ffffff; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; letter-spacing: 0.3px; white-space: nowrap; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
            Drag to Set
          </div>
        </div>
      `,
      iconSize: [40, 52],
      iconAnchor: [20, 48],
    })

  // Reverse geocode when coordinates change
  const fetchAddressForCoords = async (lat, lng) => {
    setIsReverseGeocoding(true)
    try {
      const geo = await reverseGeocodeCoords(lat, lng)
      if (geo && geo.address) {
        setAddressText(geo.address)
      }
    } catch (err) {
      console.warn('Reverse geocode error:', err)
    } finally {
      setIsReverseGeocoding(false)
    }
  }

  // Initialize Leaflet Map when modal opens
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return

    let isCancelled = false
    let resizeObserver = null

    // Give DOM a frame to compute modal dimensions
    const initTimer = setTimeout(() => {
      if (isCancelled || !mapContainerRef.current) return

      // Clean up any existing map instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }

      const startLat = selectedCoords?.lat ?? DEFAULT_CENTER.lat
      const startLng = selectedCoords?.lng ?? DEFAULT_CENTER.lng

      const map = L.map(mapContainerRef.current, {
        center: [startLat, startLng],
        zoom: 15,
        zoomControl: false,
      })

      // Standard reliable OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
        attribution: '© OpenStreetMap contributors',
      }).addTo(map)

      // Zoom controls at bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map)

      // Add draggable marker
      const marker = L.marker([startLat, startLng], {
        icon: createDraggableIcon(),
        draggable: true,
        autoPan: true,
      }).addTo(map)

      marker.on('dragend', (e) => {
        const position = e.target.getLatLng()
        const newLat = Number(position.lat.toFixed(6))
        const newLng = Number(position.lng.toFixed(6))
        setSelectedCoords({ lat: newLat, lng: newLng })
        fetchAddressForCoords(newLat, newLng)
      })

      // Map click reposition
      map.on('click', (e) => {
        const newLat = Number(e.latlng.lat.toFixed(6))
        const newLng = Number(e.latlng.lng.toFixed(6))
        marker.setLatLng([newLat, newLng])
        setSelectedCoords({ lat: newLat, lng: newLng })
        fetchAddressForCoords(newLat, newLng)
      })

      mapInstanceRef.current = map
      markerRef.current = marker

      // Invalidate size immediately and after slight delay
      map.invalidateSize()
      setTimeout(() => map.invalidateSize(), 150)
      setTimeout(() => map.invalidateSize(), 350)

      // Observe size changes to keep tiles sharp
      if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          map.invalidateSize()
        })
        resizeObserver.observe(mapContainerRef.current)
      }
    }, 60)

    return () => {
      isCancelled = true
      clearTimeout(initTimer)
      if (resizeObserver) resizeObserver.disconnect()
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [isOpen])

  // Move marker and pan map programmatically
  const updateMapPosition = (lat, lng, zoomLevel = 16) => {
    const nLat = Number(Number(lat).toFixed(6))
    const nLng = Number(Number(lng).toFixed(6))
    setSelectedCoords({ lat: nLat, lng: nLng })

    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([nLat, nLng])
      mapInstanceRef.current.flyTo([nLat, nLng], zoomLevel, { duration: 1 })
    }
    fetchAddressForCoords(nLat, nLng)
  }

  // Handle in-modal search input
  const handleSearchChange = (e) => {
    const query = e.target.value
    setSearchQuery(query)

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)

    if (!query || query.trim().length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const results = await getAddressSuggestions(query)
        setSuggestions(results)
        setShowSuggestions(results.length > 0)
      } catch (err) {
        setSuggestions([])
      } finally {
        setIsSearching(false)
      }
    }, 250)
  }

  // Select search suggestion
  const handleSelectSuggestion = async (suggestion) => {
    const text = suggestion.description || suggestion.mainText
    setSearchQuery(text)
    setShowSuggestions(false)
    setSuggestions([])

    try {
      const details = await getPlaceLocation(suggestion.placeId)
      if (details && details.lat != null && details.lng != null) {
        setAddressText(details.address || text)
        updateMapPosition(details.lat, details.lng, 17)
      }
    } catch (err) {
      console.warn('Place selection error:', err)
    }
  }

  // Quick Locate Me via GPS
  const handleLocateMe = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert('Geolocation is not supported by your browser.')
      return
    }

    setLocatingGps(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6))
        const lng = Number(pos.coords.longitude.toFixed(6))
        setLocatingGps(false)
        updateMapPosition(lat, lng, 17)
      },
      (err) => {
        setLocatingGps(false)
        console.warn('Geolocation error:', err.message)
        alert('Could not retrieve current location. Please pan or search on the map.')
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  // Confirm and save location
  const handleConfirm = () => {
    if (!selectedCoords || selectedCoords.lat == null || selectedCoords.lng == null) {
      alert('Please place a pin on the map before confirming.')
      return
    }

    const finalAddress =
      addressText && addressText.trim().length > 3
        ? addressText.trim()
        : `Pinned Location (${selectedCoords.lat.toFixed(4)}, ${selectedCoords.lng.toFixed(4)})`

    if (onConfirm) {
      onConfirm({
        address: finalAddress,
        lat: selectedCoords.lat,
        lng: selectedCoords.lng,
      })
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">{title}</h3>
              <p className="text-[11px] text-slate-500">
                Click anywhere or drag the green pin to your exact building or entrance
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Toolbar */}
        <div className="relative px-4 py-3 bg-white border-b border-slate-100 flex items-center gap-2 z-20">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true)
              }}
              placeholder="Search area, landmark, or street name..."
              className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              </div>
            )}

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute top-full left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-2xl z-50">
                {suggestions.map((item, idx) => (
                  <li
                    key={item.placeId || idx}
                    onClick={() => handleSelectSuggestion(item)}
                    className="flex items-start gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 cursor-pointer transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold truncate">
                        {item.mainText || item.description}
                      </p>
                      {item.secondaryText && (
                        <p className="text-[10px] text-slate-400 truncate">
                          {item.secondaryText}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="button"
            onClick={handleLocateMe}
            disabled={locatingGps}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 text-xs font-semibold transition-all shrink-0 cursor-pointer disabled:opacity-50"
            title="Use current GPS location"
          >
            {locatingGps ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            ) : (
              <Crosshair className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span className="hidden sm:inline">Locate Me</span>
          </button>
        </div>

        {/* Map View - Explicit height ensures Leaflet initializes tiles properly */}
        <div
          className="relative w-full bg-slate-100 overflow-hidden"
          style={{ height: '420px', minHeight: '420px' }}
        >
          <div
            ref={mapContainerRef}
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
          />

          {/* Coordinate Overlay Pill */}
          <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2 bg-slate-900/85 backdrop-blur-md text-white px-3 py-1.5 rounded-xl shadow-lg border border-white/10 text-[11px] font-mono">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {selectedCoords.lat.toFixed(5)}, {selectedCoords.lng.toFixed(5)}
            </span>
          </div>

          {/* Instructional helper badge */}
          <div className="absolute bottom-3 left-3 z-[1000] hidden sm:flex items-center gap-1.5 bg-white/90 backdrop-blur-md text-slate-700 px-3 py-1.5 rounded-xl shadow-md border border-slate-200/80 text-[11px] font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Tip: Click anywhere or drag the green pin to adjust</span>
          </div>
        </div>

        {/* Bottom Details & Action Bar */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Address / Landmark Label
            </label>
            <div className="relative">
              <input
                type="text"
                value={addressText}
                onChange={(e) => setAddressText(e.target.value)}
                placeholder="Selected address (you can refine or add landmark/flat number)..."
                className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-8 focus:bg-white focus:border-emerald-500 outline-none transition-all"
              />
              {isReverseGeocoding && (
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Confirm Location</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
