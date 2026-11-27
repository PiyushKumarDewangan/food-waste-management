import { useEffect, useRef, useState, useMemo } from 'react'
import L from 'leaflet'
import {
  Navigation,
  Maximize2,
  Minimize2,
  ExternalLink,
  Plus,
  Minus,
  LocateFixed,
  Route as RouteIcon,
  Layers,
  Clock,
  MapPin,
  CheckCircle2,
  Sparkles,
  Bike,
  Car,
  Footprints,
} from 'lucide-react'
import { getRoadRoute, geocodeAddress } from '../../services/mapsService'

// Default center (Bhilai / Durg / Raipur central corridor)
const DEFAULT_CENTER = { lat: 21.2144, lng: 81.3805 }

// Standard Google Encoded Polyline decoder
function decodePolyline(encoded) {
  if (!encoded || typeof encoded !== 'string') return []
  const points = []
  let index = 0,
    len = encoded.length
  let lat = 0,
    lng = 0

  while (index < len) {
    let b,
      shift = 0,
      result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    const dlat = result & 1 ? ~(result >> 1) : result >> 1
    lat += dlat

    shift = 0
    result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    const dlng = result & 1 ? ~(result >> 1) : result >> 1
    lng += dlng

    points.push([lat / 1e5, lng / 1e5])
  }
  return points
}

