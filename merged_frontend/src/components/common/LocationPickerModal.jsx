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
  Compass,
  Layers,
  Sparkles,
  Building,
} from 'lucide-react'
import {
  getAddressSuggestions,
  getPlaceLocation,
  reverseGeocodeCoords,
} from '../../services/mapsService'
import { TILE_PROVIDERS, createDraggablePin } from './mapDesignSystem'

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
  const tileLayerRef = useRef(null)
  const markerRef = useRef(null)
  const accuracyCircleRef = useRef(null)
  const searchDebounceRef = useRef(null)

  // Current selected coordinates, address, and landmark
  const [selectedCoords, setSelectedCoords] = useState(
    initialCoords?.lat != null && initialCoords?.lng != null
      ? { lat: Number(initialCoords.lat), lng: Number(initialCoords.lng) }
      : DEFAULT_CENTER
  )
  const [addressText, setAddressText] = useState(initialAddress || '')
  const [landmarkText, setLandmarkText] = useState('')
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false)
  const [activeTileKey, setActiveTileKey] = useState('roadmap') // 'roadmap' | 'satellite'

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
    setLandmarkText('')
    setSearchQuery('')
    setSuggestions([])
    setShowSuggestions(false)
  }, [isOpen, initialCoords?.lat, initialCoords?.lng, initialAddress])

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

    const initTimer = setTimeout(() => {
      if (isCancelled || !mapContainerRef.current) return

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }

      const startLat = selectedCoords?.lat ?? DEFAULT_CENTER.lat
      const startLng = selectedCoords?.lng ?? DEFAULT_CENTER.lng

      const map = L.map(mapContainerRef.current, {
        center: [startLat, startLng],
        zoom: 16,
        zoomControl: false,
      })

      const tileConfig = TILE_PROVIDERS[activeTileKey] || TILE_PROVIDERS.roadmap
      const baseLayer = L.tileLayer(tileConfig.url, tileConfig.options).addTo(map)
      tileLayerRef.current = baseLayer

      // Draggable custom marker
      const marker = L.marker([startLat, startLng], {
        icon: createDraggablePin({ label: 'Drag to set pin' }),
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

      map.invalidateSize()
      setTimeout(() => map.invalidateSize(), 150)
      setTimeout(() => map.invalidateSize(), 350)

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

  // Dynamic Tile Layer Switcher
  useEffect(() => {
    if (!mapInstanceRef.current) return
    const map = mapInstanceRef.current
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current)
    }
    const tileConfig = TILE_PROVIDERS[activeTileKey] || TILE_PROVIDERS.roadmap
    tileLayerRef.current = L.tileLayer(tileConfig.url, tileConfig.options).addTo(map)
  }, [activeTileKey])

  // Move marker and pan map programmatically
  const updateMapPosition = (lat, lng, zoomLevel = 16, accuracyRadius = null) => {
    const nLat = Number(Number(lat).toFixed(6))
    const nLng = Number(Number(lng).toFixed(6))
    setSelectedCoords({ lat: nLat, lng: nLng })

    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([nLat, nLng])
      mapInstanceRef.current.flyTo([nLat, nLng], zoomLevel, { duration: 1 })

      // Show accuracy circle if GPS accuracy radius provided
      if (accuracyCircleRef.current) {
        mapInstanceRef.current.removeLayer(accuracyCircleRef.current)
        accuracyCircleRef.current = null
      }
      if (accuracyRadius && accuracyRadius > 0) {
        accuracyCircleRef.current = L.circle([nLat, nLng], {
          radius: Math.min(accuracyRadius, 500),
          color: '#10b981',
          fillColor: '#10b981',
          fillOpacity: 0.15,
          weight: 1.5,
        }).addTo(mapInstanceRef.current)
      }
    }
    fetchAddressForCoords(nLat, nLng)
  }

  // Handle search autocomplete
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

  // GPS Locate Me with accuracy circle
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
        const accuracy = pos.coords.accuracy || 30
        setLocatingGps(false)
        updateMapPosition(lat, lng, 17, accuracy)
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

    let finalAddress = addressText.trim()
    if (!finalAddress || finalAddress.length < 3) {
      finalAddress = `Pinned Location (${selectedCoords.lat.toFixed(4)}, ${selectedCoords.lng.toFixed(4)})`
    }

    if (onConfirm) {
      onConfirm({
        address: finalAddress,
        lat: selectedCoords.lat,
        lng: selectedCoords.lng,
        landmark: landmarkText.trim(),
      })
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-50 text-[#ea4335] flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">{title}</h3>
              <p className="text-[11px] text-slate-500">
                Click anywhere or drag the red pin to your exact building, gate, or entrance
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
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
              placeholder="Search area, landmark, or street name in Google Maps..."
              className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#1a73e8] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1a73e8]" />
              </div>
            )}

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute top-full left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-2xl z-50">
                {suggestions.map((item, idx) => (
                  <li
                    key={item.placeId || idx}
                    onClick={() => handleSelectSuggestion(item)}
                    className="flex items-start gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-[#1a73e8] cursor-pointer transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 mt-0.5 text-[#ea4335] shrink-0" />
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

          {/* Layer switcher */}
          <button
            type="button"
            onClick={() => setActiveTileKey((prev) => (prev === 'roadmap' ? 'satellite' : 'roadmap'))}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-[#dadce0] shadow-[0_1px_3px_rgba(60,64,67,0.15)] transition-all shrink-0 cursor-pointer"
            title={`Switch to ${activeTileKey === 'roadmap' ? 'Satellite' : 'Roadmap'} View`}
          >
            <Layers className="w-3.5 h-3.5 text-[#1a73e8]" />
            <span className="hidden sm:inline capitalize">
              {activeTileKey === 'roadmap' ? 'Satellite' : 'Roadmap'}
            </span>
          </button>

          {/* Locate Me */}
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={locatingGps}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-blue-50 text-slate-700 hover:text-[#1a73e8] border border-[#dadce0] hover:border-blue-200 text-xs font-semibold shadow-[0_1px_3px_rgba(60,64,67,0.15)] transition-all shrink-0 cursor-pointer disabled:opacity-50"
            title="Use current GPS location"
          >
            {locatingGps ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1a73e8]" />
            ) : (
              <Crosshair className="w-3.5 h-3.5 text-[#1a73e8]" />
            )}
            <span className="hidden sm:inline">Locate Me</span>
          </button>
        </div>

        {/* Map View */}
        <div
          className="relative w-full bg-slate-100 overflow-hidden"
          style={{ height: '400px', minHeight: '400px' }}
        >
          <div
            ref={mapContainerRef}
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
          />

          {/* Coordinate Overlay Pill */}
          <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2 bg-white/95 text-[#202124] px-3 py-1.5 rounded-xl shadow-[0_2px_6px_rgba(60,64,67,0.3)] border border-[#dadce0] text-[11px] font-mono font-semibold">
            <Compass className="w-3.5 h-3.5 text-[#1a73e8]" />
            <span>
              {selectedCoords.lat.toFixed(5)}, {selectedCoords.lng.toFixed(5)}
            </span>
          </div>

          {/* Basemap Attribution badge */}
          <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1 bg-white/95 text-[#202124] px-2.5 py-1 rounded-xl shadow-[0_2px_6px_rgba(60,64,67,0.2)] border border-[#dadce0] text-[10px] font-bold">
            <Sparkles className="w-3 h-3 text-[#1a73e8]" />
            <span>Google Maps Roadmap</span>
          </div>

          {/* Google Watermark */}
          <div className="absolute bottom-2 left-2 z-[1000] text-[11px] font-bold text-[#5f6368] bg-white/80 px-2 py-0.5 rounded shadow-[0_1px_3px_rgba(60,64,67,0.2)] border border-[#dadce0]/60 pointer-events-none select-none">
            Google
          </div>

          {/* Instruction Tip */}
          <div className="absolute bottom-3 right-3 z-[1000] hidden sm:flex items-center gap-1.5 bg-white/95 text-[#202124] px-3 py-1.5 rounded-xl shadow-[0_2px_6px_rgba(60,64,67,0.25)] border border-[#dadce0] text-[11px] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#ea4335] animate-ping" />
            <span>Tip: Drag red pin or click map to pinpoint entrance</span>
          </div>
        </div>

        {/* Bottom Details & Action Bar */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-100 flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Verified Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={addressText}
                  onChange={(e) => setAddressText(e.target.value)}
                  placeholder="Street address..."
                  className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-8 focus:bg-white focus:border-[#1a73e8] outline-none transition-all"
                />
                {isReverseGeocoding && (
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1a73e8]" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Landmark / Floor / Gate (Optional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={landmarkText}
                  onChange={(e) => setLandmarkText(e.target.value)}
                  placeholder="e.g. Gate 2, 3rd Floor, Near City Mall..."
                  className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:bg-white focus:border-[#1a73e8] outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Confirm Location Pin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
