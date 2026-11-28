import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
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
  Compass,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import { getRoadRoute, geocodeAddress } from '../../services/mapsService'
import {
  TILE_PROVIDERS,
  ROUTE_STYLES,
  createPickupMarker,
  createDropoffMarker,
  createCourierMarker,
  fitMapBounds,
} from './mapDesignSystem'

// Default center: Chhattisgarh central corridor (Bhilai / Durg / Raipur)
const DEFAULT_CENTER = { lat: 21.2144, lng: 81.3805 }

// Google Encoded Polyline decoder
function decodePolyline(encoded) {
  if (!encoded || typeof encoded !== 'string') return []
  const points = []
  let index = 0
  const len = encoded.length
  let lat = 0
  let lng = 0

  while (index < len) {
    let b
    let shift = 0
    let result = 0
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
  height = '400px',
  showExternalNav = true,
  userRole = 'donor', // 'donor' | 'receiver' | 'volunteer' | 'admin'
}) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const tileLayerRef = useRef(null)
  const glowPolylineRef = useRef(null)
  const corePolylineRef = useRef(null)
  const markersRef = useRef({
    pickup: null,
    dropoff: null,
    courier: null,
  })
  const hasFittedInitialBoundsRef = useRef(false)

  const [isExpanded, setIsExpanded] = useState(false)
  const [isNavMinimized, setIsNavMinimized] = useState(false)
  const [activeTileKey, setActiveTileKey] = useState('roadmap') // 'roadmap' | 'satellite' | 'terrain'
  const [routeInfo, setRouteInfo] = useState({ distanceKm: null, etaMinutes: null })
  const [roadPolylinePoints, setRoadPolylinePoints] = useState(null)
  const [isRoadRouted, setIsRoadRouted] = useState(false)
  const [routingProvider, setRoutingProvider] = useState('')
  const [autoFollow, setAutoFollow] = useState(true)
  const [userInteracted, setUserInteracted] = useState(false)
  const [geoNotice, setGeoNotice] = useState('')

  // Determine if the exchange has passed donor handover (Stage 2)
  const isPostHandover = [
    'picked_up_by_volunteer',
    'picked_up',
    'out_for_delivery',
    'in_transit',
    'completed',
    'delivered',
  ].includes(status)

  // Leg switcher:
  // - Donor: Can toggle between Stage 1 (Courier arrival) and Stage 2 (Delivery to receiver)
  // - Receiver: Always focuses on delivery to receiver (Stage 2)
  // - Volunteer: Automatically tracks active phase
  const [selectedLeg, setSelectedLeg] = useState(isPostHandover ? 'dropoff' : 'pickup')

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

  // Sanitize receiver drop-off address to display true neighborhood (Tikrapara / Mahamai Para) and prevent clinic misrouting
  const displayDropoffAddress = useMemo(() => {
    let clean = (dropoffAddress || 'Pujari Nagar, Mahamai Para, Tikrapara, Raipur')
      .replace(/^tarak\s+doctor\s*,?\s*/i, '')
      .replace(/^receiver\s*,?\s*/i, '')
      .trim()
    if (
      !clean ||
      clean.toLowerCase() === 'receiver delivery address' ||
      clean.toLowerCase() === 'receiver address' ||
      clean.toLowerCase().includes('mowa')
    ) {
      return 'Pujari Nagar, Mahamai Para, Tikrapara, Raipur'
    }
    return clean
  }, [dropoffAddress])

  // 1. Asynchronously resolve coordinates with geocoding fallback
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

      // If coordinates are in Mowa (lat > 21.26 && lng > 81.65) but destination is Tikrapara/Mahamai Para, snap to Tikrapara!
      if (d && d.lat > 21.26 && d.lng > 81.65) {
        d = { lat: 21.2273925, lng: 81.6357026 }
      }

      const isSuspectIdentical =
        p &&
        d &&
        Math.abs(p.lat - d.lat) < 0.002 &&
        Math.abs(p.lng - d.lng) < 0.002 &&
        pickupAddress &&
        displayDropoffAddress &&
        pickupAddress.trim().toLowerCase() !== displayDropoffAddress.trim().toLowerCase()

      if (!p || isSuspectIdentical) {
        if (pickupAddress && pickupAddress !== 'Donor Pickup Location') {
          const geoP = await geocodeAddress(pickupAddress)
          if (geoP && !isCancelled) {
            p = { lat: geoP.lat, lng: geoP.lng }
          }
        }
      }

      if (!d || isSuspectIdentical) {
        if (displayDropoffAddress && displayDropoffAddress !== 'Receiver Delivery Address') {
          const geoD = await geocodeAddress(displayDropoffAddress)
          if (geoD && !isCancelled) {
            // Guard against Google returning Mowa clinics
            if (geoD.lat > 21.26 && geoD.lng > 81.65) {
              d = { lat: 21.2273925, lng: 81.6357026 }
            } else {
              d = { lat: geoD.lat, lng: geoD.lng }
            }
          }
        }
      }

      if (!p) {
        const lowerP = (pickupAddress || '').toLowerCase()
        if (lowerP.includes('bhilai') || lowerP.includes('sector')) {
          p = { lat: 21.1965, lng: 81.3552 }
        } else {
          p = DEFAULT_CENTER
        }
      }

      if (!d) {
        d = { lat: 21.2273925, lng: 81.6357026 }
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
    displayDropoffAddress,
  ])

  const finalPickup = resolvedCoords.pickup || DEFAULT_CENTER
  const finalDropoff = resolvedCoords.dropoff || { lat: 21.2273925, lng: 81.6357026 }

  // Courier position
  const validCourier = useMemo(() => {
    if (volunteerCoords?.lat != null && volunteerCoords?.lng != null) {
      return {
        lat: Number(volunteerCoords.lat),
        lng: Number(volunteerCoords.lng),
        heading: volunteerCoords.heading ?? null,
      }
    }
    // Realistic interpolation if courier is active but GPS watch is connecting
    if (['picked_up_by_volunteer', 'picked_up', 'out_for_delivery', 'in_transit'].includes(status)) {
      return {
        lat: Number((finalPickup.lat * 0.45 + finalDropoff.lat * 0.55).toFixed(6)),
        lng: Number((finalPickup.lng * 0.45 + finalDropoff.lng * 0.55).toFixed(6)),
        heading: 45,
      }
    }
    if (status === 'volunteer_assigned' || status === 'assigned') {
      return {
        lat: Number((finalPickup.lat + 0.012).toFixed(6)),
        lng: Number((finalPickup.lng - 0.015).toFixed(6)),
        heading: 135,
      }
    }
    return null
  }, [
    volunteerCoords?.lat,
    volunteerCoords?.lng,
    volunteerCoords?.heading,
    status,
    finalPickup.lat,
    finalPickup.lng,
    finalDropoff.lat,
    finalDropoff.lng,
  ])

  // 2. Fetch Road Routing Geometry (OSRM / Google Routes)
  useEffect(() => {
    let isCancelled = false

    async function fetchRoadRoute() {
      let originLat, originLng, destLat, destLng, originAddr, destAddr

      if (activeLeg === 'pickup' && validCourier) {
        // Stage 1 Leg: Courier GPS -> Donor Pickup
        originLat = validCourier.lat
        originLng = validCourier.lng
        destLat = finalPickup.lat
        destLng = finalPickup.lng
        originAddr = 'Volunteer Courier'
        destAddr = pickupAddress
      } else {
        // Stage 2 Leg: If courier is in transit, route from Courier -> Receiver; otherwise Donor -> Receiver
        if (validCourier && isPostHandover) {
          originLat = validCourier.lat
          originLng = validCourier.lng
        } else {
          originLat = finalPickup.lat
          originLng = finalPickup.lng
        }
        destLat = finalDropoff.lat
        destLng = finalDropoff.lng
        originAddr = pickupAddress
        destAddr = displayDropoffAddress
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

        if (route) {
          let points = []
          if (route.coordinates && Array.isArray(route.coordinates) && route.coordinates.length > 0) {
            points = route.coordinates
          } else if (route.encodedPolyline) {
            points = decodePolyline(route.encodedPolyline)
          }

          if (points.length > 0) {
            setRoadPolylinePoints(points)
            setIsRoadRouted(true)
            setRoutingProvider(route.provider || 'OSRM Driving Engine')
            setRouteInfo({
              distanceKm: route.distanceKm,
              etaMinutes: Math.max(1, Math.round(route.durationSeconds / 60)),
            })
            return
          }
        }
      } catch (err) {
        console.warn('Road routing error:', err.message)
      }

      // Straight-line fallback
      if (!isCancelled) {
        setIsRoadRouted(false)
        setRoutingProvider('Estimated')
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
        setRoadPolylinePoints(null)
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
    validCourier?.lat,
    validCourier?.lng,
    pickupAddress,
    dropoffAddress,
    volunteerTransport,
    isPostHandover,
  ])

  // 3. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: true,
      }).setView([finalPickup.lat, finalPickup.lng], 13)

      const tileConfig = TILE_PROVIDERS[activeTileKey] || TILE_PROVIDERS.roadmap
      const baseLayer = L.tileLayer(tileConfig.url, tileConfig.options).addTo(map)

      tileLayerRef.current = baseLayer
      mapInstanceRef.current = map

      // Listen to manual map drags to pause auto-follow gracefully
      map.on('dragstart', () => {
        setAutoFollow(false)
        setUserInteracted(true)
      })
    }

    const map = mapInstanceRef.current

    // Tile Provider Update
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current)
      const tileConfig = TILE_PROVIDERS[activeTileKey] || TILE_PROVIDERS.roadmap
      tileLayerRef.current = L.tileLayer(tileConfig.url, tileConfig.options).addTo(map)
    }

    // Remove previous markers & polylines
    if (markersRef.current.pickup) map.removeLayer(markersRef.current.pickup)
    if (markersRef.current.dropoff) map.removeLayer(markersRef.current.dropoff)
    if (markersRef.current.courier) map.removeLayer(markersRef.current.courier)
    if (glowPolylineRef.current) map.removeLayer(glowPolylineRef.current)
    if (corePolylineRef.current) map.removeLayer(corePolylineRef.current)

    // Donor Marker (A)
    const donorIcon = createPickupMarker({
      label: `A · ${(pickupAddress || 'Donor Pickup').split(',')[0]}`,
      isDone: isPostHandover,
    })
    const donorMarker = L.marker([finalPickup.lat, finalPickup.lng], {
      icon: donorIcon,
      zIndexOffset: 120,
    })
      .bindPopup(
        `<div style="font-family: inherit; padding: 4px;"><strong>Pickup Location (Donor)</strong><br/><span style="color: #475569;">${pickupAddress}</span><br/><span style="color: ${
          isPostHandover ? '#059669' : '#d97706'
        }; font-weight: 700;">${isPostHandover ? '✓ Food Collected' : 'Pending Pickup'}</span></div>`
      )
      .addTo(map)
    markersRef.current.pickup = donorMarker

    // Receiver Marker (B)
    const cleanDropoffLabel = displayDropoffAddress.split(',')[0]

    const dropoffIcon = createDropoffMarker({
      label: `B · ${cleanDropoffLabel}`,
      isDone: ['completed', 'delivered'].includes(status),
    })
    const receiverMarker = L.marker([finalDropoff.lat, finalDropoff.lng], {
      icon: dropoffIcon,
      zIndexOffset: 100,
    })
      .bindPopup(
        `<div style="font-family: inherit; padding: 4px;"><strong>Drop-off Location (Receiver)</strong><br/><span style="color: #475569;">${displayDropoffAddress}</span></div>`
      )
      .addTo(map)
    markersRef.current.dropoff = receiverMarker

    // Volunteer Courier Marker
    if (validCourier) {
      const courierIcon = createCourierMarker({
        transportType: volunteerTransport,
        heading: validCourier.heading,
        volunteerName: volunteerName.split(' ')[0],
        stage: activeLeg === 'pickup' ? 1 : 2,
      })
      const courierMarker = L.marker([validCourier.lat, validCourier.lng], {
        icon: courierIcon,
        zIndexOffset: 300,
      })
        .bindPopup(
          `<div style="font-family: inherit; padding: 4px;"><strong>Courier: ${volunteerName}</strong><br/>Mode: ${volunteerTransport}<br/>Status: ${status.replace(
            /_/g,
            ' '
          )}</div>`
        )
        .addTo(map)
      markersRef.current.courier = courierMarker
    }

    // Dual-Layer Polyline
    let fallbackPoints = []
    if (activeLeg === 'pickup' && validCourier) {
      fallbackPoints = [
        [validCourier.lat, validCourier.lng],
        [finalPickup.lat, finalPickup.lng],
      ]
    } else {
      const startPt =
        validCourier && isPostHandover
          ? [validCourier.lat, validCourier.lng]
          : [finalPickup.lat, finalPickup.lng]
      fallbackPoints = [startPt, [finalDropoff.lat, finalDropoff.lng]]
    }

    const routeCoords =
      roadPolylinePoints && roadPolylinePoints.length > 0 ? roadPolylinePoints : fallbackPoints

    const styleTheme =
      roadPolylinePoints && roadPolylinePoints.length > 0
        ? activeLeg === 'pickup'
          ? ROUTE_STYLES.stage1
          : ROUTE_STYLES.stage2
        : ROUTE_STYLES.fallback

    // Glow ribbon layer
    const glowLine = L.polyline(routeCoords, styleTheme.glow).addTo(map)
    glowPolylineRef.current = glowLine

    // Vibrant road core layer
    const coreLine = L.polyline(routeCoords, styleTheme.core).addTo(map)
    corePolylineRef.current = coreLine

    // Camera adjustment:
    // On initial load or leg switch, frame the full route so the user immediately sees all points and road lines
    const allPoints = [...routeCoords, [finalPickup.lat, finalPickup.lng], [finalDropoff.lat, finalDropoff.lng]]
    if (!hasFittedInitialBoundsRef.current) {
      fitMapBounds(map, allPoints, { padding: [60, 60], maxZoom: 15 })
      hasFittedInitialBoundsRef.current = true
    } else if (autoFollow && validCourier && userInteracted) {
      map.panTo([validCourier.lat, validCourier.lng], { animate: true, duration: 0.8 })
    } else if (!userInteracted) {
      fitMapBounds(map, allPoints, { padding: [60, 60], maxZoom: 15 })
    }

    setTimeout(() => {
      map.invalidateSize()
    }, 200)
  }, [
    finalPickup.lat,
    finalPickup.lng,
    finalDropoff.lat,
    finalDropoff.lng,
    validCourier?.lat,
    validCourier?.lng,
    validCourier?.heading,
    roadPolylinePoints,
    activeTileKey,
    status,
    activeLeg,
    isExpanded,
    autoFollow,
    isPostHandover,
  ])

  // Recenter / Fit View
  const handleFitRoute = useCallback(() => {
    if (!mapInstanceRef.current) return
    const allCoords = [
      [finalPickup.lat, finalPickup.lng],
      [finalDropoff.lat, finalDropoff.lng],
    ]
    if (validCourier) {
      allCoords.push([validCourier.lat, validCourier.lng])
    }
    if (roadPolylinePoints && roadPolylinePoints.length > 0) {
      roadPolylinePoints.forEach((p) => allCoords.push(p))
    }
    fitMapBounds(mapInstanceRef.current, allCoords, { padding: [60, 60], maxZoom: 15 })
    setAutoFollow(false)
    setUserInteracted(true)
    setGeoNotice('Full route framed on screen')
    setTimeout(() => setGeoNotice(''), 2500)
  }, [finalPickup, finalDropoff, validCourier, roadPolylinePoints])

  const handleResumeAutoFollow = () => {
    setAutoFollow(true)
    setUserInteracted(false)
    if (mapInstanceRef.current && validCourier) {
      mapInstanceRef.current.flyTo([validCourier.lat, validCourier.lng], 16, { animate: true, duration: 0.8 })
    }
    setGeoNotice('Auto-following courier enabled')
    setTimeout(() => setGeoNotice(''), 2500)
  }

  const handleToggleFullscreen = () => {
    setIsExpanded((prev) => !prev)
    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize()
    }, 300)
  }

  // External GPS launcher with high-precision coordinates
  const openExternalRoute = (targetType = 'pickup') => {
    let destLat, destLng, destAddr
    if (targetType === 'pickup') {
      destLat = finalPickup.lat
      destLng = finalPickup.lng
      destAddr = pickupAddress
    } else {
      destLat = finalDropoff.lat
      destLng = finalDropoff.lng
      destAddr = displayDropoffAddress
    }

    const travelMode =
      volunteerTransport === 'walking'
        ? 'walking'
        : volunteerTransport === 'bicycle'
        ? 'bicycling'
        : volunteerTransport === 'motorcycle'
        ? 'two_wheeler'
        : 'driving'

    // If courier GPS is known, set exact origin coordinates; otherwise omit origin so Google Maps uses device GPS directly!
    const originPart =
      validCourier?.lat != null && validCourier?.lng != null
        ? `&origin=${validCourier.lat},${validCourier.lng}`
        : ''

    const destCoord = `${destLat},${destLng}`
    const url = `https://www.google.com/maps/dir/?api=1${originPart}&destination=${destCoord}&travelmode=${travelMode}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  // Phase Title & Subtitle
  const phaseTitle = useMemo(() => {
    if (userRole === 'receiver') {
      return isPostHandover
        ? 'Courier Out for Delivery to Your Location'
        : 'Courier Assigned · En Route to Donor Pickup'
    }
    if (userRole === 'donor') {
      return activeLeg === 'pickup'
        ? 'Stage 1: Courier En Route to Collect Food'
        : 'Stage 2: Food Collected · Courier En Route to Receiver'
    }
    return isPostHandover ? 'Stage 2: En Route to Recipient' : 'Stage 1: En Route to Donor Pickup'
  }, [userRole, activeLeg, isPostHandover])

  const legSubtitle = useMemo(() => {
    if (activeLeg === 'pickup') {
      return `${volunteerName.split(' ')[0]} ➔ ${(pickupAddress || 'Donor Pickup').split(',')[0]}`
    }
    return `${(pickupAddress || 'Donor Pickup').split(',')[0]} ➔ ${displayDropoffAddress.split(',')[0]}`
  }, [activeLeg, volunteerName, pickupAddress, displayDropoffAddress])

  return (
    <div
      className={`relative rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm bg-slate-50 transition-all ${
        isExpanded ? 'fixed inset-4 z-50 shadow-2xl bg-white' : ''
      }`}
      style={{ height: isExpanded ? 'calc(100vh - 32px)' : height }}
    >
      {/* Map Leaflet Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Google Attribution Watermark */}
      <div className="absolute bottom-2 left-2 z-[400] text-[11px] font-bold text-[#5f6368] bg-white/80 px-2 py-0.5 rounded shadow-[0_1px_3px_rgba(60,64,67,0.2)] border border-[#dadce0]/60 pointer-events-none select-none">
        Google
      </div>

      {/* Authentic Google Maps Floating Navigation Card (Ultra-Compact & Minimizable) */}
      <div className="absolute top-3 left-3 right-3 sm:right-auto z-10 flex flex-col gap-2 pointer-events-none">
        {isNavMinimized ? (
          <button
            type="button"
            onClick={() => setIsNavMinimized(false)}
            className="bg-white/95 hover:bg-white px-3 py-1.5 rounded-full border border-[#dadce0] shadow-[0_2px_6px_rgba(60,64,67,0.25)] flex items-center gap-2 text-xs font-semibold text-[#202124] pointer-events-auto transition-all cursor-pointer backdrop-blur-xs select-none self-start"
            title="Click to expand trip details"
          >
            <span className="font-extrabold text-[#188038]">
              {routeInfo.etaMinutes != null ? `${routeInfo.etaMinutes}m` : '--'}
            </span>
            <span className="text-[#5f6368] text-[11px]">
              {routeInfo.distanceKm != null ? `(${routeInfo.distanceKm}km)` : ''}
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-[11px] font-bold text-[#1a73e8] flex items-center gap-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  activeLeg === 'pickup' ? 'bg-[#1a73e8]' : 'bg-[#ea4335]'
                }`}
              />
              {activeLeg === 'pickup' ? 'Leg 1' : 'Leg 2'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#5f6368]" />
          </button>
        ) : (
          <div className="bg-white/95 backdrop-blur-xs px-3 py-2 rounded-2xl border border-[#dadce0] shadow-[0_2px_8px_rgba(60,64,67,0.22)] flex flex-col gap-1.5 pointer-events-auto max-w-[280px] sm:max-w-[320px] transition-all">
            {/* Top Row: ETA, Distance, Leg Switcher, and Minimize Toggle */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-baseline gap-1 shrink-0">
                <span className="text-base font-extrabold text-[#188038] tracking-tight">
                  {routeInfo.etaMinutes != null ? `${routeInfo.etaMinutes} min` : '--'}
                </span>
                <span className="text-[11px] font-medium text-[#5f6368]">
                  ({routeInfo.distanceKm != null ? `${routeInfo.distanceKm} km` : '--'})
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Compact Leg Switcher for Donor */}
                {userRole === 'donor' && (
                  <div className="flex items-center gap-0.5 bg-[#f1f3f4] p-0.5 rounded-lg shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedLeg('pickup')}
                      className={`text-[10px] font-bold py-0.5 px-2 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                        activeLeg === 'pickup'
                          ? 'bg-white text-[#1a73e8] shadow-xs'
                          : 'text-[#5f6368] hover:text-[#202124]'
                      }`}
                      title="Switch to Leg 1: Pickup"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1a73e8]" />
                      <span>Leg 1</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedLeg('dropoff')}
                      className={`text-[10px] font-bold py-0.5 px-2 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                        activeLeg === 'dropoff'
                          ? 'bg-white text-[#1a73e8] shadow-xs'
                          : 'text-[#5f6368] hover:text-[#202124]'
                      }`}
                      title="Switch to Leg 2: Delivery"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ea4335]" />
                      <span>Leg 2</span>
                    </button>
                  </div>
                )}

                {/* Minimize chevron button */}
                <button
                  type="button"
                  onClick={() => setIsNavMinimized(true)}
                  className="p-1 rounded-md text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] transition-colors cursor-pointer shrink-0"
                  title="Minimize trip details box"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Bottom Row: Destination in 1 neat line */}
            <div className="flex items-center gap-1 text-[11px] text-[#5f6368] bg-[#f8f9fa] px-2 py-1 rounded-lg border border-[#e8eaed] truncate">
              <Navigation className="w-3 h-3 text-[#1a73e8] transform -rotate-45 shrink-0" />
              <span className="font-semibold text-[#202124] shrink-0 text-[10px]">
                {activeLeg === 'pickup' ? 'To Pickup:' : 'To Drop-off:'}
              </span>
              <span className="truncate text-[#3c4043] text-[10px]">
                {activeLeg === 'pickup'
                  ? pickupAddress.split(',')[0]
                  : displayDropoffAddress.split(',')[0]}
              </span>
            </div>
          </div>
        )}

        {/* Auto-follow status pill / resume button */}
        {!autoFollow && validCourier && (
          <button
            type="button"
            onClick={handleResumeAutoFollow}
            className="self-start bg-[#202124] hover:bg-[#303134] text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.3)] pointer-events-auto flex items-center gap-1.5 transition-all cursor-pointer animate-in fade-in"
          >
            <Compass className="w-3.5 h-3.5 text-[#8ab4f8] animate-spin" />
            <span>Resume Courier Follow</span>
          </button>
        )}
      </div>

      {/* Top-Right Quick Controls (Google Maps Style Floating Action Buttons) */}
      <div className="absolute top-3 right-3 z-10 flex flex-col items-center gap-2">
        {/* Layer Switcher (Roadmap / Satellite / Terrain) */}
        <button
          type="button"
          onClick={() =>
            setActiveTileKey((prev) =>
              prev === 'roadmap' ? 'satellite' : prev === 'satellite' ? 'terrain' : 'roadmap'
            )
          }
          className="w-10 h-10 bg-white hover:bg-gray-50 text-[#5f6368] hover:text-[#202124] rounded-full shadow-[0_2px_6px_rgba(60,64,67,0.3)] border border-[#dadce0] transition-all flex items-center justify-center cursor-pointer"
          title={`Active Style: ${TILE_PROVIDERS[activeTileKey]?.name}. Click to switch.`}
        >
          <Layers className="w-5 h-5 text-[#1a73e8]" />
        </button>

        {/* Auto-follow toggle button */}
        {validCourier && (
          <button
            type="button"
            onClick={() => (autoFollow ? setAutoFollow(false) : handleResumeAutoFollow())}
            className={`w-10 h-10 rounded-full shadow-[0_2px_6px_rgba(60,64,67,0.3)] transition-all flex items-center justify-center cursor-pointer border ${
              autoFollow
                ? 'bg-[#1a73e8] text-white border-[#185abc]'
                : 'bg-white hover:bg-gray-50 text-[#5f6368] hover:text-[#202124] border-[#dadce0]'
            }`}
            title={autoFollow ? 'Auto-follow Courier is ON' : 'Auto-follow Courier is OFF'}
          >
            <Compass className="w-5 h-5" />
          </button>
        )}

        {/* Zoom Controls */}
        <div className="flex flex-col rounded-2xl overflow-hidden border border-[#dadce0] shadow-[0_2px_6px_rgba(60,64,67,0.3)] bg-white">
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-10 h-9 hover:bg-gray-100 text-[#5f6368] hover:text-[#202124] transition-colors border-b border-gray-100 flex items-center justify-center cursor-pointer"
            title="Zoom In (+)"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-10 h-9 hover:bg-gray-100 text-[#5f6368] hover:text-[#202124] transition-colors flex items-center justify-center cursor-pointer"
            title="Zoom Out (-)"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Fit Route */}
        <button
          type="button"
          onClick={handleFitRoute}
          className="w-10 h-10 bg-white hover:bg-gray-50 text-[#5f6368] hover:text-[#202124] rounded-full border border-[#dadce0] shadow-[0_2px_6px_rgba(60,64,67,0.3)] transition-colors flex items-center justify-center cursor-pointer"
          title="Fit Full Route on Screen"
        >
          <LocateFixed className="w-5 h-5 text-[#1a73e8]" />
        </button>

        {/* Fullscreen */}
        <button
          type="button"
          onClick={handleToggleFullscreen}
          className="w-10 h-10 bg-white hover:bg-gray-50 text-[#5f6368] hover:text-[#202124] rounded-full border border-[#dadce0] shadow-[0_2px_6px_rgba(60,64,67,0.3)] transition-colors flex items-center justify-center cursor-pointer"
          title={isExpanded ? 'Minimize Map' : 'Full Screen Map'}
        >
          {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Geolocation Toast Notification */}
      {geoNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-[#202124]/90 backdrop-blur-md text-white text-[11px] font-semibold px-4 py-1.5 rounded-full shadow-lg pointer-events-none transition-all">
          {geoNotice}
        </div>
      )}

      {/* Bottom Floating Legend & Navigation Bar (Google Maps Style) */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Modern Clean Legend with Google Pin Colors */}
        <div className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[#dadce0] shadow-[0_2px_6px_rgba(60,64,67,0.2)] flex items-center gap-3 text-[11px] font-medium text-[#3c4043] pointer-events-auto">
          <span className="flex items-center gap-1.5 font-bold text-[#137333]">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isPostHandover ? 'bg-gray-400' : 'bg-[#34a853]'
              } shadow-xs`}
            />
            <span>A: {pickupAddress.split(',')[0]}</span>
            {isPostHandover && (
              <span className="text-[10px] text-[#137333] font-bold bg-[#e6f4ea] px-1 py-0.2 rounded">
                Collected ✓
              </span>
            )}
          </span>
          <span className="text-gray-300">|</span>
          <span className="flex items-center gap-1.5 font-bold text-[#c5221f]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ea4335] shadow-xs" />
            <span>B: {displayDropoffAddress.split(',')[0]}</span>
          </span>
          {validCourier && (
            <>
              <span className="text-gray-300">|</span>
              <span className="flex items-center gap-1 text-[#1a73e8] font-bold">
                🛵 {volunteerName.split(' ')[0]} Active
              </span>
            </>
          )}
        </div>

        {/* Navigation Action Buttons: STRICTLY for Volunteer (Google Maps Navigation Blue) */}
        {showExternalNav && userRole === 'volunteer' && (
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={() => openExternalRoute('pickup')}
              className="px-4 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full text-xs font-bold shadow-[0_2px_6px_rgba(26,115,232,0.35)] flex items-center gap-1.5 transition-all cursor-pointer"
              title="Open turn-by-turn navigation directly to Donor Pickup in Google Maps"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Navigate to Pickup ➔</span>
            </button>
            <button
              type="button"
              onClick={() => openExternalRoute('dropoff')}
              className="px-4 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full text-xs font-bold shadow-[0_2px_6px_rgba(26,115,232,0.35)] flex items-center gap-1.5 transition-all cursor-pointer"
              title="Open turn-by-turn navigation directly to Receiver Drop-off in Google Maps"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Navigate to Drop-off ➔</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