export default function LiveTrackingMap({
  pickupCoords,
  dropoffCoords,
  volunteerCoords,
  pickupAddress = 'Donor Pickup Location',
  dropoffAddress = 'Receiver Delivery Address',
  volunteerName = 'Volunteer Courier',
  volunteerTransport = 'bicycle',
  status = 'in_transit',
  height = '380px',
  showExternalNav = true,
  userRole = 'donor', // 'donor' | 'receiver' | 'volunteer' | 'admin'
}) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const tileLayerRef = useRef(null)
  const glowPolylineRef = useRef(null)
  const markersRef = useRef({
    pickup: null,
    dropoff: null,
    volunteer: null,
    polyline: null,
  })

  const [isExpanded, setIsExpanded] = useState(false)
  const [mapStyle, setMapStyle] = useState('streets') // 'streets' | 'satellite'
  const [routeInfo, setRouteInfo] = useState({ distanceKm: null, etaMinutes: null })
  const [roadPolylinePoints, setRoadPolylinePoints] = useState(null)
  const [isRoadRouted, setIsRoadRouted] = useState(false)
  const [geoNotice, setGeoNotice] = useState('')

  // Determine if the current active delivery phase is Pickup (Phase 1) or Dropoff (Phase 2)
  const isPostHandover = [
    'picked_up_by_volunteer',
    'picked_up',
    'out_for_delivery',
    'in_transit',
    'completed',
    'delivered',
  ].includes(status)

  // Leg switcher: strictly for DONOR dashboard to toggle between 'pickup' (Leg 1: volunteer arriving) and 'dropoff' (Leg 2: drop-off to receiver)
  // For Receiver: shows distance from donor to receiver ('dropoff')
  // For Volunteer: automatically follows active run step (pickup before handover, dropoff after handover)
  const [selectedLeg, setSelectedLeg] = useState(isPostHandover ? 'dropoff' : 'pickup')

  // Automatically sync active leg when status advances
  useEffect(() => {
    setSelectedLeg(isPostHandover ? 'dropoff' : 'pickup')
  }, [isPostHandover, status])

  const activeLeg =
    userRole === 'donor'
      ? selectedLeg
      : userRole === 'receiver'
      ? 'dropoff'
      : isPostHandover
      ? 'dropoff'
      : 'pickup'

  // 1. Asynchronously resolve missing or degenerate coordinates using real Geocoding
  const [resolvedCoords, setResolvedCoords] = useState({
    pickup:
      pickupCoords?.lat != null && pickupCoords?.lng != null
        ? { lat: Number(pickupCoords.lat), lng: Number(pickupCoords.lng) }
        : null,
    dropoff:
      dropoffCoords?.lat != null && dropoffCoords?.lng != null
        ? { lat: Number(dropoffCoords.lat), lng: Number(dropoffCoords.lng) }
        : null,
  })

  useEffect(() => {
    let isCancelled = false

    async function resolveCoordinates() {
      let p =
        pickupCoords?.lat != null && pickupCoords?.lng != null
          ? { lat: Number(pickupCoords.lat), lng: Number(pickupCoords.lng) }
          : null
      let d =
        dropoffCoords?.lat != null && dropoffCoords?.lng != null
          ? { lat: Number(dropoffCoords.lat), lng: Number(dropoffCoords.lng) }
          : null

      // Check if coordinates are suspiciously identical (< 0.2 km) while addresses differ
      const isSuspectIdentical =
        p &&
        d &&
        Math.abs(p.lat - d.lat) < 0.002 &&
        Math.abs(p.lng - d.lng) < 0.002 &&
        pickupAddress &&
        dropoffAddress &&
        pickupAddress.trim().toLowerCase() !== dropoffAddress.trim().toLowerCase()

      if (!p || isSuspectIdentical) {
        if (pickupAddress && pickupAddress !== 'Donor Pickup Location') {
          const geoP = await geocodeAddress(pickupAddress)
          if (geoP && !isCancelled) {
            p = { lat: geoP.lat, lng: geoP.lng }
          }
        }
      }

      if (!d || isSuspectIdentical) {
        if (dropoffAddress && dropoffAddress !== 'Receiver Delivery Address') {
          const geoD = await geocodeAddress(dropoffAddress)
          if (geoD && !isCancelled) {
            d = { lat: geoD.lat, lng: geoD.lng }
          }
        }
      }

      // Accurate Chhattisgarh defaults if geocoding fails
      if (!p) {
        const lowerP = (pickupAddress || '').toLowerCase()
        if (lowerP.includes('bhilai') || lowerP.includes('sector')) {
          p = { lat: 21.1965, lng: 81.3552 } // Sector 4 Bhilai
        } else {
          p = DEFAULT_CENTER
        }
      }

      if (!d) {
        const lowerD = (dropoffAddress || '').toLowerCase()
        if (lowerD.includes('tikrapara') || lowerD.includes('raipur')) {
          d = { lat: 21.2269, lng: 81.6366 } // Tikrapara Raipur
        } else {
          d = { lat: p.lat + 0.03, lng: p.lng + 0.25 }
        }
      }

      if (!isCancelled) {
        setResolvedCoords({ pickup: p, dropoff: d })
      }
    }

    resolveCoordinates()

    return () => {
      isCancelled = true
    }
  }, [
    pickupCoords?.lat,
    pickupCoords?.lng,
    dropoffCoords?.lat,
    dropoffCoords?.lng,
    pickupAddress,
    dropoffAddress,
  ])

  const finalPickup = resolvedCoords.pickup || DEFAULT_CENTER
  const finalDropoff =
    resolvedCoords.dropoff || { lat: finalPickup.lat + 0.03, lng: finalPickup.lng + 0.25 }

  // Volunteer courier position along the route
  const validVolunteer = useMemo(() => {
    if (volunteerCoords?.lat != null && volunteerCoords?.lng != null) {
      return { lat: Number(volunteerCoords.lat), lng: Number(volunteerCoords.lng) }
    }
    if (['picked_up_by_volunteer', 'picked_up', 'out_for_delivery', 'in_transit'].includes(status)) {
      return {
        lat: Number((finalPickup.lat * 0.45 + finalDropoff.lat * 0.55).toFixed(6)),
        lng: Number((finalPickup.lng * 0.45 + finalDropoff.lng * 0.55).toFixed(6)),
      }
    }
    if (status === 'volunteer_assigned' || status === 'assigned') {
      return {
        lat: Number((finalPickup.lat + 0.014).toFixed(6)),
        lng: Number((finalPickup.lng - 0.016).toFixed(6)),
      }
    }
    return null
  }, [
    volunteerCoords?.lat,
    volunteerCoords?.lng,
    status,
    finalPickup.lat,
    finalPickup.lng,
    finalDropoff.lat,
    finalDropoff.lng,
  ])

  // 2. Compute Road Route based on Active Phase / Active Leg
  useEffect(() => {
    let isCancelled = false

    async function fetchRoadRoute() {
      // Determine origin and destination for the current leg
      let originLat, originLng, destLat, destLng, originAddr, destAddr

      if (activeLeg === 'pickup' && validVolunteer) {
        // Phase 1 Leg: Volunteer Courier -> Donor Pickup Location
        originLat = validVolunteer.lat
        originLng = validVolunteer.lng
        destLat = finalPickup.lat
        destLng = finalPickup.lng
        originAddr = 'Volunteer Courier'
        destAddr = pickupAddress
      } else {
        // Phase 2 Leg: Donor Pickup -> Receiver Dropoff Location
        originLat = finalPickup.lat
        originLng = finalPickup.lng
        destLat = finalDropoff.lat
        destLng = finalDropoff.lng
        originAddr = pickupAddress
        destAddr = dropoffAddress
      }

      if (!originLat || !destLat) return

      try {
        const route = await getRoadRoute({
          originLat,
          originLng,
          destLat,
          destLng,
          originAddress: originAddr,
          destAddress: destAddr,
          travelMode: volunteerTransport,
        })

        if (isCancelled) return

        if (route && route.encodedPolyline) {
          const decoded = decodePolyline(route.encodedPolyline)
          if (decoded && decoded.length > 0) {
            setRoadPolylinePoints(decoded)
            setIsRoadRouted(true)
            setRouteInfo({
              distanceKm: route.distanceKm,
              etaMinutes: Math.max(1, Math.round(route.durationSeconds / 60)),
            })
            return
          }
        }
      } catch (err) {
        console.warn('Road route calculation fallback:', err.message)
      }

      // Straight-line fallback math if offline or quota limit
      if (!isCancelled) {
        setIsRoadRouted(false)
        const R = 6371
        const dLat = ((destLat - originLat) * Math.PI) / 180
        const dLon = ((destLng - originLng) * Math.PI) / 180
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((originLat * Math.PI) / 180) *
            Math.cos((destLat * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const dist = Number((R * c).toFixed(1))
        const eta = Math.max(5, Math.round((dist / 30) * 60) + 3)
        setRouteInfo({ distanceKm: dist, etaMinutes: eta })
      }
    }

    fetchRoadRoute()

    return () => {
      isCancelled = true
    }
  }, [
    activeLeg,
    finalPickup.lat,
    finalPickup.lng,
    finalDropoff.lat,
    finalDropoff.lng,
    validVolunteer?.lat,
    validVolunteer?.lng,
    pickupAddress,
    dropoffAddress,
    volunteerTransport,
  ])

  // Custom Modern Markers
  const createDonorIcon = () =>
    L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; filter: drop-shadow(0 6px 14px rgba(16,185,129,0.4));">
          <div style="background: linear-gradient(135deg, #10B981 0%, #047857 100%); color: #fff; width: 36px; height: 36px; border-radius: 50% 50% 50% 4px; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2.5px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.25);">
            <div style="transform: rotate(45deg); font-weight: 900; font-size: 14px; letter-spacing: -0.5px;">A</div>
          </div>
          <span style="background: #064E3B; color: #ECFDF5; font-size: 10px; font-weight: 700; padding: 2.5px 8px; border-radius: 9999px; margin-top: 4px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2);">
            Donor Pickup · ${(pickupAddress || 'Donor').split(',')[0]}
          </span>
        </div>
      `,
      iconSize: [140, 64],
      iconAnchor: [70, 48],
    })

  const createReceiverIcon = () =>
    L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; filter: drop-shadow(0 6px 14px rgba(37,99,235,0.4));">
          <div style="background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color: #fff; width: 36px; height: 36px; border-radius: 50% 50% 50% 4px; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2.5px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.25);">
            <div style="transform: rotate(45deg); font-weight: 900; font-size: 14px; letter-spacing: -0.5px;">B</div>
          </div>
          <span style="background: #1E3A8A; color: #EFF6FF; font-size: 10px; font-weight: 700; padding: 2.5px 8px; border-radius: 9999px; margin-top: 4px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2);">
            Receiver Drop-off · ${(dropoffAddress || 'Receiver').split(',')[0]}
          </span>
        </div>
      `,
      iconSize: [140, 64],
      iconAnchor: [70, 48],
    })

  const createVolunteerIcon = () =>
    L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="position: absolute; top: -6px; width: 50px; height: 50px; background: rgba(16,185,129,0.35); border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #fff; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 6px 16px rgba(16,185,129,0.5); border: 3px solid #fff; z-index: 2;">
            🛵
          </div>
          <span style="background: rgba(6, 78, 59, 0.95); backdrop-filter: blur(4px); color: #fff; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 9999px; margin-top: 4px; white-space: nowrap; box-shadow: 0 3px 8px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.25); z-index: 2;">
            ${(volunteerName || 'Volunteer').split(' ')[0]} (Courier)
          </span>
        </div>
      `,
      iconSize: [130, 68],
      iconAnchor: [65, 46],
    })

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
      }).setView([finalPickup.lat, finalPickup.lng], 13)

      const streetLayer = L.tileLayer(
        'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        {
          subdomains: ['a', 'b', 'c'],
          maxZoom: 19,
        }
      ).addTo(map)

      tileLayerRef.current = streetLayer
      mapInstanceRef.current = map
    }

    const map = mapInstanceRef.current

    // Tile style toggle
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current)
      if (mapStyle === 'satellite') {
        tileLayerRef.current = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          { maxZoom: 18 }
        ).addTo(map)
      } else {
        tileLayerRef.current = L.tileLayer(
          'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
          { subdomains: ['a', 'b', 'c'], maxZoom: 19 }
        ).addTo(map)
      }
    }

    // Clean up old markers
    if (markersRef.current.pickup) map.removeLayer(markersRef.current.pickup)
    if (markersRef.current.dropoff) map.removeLayer(markersRef.current.dropoff)
    if (markersRef.current.volunteer) map.removeLayer(markersRef.current.volunteer)
    if (markersRef.current.polyline) map.removeLayer(markersRef.current.polyline)
    if (glowPolylineRef.current) map.removeLayer(glowPolylineRef.current)

    // Add Donor Marker (A)
    const donorMarker = L.marker([finalPickup.lat, finalPickup.lng], {
      icon: createDonorIcon(),
      zIndexOffset: 120,
    })
      .bindPopup(
        `<div style="font-family: inherit; padding: 4px;"><strong>Pickup Location (Donor)</strong><br/><span style="color: #4B5563;">${pickupAddress}</span></div>`
      )
      .addTo(map)
    markersRef.current.pickup = donorMarker

    // Add Receiver Marker (B)
    const receiverMarker = L.marker([finalDropoff.lat, finalDropoff.lng], {
      icon: createReceiverIcon(),
      zIndexOffset: 100,
    })
      .bindPopup(
        `<div style="font-family: inherit; padding: 4px;"><strong>Drop-off Location (Receiver)</strong><br/><span style="color: #4B5563;">${dropoffAddress}</span></div>`
      )
      .addTo(map)
    markersRef.current.dropoff = receiverMarker

    // Add Courier Marker if active
    if (validVolunteer) {
      const volMarker = L.marker([validVolunteer.lat, validVolunteer.lng], {
        icon: createVolunteerIcon(),
        zIndexOffset: 250,
      })
        .bindPopup(
          `<div style="font-family: inherit; padding: 4px;"><strong>Courier: ${volunteerName}</strong><br/>Status: ${status.replace(
            /_/g,
            ' '
          )}</div>`
        )
        .addTo(map)
      markersRef.current.volunteer = volMarker
    }

    // Active Route Polyline
    let fallbackPoints = []
    if (activeLeg === 'pickup' && validVolunteer) {
      fallbackPoints = [
        [validVolunteer.lat, validVolunteer.lng],
        [finalPickup.lat, finalPickup.lng],
      ]
    } else {
      fallbackPoints = [
        [finalPickup.lat, finalPickup.lng],
        [finalDropoff.lat, finalDropoff.lng],
      ]
    }

    const activeRoute =
      roadPolylinePoints && roadPolylinePoints.length > 0 ? roadPolylinePoints : fallbackPoints

    // 1. Ambient Glow Ribbon
    const glowLine = L.polyline(activeRoute, {
      color: activeLeg === 'pickup' ? '#10B981' : '#3B82F6',
      weight: 10,
      opacity: 0.32,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map)
    glowPolylineRef.current = glowLine

    // 2. High-contrast Road Core
    const coreLine = L.polyline(activeRoute, {
      color: activeLeg === 'pickup' ? '#047857' : '#1D4ED8',
      weight: 4.5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
      dashArray: roadPolylinePoints ? undefined : '8, 8',
    }).addTo(map)
    markersRef.current.polyline = coreLine

    // Fit bounds appropriately around the active leg points
    try {
      let focusCoords = []
      if (activeLeg === 'pickup' && validVolunteer) {
        focusCoords = [
          [validVolunteer.lat, validVolunteer.lng],
          [finalPickup.lat, finalPickup.lng],
        ]
      } else {
        focusCoords = [
          [finalPickup.lat, finalPickup.lng],
          [finalDropoff.lat, finalDropoff.lng],
        ]
        if (validVolunteer && isPostHandover) {
          focusCoords.push([validVolunteer.lat, validVolunteer.lng])
        }
      }

      if (roadPolylinePoints && roadPolylinePoints.length > 0) {
        roadPolylinePoints.forEach((pt) => focusCoords.push(pt))
      }

      const bounds = L.latLngBounds(focusCoords)
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 })
    } catch (e) {
      // bounds fallback
    }

    setTimeout(() => {
      map.invalidateSize()
    }, 200)
  }, [
    finalPickup.lat,
    finalPickup.lng,
    finalDropoff.lat,
    finalDropoff.lng,
    validVolunteer?.lat,
    validVolunteer?.lng,
    roadPolylinePoints,
    mapStyle,
    status,
    activeLeg,
    isExpanded,
  ])

  // Recenter map
  const handleRecenter = () => {
    if (!mapInstanceRef.current) return
    const allCoords = [
      [finalPickup.lat, finalPickup.lng],
      [finalDropoff.lat, finalDropoff.lng],
    ]
    if (validVolunteer) {
      allCoords.push([validVolunteer.lat, validVolunteer.lng])
    }
    const bounds = L.latLngBounds(allCoords)
    mapInstanceRef.current.fitBounds(bounds, { padding: [65, 65], maxZoom: 14 })
    setGeoNotice('Route view centered')
    setTimeout(() => setGeoNotice(''), 2500)
  }

  const handleToggleFullscreen = () => {
    setIsExpanded((prev) => !prev)
    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize()
    }, 300)
  }

  // External GPS Launcher - ALWAYS PRIORITIZE EXACT GPS COORDINATES
  const openExternalRoute = (targetType = 'pickup') => {
    let destCoord = ''
    if (targetType === 'pickup') {
      destCoord =
        finalPickup?.lat != null && finalPickup?.lng != null
          ? `${finalPickup.lat},${finalPickup.lng}`
          : encodeURIComponent((pickupAddress || '').trim() || 'Sector 4 Bhilai')
    } else {
      destCoord =
        finalDropoff?.lat != null && finalDropoff?.lng != null
          ? `${finalDropoff.lat},${finalDropoff.lng}`
          : encodeURIComponent((dropoffAddress || '').trim() || 'Tikrapara Raipur')
    }

    const travelMode =
      volunteerTransport === 'walking'
        ? 'walking'
        : volunteerTransport === 'bicycle'
        ? 'bicycling'
        : volunteerTransport === 'motorcycle'
        ? 'two_wheeler'
        : 'driving'

    const url = `https://www.google.com/maps/dir/?api=1&origin=Current+Location&destination=${destCoord}&travelmode=${travelMode}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  // Status and Phase Details
  const phaseTitle = useMemo(() => {
    if (userRole === 'receiver') {
      return isPostHandover
        ? 'Courier Out for Delivery to Your Location'
        : 'Courier Assigned · En Route to Donor Pickup'
    }
    if (userRole === 'donor') {
      return activeLeg === 'pickup'
        ? 'Leg 1: Courier Arriving to Pickup Food'
        : 'Leg 2: Food Collected · Out for Delivery to Receiver'
    }
    return isPostHandover
      ? 'En Route to Drop-off Recipient'
      : 'En Route to Donor Pickup'
  }, [userRole, activeLeg, isPostHandover])

  const legSubtitle = useMemo(() => {
    if (activeLeg === 'pickup') {
      return `${(volunteerName || 'Volunteer Courier').split(' ')[0]} ➔ ${(pickupAddress || 'Donor Pickup').split(',')[0]}`
    }
    return `${(pickupAddress || 'Donor Pickup').split(',')[0]} ➔ ${(dropoffAddress || 'Receiver Drop-off').split(',')[0]}`
  }, [activeLeg, volunteerName, pickupAddress, dropoffAddress])

  return (
    <div
      className={`relative rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm bg-slate-50 transition-all ${
        isExpanded ? 'fixed inset-4 z-50 shadow-2xl bg-white' : ''
      }`}
      style={{ height: isExpanded ? 'calc(100vh - 32px)' : height }}
    >
      {/* Map Leaflet Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Modern Top-Left Floating HUD */}
      <div className="absolute top-3 left-3 right-3 sm:right-auto z-10 flex flex-col gap-2 pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-200/80 shadow-xl flex flex-col gap-2 pointer-events-auto max-w-md">
          {/* Status Row with Phase Beacon */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    activeLeg === 'pickup' ? 'bg-emerald-400' : 'bg-blue-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    activeLeg === 'pickup' ? 'bg-emerald-600' : 'bg-blue-600'
                  }`}
                />
              </span>
              <span className="text-xs font-black text-slate-800 tracking-tight">
                {phaseTitle}
              </span>
            </div>

            {/* Live Distance & ETA metrics pill */}
            {routeInfo.distanceKm != null && (
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 shadow-2xs ${
                  activeLeg === 'pickup'
                    ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                    : 'text-blue-800 bg-blue-50 border-blue-200'
                }`}
              >
                <RouteIcon className="w-3.5 h-3.5" />
                <span>{routeInfo.distanceKm} km</span>
                <span className="opacity-40">·</span>
                <Clock className="w-3 h-3" />
                <span>ETA {routeInfo.etaMinutes}m</span>
              </span>
            )}
          </div>

          {/* Interactive Leg Switcher Tabs: STRICTLY FOR DONOR DASHBOARD */}
          {userRole === 'donor' && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSelectedLeg('pickup')}
                className={`flex-1 text-[11px] font-bold py-1 px-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeLeg === 'pickup'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🛵 Leg 1: Courier ➔ Pickup</span>
                {!isPostHandover && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setSelectedLeg('dropoff')}
                className={`flex-1 text-[11px] font-bold py-1 px-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeLeg === 'dropoff'
                    ? 'bg-white text-blue-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>📍 Leg 2: Pickup ➔ Drop-off</span>
                {isPostHandover && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                )}
              </button>
            </div>
          )}

          {/* Route path subtitle & road indicator */}
          <div className="text-[11px] text-slate-600 flex items-center justify-between gap-2 font-medium">
            <span className="truncate max-w-[260px] font-semibold text-slate-700">
              {legSubtitle}
            </span>
            {isRoadRouted && (
              <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                Google Road Route
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Top-Right Quick Controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
        {/* Style Toggle (Streets / Satellite) */}
        <button
          type="button"
          onClick={() => setMapStyle((prev) => (prev === 'streets' ? 'satellite' : 'streets'))}
          className="p-2 bg-white/95 backdrop-blur-md hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-xl border border-slate-200/90 shadow-md transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
          title={`Switch to ${mapStyle === 'streets' ? 'Satellite' : 'Clean Streets'} View`}
        >
          <Layers className="w-4 h-4 text-emerald-700" />
          <span className="hidden sm:inline capitalize">
            {mapStyle === 'streets' ? 'Satellite' : 'Streets'}
          </span>
        </button>

        {/* Zoom Controls */}
        <div className="flex flex-col rounded-xl overflow-hidden border border-slate-200/90 shadow-md bg-white/95 backdrop-blur-md">
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="p-2 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 transition-colors border-b border-slate-100 flex items-center justify-center cursor-pointer"
            title="Zoom In (+)"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="p-2 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 transition-colors flex items-center justify-center cursor-pointer"
            title="Zoom Out (-)"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Fit Route */}
        <button
          type="button"
          onClick={handleRecenter}
          className="p-2 bg-white/95 backdrop-blur-md hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-xl border border-slate-200/90 shadow-md transition-colors cursor-pointer"
          title="Fit Current Leg on Screen"
        >
          <LocateFixed className="w-4 h-4 text-emerald-700" />
        </button>

        {/* Fullscreen */}
        <button
          type="button"
          onClick={handleToggleFullscreen}
          className="p-2 bg-white/95 backdrop-blur-md hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-xl border border-slate-200/90 shadow-md transition-colors cursor-pointer"
          title={isExpanded ? 'Minimize Map' : 'Full Screen Map'}
        >
          {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Geolocation Notice */}
      {geoNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-slate-900/90 backdrop-blur-md text-white text-[11px] font-semibold px-4 py-1.5 rounded-full shadow-lg pointer-events-none transition-all">
          {geoNotice}
        </div>
      )}

      {/* Bottom Floating Legend & Navigation Bar */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Modern Clean Legend */}
        <div className="bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-200/80 shadow-md flex items-center gap-3 text-[11px] font-medium text-slate-700 pointer-events-auto">
          <span className="flex items-center gap-1.5 font-semibold text-emerald-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
            <span>A: {pickupAddress.split(',')[0]}</span>
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1.5 font-semibold text-blue-800">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-xs" />
            <span>B: {dropoffAddress.split(',')[0]}</span>
          </span>
          {validVolunteer && (
            <>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1 text-emerald-700 font-extrabold">
                🛵 Courier Active
              </span>
            </>
          )}
        </div>

        {/* Navigation Action Buttons: STRICTLY for Volunteer */}
        {showExternalNav && userRole === 'volunteer' && (
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={() => openExternalRoute('pickup')}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Open GPS Navigation directly to Donor coordinates in Google Maps"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Navigate to Pickup</span>
            </button>
            <button
              type="button"
              onClick={() => openExternalRoute('dropoff')}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Open GPS Navigation directly to Receiver coordinates in Google Maps"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Navigate to Drop-off</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
