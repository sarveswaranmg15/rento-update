"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bell, Settings, User, MapPin } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import NavigationMenu from '@/components/navigation-menu'
// Map primitives are now encapsulated in MapView
import { useEffect, useMemo, useRef, useState } from "react"
import QuickActions from '@/components/quick-actions'
import LocationAutocomplete from '@/components/book-ride/LocationAutocomplete'
import VehicleSelector, { type Vehicle } from '@/components/book-ride/VehicleSelector'
import FareSummary from '@/components/book-ride/FareSummary'
import MapView from '@/components/book-ride/MapView'
import { loadRazorpay } from '@/lib/razorpay'

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
  const dropSessionTokenRef = useRef<any | null>(null)

  // Pickup autocomplete state
  const [pickupQuery, setPickupQuery] = useState("")
  const [pickupPredictions, setPickupPredictions] = useState<Array<{ description: string; place_id: string }>>([])
  const [showPickupDropdown, setShowPickupDropdown] = useState(false)
  const [pickupLocation, setPickupLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [pickupFocused, setPickupFocused] = useState(false)

  // Drop autocomplete state
  const [dropQuery, setDropQuery] = useState("")
  const [dropPredictions, setDropPredictions] = useState<Array<{ description: string; place_id: string }>>([])
  const [showDropDropdown, setShowDropDropdown] = useState(false)
  const [dropLocation, setDropLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null)
  const [calculating, setCalculating] = useState(false)
  const [routeResult, setRouteResult] = useState<any | null>(null)
  const [distanceText, setDistanceText] = useState<string | null>(null)
  const [durationText, setDurationText] = useState<string | null>(null)
  const [fareAmount, setFareAmount] = useState<number | null>(null)

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
      // Keep dropdown state; we may show "Use current location" when focused
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

  // Debounced fetch of autocomplete predictions for Drop
  useEffect(() => {
    const g = (typeof window !== 'undefined' ? (window as any).google : undefined)
    if (!mapsReady || !g?.maps?.places) return
    if (!dropQuery || dropQuery.trim().length < 2) {
      setDropPredictions([])
      setShowDropDropdown(false)
      return
    }
    if (!acServiceRef.current) {
      acServiceRef.current = new g.maps.places.AutocompleteService()
    }
    if (!dropSessionTokenRef.current) {
      dropSessionTokenRef.current = new g.maps.places.AutocompleteSessionToken()
    }

    const controller = { canceled: false }
    const timeout = setTimeout(() => {
      const request: any = { input: dropQuery, sessionToken: dropSessionTokenRef.current, types: ["geocode"], componentRestrictions: { country: 'in' }, strictBounds: true }
      const bounds = cityBoundsRef.current || (mapRef.current?.getBounds ? mapRef.current.getBounds() : null)
      if (bounds) request.bounds = bounds
      if (userLocation) {
        const ll = new g.maps.LatLng(userLocation.lat, userLocation.lng)
        request.location = ll
        const radiusMeters = (mapRef.current?.getZoom && mapRef.current.getZoom() >= 15) ? 5000 : 10000
        request.radius = radiusMeters
        request.origin = ll
      }
      acServiceRef.current.getPlacePredictions(request, (preds: any, status: any) => {
        if (controller.canceled) return
        if (status === g.maps.places.PlacesServiceStatus.OK && Array.isArray(preds)) {
          setDropPredictions(preds.map((p: any) => ({ description: p.description, place_id: p.place_id })))
          setShowDropDropdown(true)
        } else {
          setDropPredictions([])
          setShowDropDropdown(false)
        }
      })
    }, 250)
    return () => {
      controller.canceled = true
      clearTimeout(timeout)
    }
  }, [dropQuery, mapsReady, userLocation])

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

  function handleUseCurrentPickup() {
    if (!userLocation) return
    const g = (typeof window !== 'undefined' ? (window as any).google : undefined)
    const setAndCenter = (label: string) => {
      setPickupLocation(userLocation)
      setPickupQuery(label)
      setPickupPredictions([])
      setShowPickupDropdown(false)
      if (mapRef.current) {
        mapRef.current.panTo(userLocation)
        mapRef.current.setZoom(16)
      }
    }
    if (g?.maps) {
      if (!geocoderRef.current) geocoderRef.current = new g.maps.Geocoder()
      geocoderRef.current.geocode({ location: userLocation, region: 'in' }, (results: any, status: any) => {
        if (status === 'OK' && Array.isArray(results) && results[0]?.formatted_address) {
          setAndCenter(results[0].formatted_address)
        } else {
          setAndCenter('Current location')
        }
      })
    } else {
      setAndCenter('Current location')
    }
  }

  function handleSelectDrop(placeId: string, description: string) {
    const g = (typeof window !== 'undefined' ? (window as any).google : undefined)
    if (!g?.maps?.places) return
    if (!placesServiceRef.current) {
      placesServiceRef.current = new g.maps.places.PlacesService(mapRef.current || document.createElement('div'))
    }
    const fields = ["geometry", "name", "formatted_address"]
    const request: any = { placeId, fields, sessionToken: dropSessionTokenRef.current || undefined }
    placesServiceRef.current.getDetails(request, (place: any, status: any) => {
      if (status === g.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
        const loc = place.geometry.location
        const lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat
        const lng = typeof loc.lng === 'function' ? loc.lng() : loc.lng
        setDropLocation({ lat, lng })
        setDropQuery(description)
        setDropPredictions([])
        setShowDropDropdown(false)
        if (mapRef.current) {
          mapRef.current.panTo({ lat, lng })
          mapRef.current.setZoom(16)
        }
      } else {
        setDropQuery(description)
        setDropPredictions([])
        setShowDropDropdown(false)
      }
      dropSessionTokenRef.current = null
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

  // Pin-style red marker options for pickup location
  const pickupMarkerOptions = useMemo(() => {
    const g = (typeof window !== 'undefined' ? (window as any).google : undefined)
    if (!g?.maps) return undefined
    const path = "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"
    return {
      icon: {
        path,
        fillColor: '#ef4444',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 1.6,
        anchor: new g.maps.Point(12, 22),
      },
      zIndex: 999,
    } as any
  }, [mapsReady])
  const dropMarkerOptions = useMemo(() => {
    const g = (typeof window !== 'undefined' ? (window as any).google : undefined)
    if (!g?.maps) return undefined
    const path = "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"
    return {
      icon: {
        path,
        fillColor: '#3b82f6',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 1.6,
        anchor: new g.maps.Point(12, 22),
      },
      zIndex: 998,
    } as any
  }, [mapsReady])
  const vehicleTypes: Vehicle[] = [
    {
      name: "Sedan",
      price: "Rs 12/km",
      passengers: "Upto 4 Passengers",
    },
    
    {
      name: "SUV",
      price: "Rs 14/km",
      passengers: "Upto 6 Passengers",
    },
    
  ]

  function parseRate(priceStr: string): number {
    const m = priceStr.match(/(\d+(?:\.\d+)?)/)
    return m ? parseFloat(m[1]) : 0
  }

  async function handleGetFareDetails() {
    if (!pickupLocation || !dropLocation || !selectedVehicle || calculating) return
    const g = (typeof window !== 'undefined' ? (window as any).google : undefined)
    if (!g?.maps) return
    setCalculating(true)
    try {
      const svc = new g.maps.DirectionsService()
      const result: any = await svc.route({
        origin: pickupLocation,
        destination: dropLocation,
        travelMode: g.maps.TravelMode.DRIVING,
        provideRouteAlternatives: false,
      })
      const route = result?.routes?.[0]
      if (!route || !route.legs || !route.legs[0]) throw new Error('No route found')
      setRouteResult(result)
      const leg = route.legs[0]
      setDistanceText(leg.distance?.text || null)
      setDurationText(leg.duration?.text || null)
      const meters = leg.distance?.value || 0
      const km = meters / 1000
      const vehicle = vehicleTypes.find(v => v.name === selectedVehicle)
      const rate = vehicle ? parseRate(vehicle.price) : 0
      const fare = Math.round(km * rate)
      setFareAmount(fare)
      // Fit bounds to the route
      if (route.bounds && mapRef.current?.fitBounds) {
        mapRef.current.fitBounds(route.bounds)
      }
    } catch (e) {
      console.error('Directions error', e)
    } finally {
      setCalculating(false)
    }
  }

  async function handlePayNow() {
    try {
      if (!fareAmount) return
      const publicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      if (!publicKey) {
        alert('Payment config missing: NEXT_PUBLIC_RAZORPAY_KEY_ID is not set')
        console.error('Missing NEXT_PUBLIC_RAZORPAY_KEY_ID in environment')
        return
      }
      const res = await fetch('/api/payments/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: fareAmount, currency: 'INR', notes: { vehicle: selectedVehicle || '' } }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Failed to create order')

      const Razorpay = await loadRazorpay()
      const options = {
        key: publicKey,
        amount: j.order.amount,
        currency: j.order.currency,
        name: 'Rento',
        description: 'Ride fare',
        order_id: j.order.id,
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: { color: '#171717' },
        handler: function (_response: any) {
          // TODO: verify payment on server and create booking
          console.log('Payment success', _response)
        },
        modal: { ondismiss: () => console.log('Payment dismissed') },
      }
      const rp = new Razorpay(options)
      rp.open()
    } catch (e) {
      console.error('PayNow error', e)
    }
  }

  

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
              <LocationAutocomplete
                placeholder="Pickup location"
                query={pickupQuery}
                setQuery={setPickupQuery}
                predictions={pickupPredictions}
                showDropdown={showPickupDropdown && (pickupPredictions.length > 0 || (pickupFocused && !!userLocation))}
                onFocus={() => { setPickupFocused(true); setShowPickupDropdown(true) }}
                onBlur={() => setTimeout(() => { setShowPickupDropdown(false); setPickupFocused(false) }, 150)}
                onSelect={handleSelectPickup}
                showUseCurrent={!!userLocation && pickupFocused}
                onUseCurrent={handleUseCurrentPickup}
              />

              <LocationAutocomplete
                placeholder="Drop location"
                query={dropQuery}
                setQuery={setDropQuery}
                predictions={dropPredictions}
                showDropdown={showDropDropdown && dropPredictions.length > 0}
                onFocus={() => dropPredictions.length && setShowDropDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropDropdown(false), 150)}
                onSelect={handleSelectDrop}
              />
            </div>

            {/* Vehicle Type Selection */}
            <VehicleSelector vehicles={vehicleTypes} selected={selectedVehicle} onSelect={setSelectedVehicle} />
            <div className="mb-6 text-sm text-[#333333] min-h-5">
              {selectedVehicle ? (
                <span>Selected: <span className="font-medium text-[#171717]">{selectedVehicle}</span></span>
              ) : (
                <span>Select a vehicle type</span>
              )}
            </div>

            {/* Get Fare Details Button */}
            <Button className="w-full bg-[#171717] hover:bg-[#333333] text-white font-medium py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedVehicle || !pickupLocation || !dropLocation || calculating}
              onClick={handleGetFareDetails}
            >
              {calculating ? 'Calculating…' : 'Get Fare Details'}
            </Button>

            <FareSummary distanceText={distanceText} durationText={durationText} fareAmount={fareAmount} onPayNow={handlePayNow} />
          </div>

          {/* Right Side - Map */}
          <div className="flex-1 p-6">
            <MapView
              mapsReady={mapsReady}
              setMapsReady={setMapsReady}
              defaultCenter={defaultCenter}
              userLocation={userLocation}
              mapZoom={mapZoom}
              mapRef={mapRef}
              placesServiceRef={placesServiceRef}
              conePath={conePath}
              pickupLocation={pickupLocation}
              dropLocation={dropLocation}
              pickupMarkerOptions={pickupMarkerOptions}
              dropMarkerOptions={dropMarkerOptions}
              routeResult={routeResult}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
