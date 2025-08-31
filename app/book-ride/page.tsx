"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bell, Settings, User, MapPin } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import NavigationMenu from '@/components/navigation-menu'
import { GoogleMap, LoadScript, OverlayView, Polygon, MarkerF } from "@react-google-maps/api";
import { useEffect, useMemo, useRef, useState } from "react"
import QuickActions from '@/components/quick-actions'

export default function BookRidePage() {
  const defaultCenter = { lat: 13.0827, lng: 80.2707 }
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [mapZoom, setMapZoom] = useState(12)
  const [heading, setHeading] = useState<number | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const [mapsReady, setMapsReady] = useState(false)
  const mapRef = useRef<any | null>(null)
  const acServiceRef = useRef<any | null>(null)
  const placesServiceRef = useRef<any | null>(null)
  const geocoderRef = useRef<any | null>(null)
  const cityBoundsRef = useRef<any | null>(null)
  const sessionTokenRef = useRef<any | null>(null)

  // Pickup autocomplete state
  const [pickupQuery, setPickupQuery] = useState("")
  const [pickupPredictions, setPickupPredictions] = useState<Array<{ description: string; place_id: string }>>([])
  const [showPickupDropdown, setShowPickupDropdown] = useState(false)
  const [pickupLocation, setPickupLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) return
    // Initial center
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, heading } = pos.coords as GeolocationCoordinates & { heading: number | null }
        setUserLocation({ lat: latitude, lng: longitude })
        if (typeof heading === "number" && !Number.isNaN(heading)) setHeading(heading)
        setMapZoom(15)
      },
      () => {
        setUserLocation(null)
        setMapZoom(12)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )

    // Watch for updates (movement + bearing)
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, heading } = pos.coords as GeolocationCoordinates & { heading: number | null }
        setUserLocation({ lat: latitude, lng: longitude })
        if (typeof heading === "number" && !Number.isNaN(heading)) setHeading(heading)
      },
      () => {
        // ignore errors during watch
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
    ) as unknown as number

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
    }
  }, [])

  // Determine user's city bounds to constrain predictions within the city
  useEffect(() => {
    const g = (typeof window !== 'undefined' ? (window as any).google : undefined)
    if (!mapsReady || !g?.maps || !userLocation) return
    if (!geocoderRef.current) geocoderRef.current = new g.maps.Geocoder()
    geocoderRef.current.geocode({ location: userLocation, region: 'in' }, (results: any, status: any) => {
      if (status === 'OK' && Array.isArray(results)) {
        // Prefer locality or administrative area as city-like bounds
        const cityResult = results.find((r: any) => r.types?.includes('locality'))
          || results.find((r: any) => r.types?.includes('administrative_area_level_2'))
          || results[0]
        const vp = cityResult?.geometry?.viewport
        if (vp) cityBoundsRef.current = vp
      }
    })
  }, [mapsReady, userLocation])

  // Debounced fetch of autocomplete predictions for Pickup
  useEffect(() => {
    const g = (typeof window !== 'undefined' ? (window as any).google : undefined)
    if (!mapsReady || !g?.maps?.places) return
    if (!pickupQuery || pickupQuery.trim().length < 2) {
      setPickupPredictions([])
      setShowPickupDropdown(false)
      return
    }
    if (!acServiceRef.current) {
      acServiceRef.current = new g.maps.places.AutocompleteService()
    }
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new g.maps.places.AutocompleteSessionToken()
    }

    const controller = { canceled: false }
    const timeout = setTimeout(() => {
      const request: any = { input: pickupQuery, sessionToken: sessionTokenRef.current, types: ["geocode"], componentRestrictions: { country: 'in' }, strictBounds: true }
      // Use city bounds if available, else map bounds
      const bounds = cityBoundsRef.current || (mapRef.current?.getBounds ? mapRef.current.getBounds() : null)
      if (bounds) request.bounds = bounds
      if (userLocation) {
        const ll = new g.maps.LatLng(userLocation.lat, userLocation.lng)
        request.location = ll
        const radiusMeters = (mapRef.current?.getZoom && mapRef.current.getZoom() >= 15) ? 5000 : 10000
        request.radius = radiusMeters // 5–10km bias depending on zoom
        request.origin = ll
      }
      acServiceRef.current.getPlacePredictions(request, (preds: any, status: any) => {
        if (controller.canceled) return
        if (status === g.maps.places.PlacesServiceStatus.OK && Array.isArray(preds)) {
          setPickupPredictions(preds.map((p: any) => ({ description: p.description, place_id: p.place_id })))
          setShowPickupDropdown(true)
        } else {
          setPickupPredictions([])
          setShowPickupDropdown(false)
        }
      })
    }, 250)
    return () => {
      controller.canceled = true
      clearTimeout(timeout)
    }
  }, [pickupQuery, mapsReady, userLocation])

  function handleSelectPickup(placeId: string, description: string) {
    const g = (typeof window !== 'undefined' ? (window as any).google : undefined)
    if (!g?.maps?.places) return
    // Ensure PlacesService exists
    if (!placesServiceRef.current) {
      placesServiceRef.current = new g.maps.places.PlacesService(mapRef.current || document.createElement('div'))
    }
    const fields = ["geometry", "name", "formatted_address"]
    const request: any = { placeId, fields, sessionToken: sessionTokenRef.current || undefined }
    placesServiceRef.current.getDetails(request, (place: any, status: any) => {
      if (status === g.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
        const loc = place.geometry.location
        const lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat
        const lng = typeof loc.lng === 'function' ? loc.lng() : loc.lng
        setPickupLocation({ lat, lng })
        setPickupQuery(description)
        setPickupPredictions([])
        setShowPickupDropdown(false)
        if (mapRef.current) {
          mapRef.current.panTo({ lat, lng })
          mapRef.current.setZoom(16)
        }
      } else {
        // If details fail, still set description and close dropdown
        setPickupQuery(description)
        setPickupPredictions([])
        setShowPickupDropdown(false)
      }
      // End the autocomplete session
      sessionTokenRef.current = null
    })
  }

  // Helpers for projecting the cone points
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const toDeg = (rad: number) => (rad * 180) / Math.PI
  function projectPoint(lat: number, lng: number, distanceMeters: number, bearingDeg: number) {
    const R = 6371000 // Earth radius in meters
    const δ = distanceMeters / R
    const θ = toRad(bearingDeg)
    const φ1 = toRad(lat)
    const λ1 = toRad(lng)

    const sinφ1 = Math.sin(φ1)
    const cosφ1 = Math.cos(φ1)
    const sinδ = Math.sin(δ)
    const cosδ = Math.cos(δ)

    const sinφ2 = sinφ1 * cosδ + cosφ1 * sinδ * Math.cos(θ)
    const φ2 = Math.asin(sinφ2)
    const y = Math.sin(θ) * sinδ * cosφ1
    const x = cosδ - sinφ1 * sinφ2
    const λ2 = λ1 + Math.atan2(y, x)

    let lng2 = toDeg(λ2)
    // Normalize lon to [-180, 180]
    if (lng2 > 180) lng2 -= 360
    if (lng2 < -180) lng2 += 360
    return { lat: toDeg(φ2), lng: lng2 }
  }

  const conePath = useMemo(() => {
    if (!userLocation || heading == null) return null
    const radius = 120 // meters
    const halfAngle = 30 // degrees to either side
    const steps = 12
    const points: { lat: number; lng: number }[] = []
    // start at user location
    points.push({ lat: userLocation.lat, lng: userLocation.lng })
    for (let i = -halfAngle; i <= halfAngle; i += (halfAngle * 2) / steps) {
      const p = projectPoint(userLocation.lat, userLocation.lng, radius, heading + i)
      points.push(p)
    }
    return points
  }, [userLocation, heading])
  const vehicleTypes = [
    {
      name: "Sedan",
      price: "Rs 4/km",
      passengers: "Upto 4 Passengers",
    },
    {
      name: "HatchBack",
      price: "Rs 6/km",
      passengers: "Upto 4 Passengers",
    },
    {
      name: "SUV",
      price: "Rs 10/km",
      passengers: "Upto 6 Passengers",
    },
    {
      name: "LUXURY",
      price: "Rs 15/km",
      passengers: "Upto 8 Passengers",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-64 min-h-screen p-6 form-card mr-4">
          <div className="mb-8">
            <div className="flex justify-center mb-4">
              <Image src="/rento-logo-gold.png" alt="Rento Logo" width={60} height={60} className="object-contain" />
            </div>
          </div>

          {/* Navigation Menu */}
          <NavigationMenu active="book-ride" />
          <QuickActions />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Left Side - Booking Form */}
          <div className="w-96 p-6">
            {/* Header with user controls */}
            <div className="flex items-center justify-end gap-3 mb-8">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <User className="h-4 w-4" />
              </Button>
            </div>

            {/* Location Inputs */}
            <div className="space-y-4 mb-6">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#333333]" />
                <Input
                  placeholder="Pickup location"
                  className="pl-10 bg-white/60 border-[#d8d8d8] text-[#171717] placeholder:text-[#666666]"
                  value={pickupQuery}
                  onChange={(e) => setPickupQuery(e.target.value)}
                  onFocus={() => pickupPredictions.length && setShowPickupDropdown(true)}
                  onBlur={() => setTimeout(() => setShowPickupDropdown(false), 150)}
                />
                {showPickupDropdown && pickupPredictions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white/95 backdrop-blur border border-[#e5e5e5] rounded-md shadow max-h-64 overflow-auto">
                    {pickupPredictions.map((p) => (
                      <button
                        key={p.place_id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-black/5 flex items-start gap-2"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelectPickup(p.place_id, p.description)}
                      >
                        <MapPin className="h-4 w-4 mt-0.5 text-[#666666]" />
                        <span className="text-sm text-[#171717]">{p.description}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#333333]" />
                <Input
                  placeholder="Dropout location"
                  className="pl-10 bg-white/60 border-[#d8d8d8] text-[#171717] placeholder:text-[#666666]"
                />
              </div>
            </div>

            {/* Vehicle Type Selection */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {vehicleTypes.map((vehicle, index) => (
                <div
                  key={index}
                  className="p-4 bg-white/60 border border-[#d8d8d8] rounded-lg hover:bg-white/80 cursor-pointer transition-colors"
                >
                  <h3 className="font-semibold text-[#171717] mb-1">{vehicle.name}</h3>
                  <p className="text-sm text-[#333333] mb-1">{vehicle.price}</p>
                  <p className="text-xs text-[#666666]">{vehicle.passengers}</p>
                </div>
              ))}
            </div>

            {/* Get Fare Details Button */}
            <Button className="w-full bg-[#171717] hover:bg-[#333333] text-white font-medium py-3">
              Get Fare Details
            </Button>
          </div>

          {/* Right Side - Map */}
          <div className="flex-1 p-6">
            <div className="w-full h-full rounded-lg overflow-hidden">
              <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!} libraries={["places"]} onLoad={() => setMapsReady(true)}>
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={userLocation ?? defaultCenter}
                  zoom={mapZoom}
                  onLoad={(map) => {
                    mapRef.current = map
                    const g = (typeof window !== 'undefined' ? (window as any).google : undefined)
                    if (g?.maps?.places && !placesServiceRef.current) {
                      placesServiceRef.current = new g.maps.places.PlacesService(map)
                    }
                  }}
                >
                  {/* Soft directional cone, only if we have heading */}
                  {conePath && (
                    <Polygon
                      paths={conePath}
                      options={{
                        fillColor: '#4285F4',
                        fillOpacity: 0.2,
                        strokeOpacity: 0,
                      }}
                    />
                  )}
                  {/* Blue dot for current location */}
                  {userLocation && (
                    <OverlayView position={userLocation} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                      <div style={{ position: 'relative', width: 0, height: 0, transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
                        <span
                          style={{
                            display: 'block',
                            width: 14,
                            height: 14,
                            background: '#1A73E8',
                            borderRadius: 9999,
                            boxShadow: '0 0 0 6px rgba(26, 115, 232, 0.25)',
                            border: '2px solid #fff',
                          }}
                          title="Your location"
                        />
                      </div>
                    </OverlayView>
                  )}
                </GoogleMap>
              </LoadScript>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
