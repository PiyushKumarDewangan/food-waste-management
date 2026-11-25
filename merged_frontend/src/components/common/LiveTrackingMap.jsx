import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import {
  Navigation,
  Maximize2,
  Minimize2,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Plus,
  Minus,
  LocateFixed,
} from 'lucide-react'

// Default fallback coordinates (e.g., Indore/Central India or SF depending on project context)
const DEFAULT_CENTER = { lat: 22.7196, lng: 75.8577 }

export default function LiveTrackingMap({
  pickupCoords,
  dropoffCoords,
  volunteerCoords,
  pickupAddress = 'Donor Pickup Location',
  dropoffAddress = 'Receiver Delivery Address',
  volunteerName = 'Volunteer Courier',
  volunteerTransport = 'bicycle',
  status = 'in_transit',
  height = '360px',
  showExternalNav = true,
  userRole = 'receiver', // 'receiver' | 'donor' | 'volunteer'
}) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef({ pickup: null, dropoff: null, volunteer: null, polyline: null })
  const [isExpanded, setIsExpanded] = useState(false)
  const [routeInfo, setRouteInfo] = useState({ distanceKm: null, etaMinutes: null })

  // Resolve valid coordinates with realistic nearby fallbacks if missing
  const validPickup =
    pickupCoords?.lat != null && pickupCoords?.lng != null
      ? { lat: Number(pickupCoords.lat), lng: Number(pickupCoords.lng) }
      : null

  const validDropoff =
    dropoffCoords?.lat != null && dropoffCoords?.lng != null
      ? { lat: Number(dropoffCoords.lat), lng: Number(dropoffCoords.lng) }
      : validPickup
      ? { lat: validPickup.lat + 0.018, lng: validPickup.lng + 0.015 }
      : null

  const finalPickup = validPickup || (validDropoff ? { lat: validDropoff.lat - 0.018, lng: validDropoff.lng - 0.015 } : DEFAULT_CENTER)
  const finalDropoff = validDropoff || { lat: finalPickup.lat + 0.018, lng: finalPickup.lng + 0.015 }

  const validVolunteer =
    volunteerCoords?.lat != null && volunteerCoords?.lng != null
      ? { lat: Number(volunteerCoords.lat), lng: Number(volunteerCoords.lng) }
      : ['picked_up_by_volunteer', 'picked_up', 'out_for_delivery', 'in_transit'].includes(status)
      ? {
          lat: (finalPickup.lat * 0.4 + finalDropoff.lat * 0.6),
          lng: (finalPickup.lng * 0.4 + finalDropoff.lng * 0.6),
        }
      : status === 'volunteer_assigned'
      ? {
          lat: finalPickup.lat - 0.008,
          lng: finalPickup.lng - 0.006,
        }
      : null

  // Calculate rough straight-line distance & ETA
  useEffect(() => {
    if (finalPickup && finalDropoff) {
      const R = 6371 // Earth radius in km
      const dLat = ((finalDropoff.lat - finalPickup.lat) * Math.PI) / 180
      const dLon = ((finalDropoff.lng - finalPickup.lng) * Math.PI) / 180
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((finalPickup.lat * Math.PI) / 180) *
          Math.cos((finalDropoff.lat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      const dist = Number((R * c).toFixed(1))
      // Average 20 km/h in city + 5 min buffer
      const eta = Math.max(5, Math.round((dist / 20) * 60) + 4)
      setRouteInfo({ distanceKm: dist, etaMinutes: eta })
    }
  }, [finalPickup.lat, finalPickup.lng, finalDropoff.lat, finalDropoff.lng])

  // Create Custom Leaflet DivIcons
  const createDonorIcon = () =>
    L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="background: #2E7D32; color: #fff; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; box-shadow: 0 4px 10px rgba(46,125,50,0.4); border: 2px solid #fff;">
            A
          </div>
          <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 7px solid #2E7D32; margin-top: -1px;"></div>
          <span style="background: rgba(17,24,39,0.85); color: #fff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 6px; margin-top: 2px; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
            Donor Pickup
          </span>
        </div>
      `,
      iconSize: [80, 56],
      iconAnchor: [40, 42],
    })

  const createReceiverIcon = () =>
    L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="background: #1565C0; color: #fff; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; box-shadow: 0 4px 10px rgba(21,101,192,0.4); border: 2px solid #fff;">
            B
          </div>
          <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 7px solid #1565C0; margin-top: -1px;"></div>
          <span style="background: rgba(17,24,39,0.85); color: #fff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 6px; margin-top: 2px; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
            Receiver Drop-off
          </span>
        </div>
      `,
      iconSize: [80, 56],
      iconAnchor: [40, 42],
    })

  const createVolunteerIcon = () =>
    L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="position: absolute; width: 44px; height: 44px; background: rgba(16,185,129,0.25); border-radius: 50%; animation: pulse 2s infinite ease-in-out;"></div>
          <div style="background: #10B981; color: #fff; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 4px 12px rgba(16,185,129,0.5); border: 2.5px solid #fff; z-index: 2;">
            🛵
          </div>
          <span style="background: #065F46; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 6px; margin-top: 3px; white-space: nowrap; box-shadow: 0 2px 5px rgba(0,0,0,0.25); z-index: 2;">
            ${volunteerName.split(' ')[0]} (Courier)
          </span>
        </div>
      `,
      iconSize: [90, 60],
      iconAnchor: [45, 42],
    })

  // Initialize and update map
  useEffect(() => {
    if (!mapContainerRef.current) return

    // Initialize Map if not already created
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
      }).setView([finalPickup.lat, finalPickup.lng], 13)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map)

      mapInstanceRef.current = map
    }

    const map = mapInstanceRef.current

    // Clear old markers & lines
    if (markersRef.current.pickup) map.removeLayer(markersRef.current.pickup)
    if (markersRef.current.dropoff) map.removeLayer(markersRef.current.dropoff)
    if (markersRef.current.volunteer) map.removeLayer(markersRef.current.volunteer)
    if (markersRef.current.polyline) map.removeLayer(markersRef.current.polyline)

    // Add Donor Marker (A)
    const donorMarker = L.marker([finalPickup.lat, finalPickup.lng], { icon: createDonorIcon() })
      .bindPopup(`<strong>Pickup (Donor)</strong><br/>${pickupAddress}`)
      .addTo(map)
    markersRef.current.pickup = donorMarker

    // Add Receiver Marker (B)
    const receiverMarker = L.marker([finalDropoff.lat, finalDropoff.lng], { icon: createReceiverIcon() })
      .bindPopup(`<strong>Drop-off (Receiver)</strong><br/>${dropoffAddress}`)
      .addTo(map)
    markersRef.current.dropoff = receiverMarker

    // Build polyline route points
    const routePoints = [[finalPickup.lat, finalPickup.lng]]

    // Add Volunteer Marker if available
    if (validVolunteer) {
      const volMarker = L.marker([validVolunteer.lat, validVolunteer.lng], { icon: createVolunteerIcon() })
        .bindPopup(`<strong>Courier: ${volunteerName}</strong><br/>Status: ${status.replace(/_/g, ' ')}`)
        .addTo(map)
      markersRef.current.volunteer = volMarker
      routePoints.push([validVolunteer.lat, validVolunteer.lng])
    }

    routePoints.push([finalDropoff.lat, finalDropoff.lng])

    // Draw route polyline
    const polyline = L.polyline(routePoints, {
      color: '#2E7D32',
      weight: 4,
      opacity: 0.75,
      dashArray: '8, 8',
      lineCap: 'round',
    }).addTo(map)
    markersRef.current.polyline = polyline

    // Auto-fit bounds
    try {
      const bounds = L.latLngBounds(routePoints)
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
    } catch (e) {
      // Fallback
    }

    // Invalidate map size after small delay
    setTimeout(() => {
      map.invalidateSize()
    }, 250)
  }, [
    finalPickup.lat,
    finalPickup.lng,
    finalDropoff.lat,
    finalDropoff.lng,
    validVolunteer?.lat,
    validVolunteer?.lng,
    status,
    isExpanded,
  ])

  const [geoNotice, setGeoNotice] = useState('')

  // Center on volunteer or current GPS location
  const handleRecenterVolunteer = () => {
    if (!mapInstanceRef.current) return

    if (typeof window !== 'undefined' && navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(6))
          const lng = Number(pos.coords.longitude.toFixed(6))
          mapInstanceRef.current.setView([lat, lng], 15)
          if (markersRef.current.volunteer) {
            markersRef.current.volunteer.setLatLng([lat, lng])
          }
          setGeoNotice('Updated to your live GPS position')
          setTimeout(() => setGeoNotice(''), 3500)
        },
        () => {
          if (validVolunteer) {
            mapInstanceRef.current.setView([validVolunteer.lat, validVolunteer.lng], 15)
          } else {
            const bounds = L.latLngBounds([
              [finalPickup.lat, finalPickup.lng],
              [finalDropoff.lat, finalDropoff.lng],
            ])
            mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] })
          }
          setGeoNotice('Centering on active delivery route')
          setTimeout(() => setGeoNotice(''), 3500)
        },
        { enableHighAccuracy: true, timeout: 6000 }
      )
    } else if (validVolunteer) {
      mapInstanceRef.current.setView([validVolunteer.lat, validVolunteer.lng], 15)
    } else {
      const bounds = L.latLngBounds([
        [finalPickup.lat, finalPickup.lng],
        [finalDropoff.lat, finalDropoff.lng],
      ])
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] })
    }
  }

  // Toggle fullscreen and invalidate size
  const handleToggleFullscreen = () => {
    const nextState = !isExpanded
    setIsExpanded(nextState)
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize()
      }
    }, 300)
  }

  // Open external Google Maps turn-by-turn navigation from Volunteer Current Location to exact Donor / Receiver Profile Location
  const openExternalRoute = (targetType = 'pickup') => {
    // 1. Resolve destination:
    // Strictly prioritize the real profile address entered by donor or receiver!
    let destinationParam = ''
    if (targetType === 'pickup') {
      const cleanPickup = (pickupAddress || '').trim()
      const isGeneric = !cleanPickup || ['Donor Pickup Location', 'Donor Pickup', 'Donor Address', 'Indore'].includes(cleanPickup)
      if (!isGeneric) {
        destinationParam = encodeURIComponent(cleanPickup)
      } else if (pickupCoords?.lat != null && pickupCoords?.lng != null) {
        destinationParam = `${pickupCoords.lat},${pickupCoords.lng}`
      } else if (validPickup) {
        destinationParam = `${validPickup.lat},${validPickup.lng}`
      } else {
        destinationParam = `${finalPickup.lat},${finalPickup.lng}`
      }
    } else {
      // dropoff
      const cleanDropoff = (dropoffAddress || '').trim()
      const isGeneric = !cleanDropoff || ['Receiver Delivery Address', 'Receiver Drop-off', 'Receiver Address', 'Indore'].includes(cleanDropoff)
      if (!isGeneric) {
        destinationParam = encodeURIComponent(cleanDropoff)
      } else if (dropoffCoords?.lat != null && dropoffCoords?.lng != null) {
        destinationParam = `${dropoffCoords.lat},${dropoffCoords.lng}`
      } else if (validDropoff) {
        destinationParam = `${validDropoff.lat},${validDropoff.lng}`
      } else {
        destinationParam = `${finalDropoff.lat},${finalDropoff.lng}`
      }
    }

    // 2. Travel mode mapped from volunteer vehicle
    const travelMode =
      volunteerTransport === 'walking'
        ? 'walking'
        : volunteerTransport === 'bicycle'
        ? 'bicycling'
        : volunteerTransport === 'motorcycle'
        ? 'two_wheeler'
        : 'driving'

    const launchMapUrl = (originParam) => {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destinationParam}&travelmode=${travelMode}`
      window.open(url, '_blank', 'noopener,noreferrer')
    }

    // 3. Origin: volunteer live GPS location (current device location)
    if (typeof window !== 'undefined' && navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(6))
          const lng = Number(pos.coords.longitude.toFixed(6))
          launchMapUrl(`${lat},${lng}`)
        },
        () => {
          if (volunteerCoords?.lat != null && volunteerCoords?.lng != null) {
            launchMapUrl(`${volunteerCoords.lat},${volunteerCoords.lng}`)
          } else {
            launchMapUrl('Current+Location')
          }
        },
        { enableHighAccuracy: true, timeout: 3500 }
      )
    } else if (volunteerCoords?.lat != null && volunteerCoords?.lng != null) {
      launchMapUrl(`${volunteerCoords.lat},${volunteerCoords.lng}`)
    } else {
      launchMapUrl('Current+Location')
    }
  }

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 shadow-xs transition-all ${
        isExpanded ? 'fixed inset-4 z-50 shadow-2xl bg-white' : ''
      }`}
      style={{ height: isExpanded ? 'calc(100vh - 32px)' : height }}
    >
      {/* Map Leaflet Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Floating Header Card */}
      <div className="absolute top-3 left-3 right-3 sm:right-auto z-10 flex flex-wrap items-center gap-2 pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-gray-200/80 shadow-md flex items-center gap-2.5 pointer-events-auto">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs font-bold text-gray-900">
            {['picked_up_by_volunteer', 'picked_up', 'out_for_delivery', 'in_transit'].includes(status)
              ? 'Courier In Transit'
              : status === 'volunteer_assigned'
              ? 'Volunteer Assigned (To Pickup)'
              : 'Direct Exchange Route'}
          </span>
          {routeInfo.distanceKm && (
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              ~{routeInfo.distanceKm} km · ETA {routeInfo.etaMinutes}m
            </span>
          )}
        </div>
      </div>

      {/* Top-Right Control Buttons */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
        {/* Vertical Zoom Controls (Plus & Minus) */}
        <div className="flex flex-col rounded-xl overflow-hidden border border-gray-200 shadow-md bg-white/95 backdrop-blur-md">
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="p-2 hover:bg-emerald-50 text-gray-700 hover:text-[#2E7D32] transition-colors border-b border-gray-100 flex items-center justify-center cursor-pointer"
            title="Zoom In (+)"
            aria-label="Zoom In"
          >
            <Plus className="w-4 h-4 text-gray-800" />
          </button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="p-2 hover:bg-emerald-50 text-gray-700 hover:text-[#2E7D32] transition-colors flex items-center justify-center cursor-pointer"
            title="Zoom Out (-)"
            aria-label="Zoom Out"
          >
            <Minus className="w-4 h-4 text-gray-800" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleRecenterVolunteer}
          className="p-2 bg-white/95 backdrop-blur-md hover:bg-emerald-50 text-gray-700 hover:text-[#2E7D32] rounded-xl border border-gray-200 shadow-md transition-colors cursor-pointer"
          title="Current Location / Re-center Route"
          aria-label="Current Location / Re-center Route"
        >
          <LocateFixed className="w-4 h-4 text-emerald-700" />
        </button>

        <button
          type="button"
          onClick={handleToggleFullscreen}
          className="p-2 bg-white/95 backdrop-blur-md hover:bg-emerald-50 text-gray-700 hover:text-[#2E7D32] rounded-xl border border-gray-200 shadow-md transition-colors cursor-pointer"
          title={isExpanded ? 'Minimize Map' : 'Full Screen Map'}
          aria-label={isExpanded ? 'Minimize Map' : 'Full Screen Map'}
        >
          {isExpanded ? <Minimize2 className="w-4 h-4 text-gray-700" /> : <Maximize2 className="w-4 h-4 text-gray-700" />}
        </button>
      </div>

      {/* Geolocation feedback notice */}
      {geoNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-gray-900/90 backdrop-blur-md text-white text-[11px] font-semibold px-3.5 py-1.5 rounded-full shadow-lg pointer-events-none transition-all">
          {geoNotice}
        </div>
      )}

      {/* Bottom Floating Navigation Toolbar */}
      {showExternalNav && (
        <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          {/* Legend */}
          <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-gray-200/80 shadow-md flex items-center gap-3 text-[11px] font-medium text-gray-700 pointer-events-auto">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D32]" />
              <strong>A:</strong> Pickup
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1565C0]" />
              <strong>B:</strong> Drop-off
            </span>
            {validVolunteer && (
              <span className="flex items-center gap-1 text-emerald-700 font-bold">
                🛵 Courier Live
              </span>
            )}
          </div>

          {/* Quick Turn-by-Turn GPS Launcher (Especially useful for Volunteers) */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {userRole === 'volunteer' ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => openExternalRoute('pickup')}
                  className="px-3 py-1.5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Open GPS Navigation from current location to Donor"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Navigate to Pickup</span>
                </button>
                <button
                  type="button"
                  onClick={() => openExternalRoute('dropoff')}
                  className="px-3 py-1.5 bg-[#1565C0] hover:bg-[#0D47A1] text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Open GPS Navigation from current location to Receiver"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Navigate to Drop-off</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openExternalRoute('dropoff')}
                className="px-3 py-1.5 bg-white/95 backdrop-blur-md hover:bg-white text-gray-700 rounded-xl text-xs font-bold border border-gray-200 shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Open in Google Maps"
              >
                <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                <span>Open in Maps</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
