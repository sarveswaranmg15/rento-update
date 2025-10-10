"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bell, Settings, User, Calendar, Clock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import QuickActions from '@/components/quick-actions'
import NavigationMenu from '@/components/navigation-menu'
import LocationAutocomplete from '@/components/book-ride/LocationAutocomplete'
import VehicleSelector, { type Vehicle } from '@/components/book-ride/VehicleSelector'
import FareSummary from '@/components/book-ride/FareSummary'
import MapView from '@/components/book-ride/MapView'
import { loadRazorpay } from '@/lib/razorpay'
import { useEffect, useMemo, useRef, useState } from 'react'
interface CreatedBooking { id: string; booking_number: string; status: string; created_at: string; estimated_cost: number | null }

export default function ScheduleRidePage() {
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

  // Vehicle selection
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null)

  // Scheduling
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const scheduleDateTime = useMemo(() => {
    if (!scheduledDate || !scheduledTime) return null
    const dt = new Date(`${scheduledDate}T${scheduledTime}:00`)
    return Number.isNaN(dt.getTime()) ? null : dt
  }, [scheduledDate, scheduledTime])
  const scheduleValid = useMemo(() => {
    if (!scheduleDateTime) return false
    const now = new Date()
    return scheduleDateTime.getTime() > now.getTime() + 5 * 60 * 1000 // at least 5 minutes in future
  }, [scheduleDateTime])

  // Fare & directions
  const [calculating, setCalculating] = useState(false)
  const [routeResult, setRouteResult] = useState<any | null>(null)
  const [distanceText, setDistanceText] = useState<string | null>(null)
  const [durationText, setDurationText] = useState<string | null>(null)
  const [fareAmount, setFareAmount] = useState<number | null>(null)
  const [pendingBookingId, setPendingBookingId] = useState<string | null>(null)
  const [createdBooking, setCreatedBooking] = useState<CreatedBooking | null>(null)
  const razorpayRef = useRef<any | null>(null)

  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) return
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
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, heading } = pos.coords as GeolocationCoordinates & { heading: number | null }
        setUserLocation({ lat: latitude, lng: longitude })
        if (typeof heading === "number" && !Number.isNaN(heading)) setHeading(heading)
      },
      () => {},
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
    ) as unknown as number
    return () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current) }
  }, [])

  // Determine user's city bounds to constrain predictions within the city
  useEffect(() => {
    const g = (typeof window !== 'undefined' ? (window as any).google : undefined)
    if (!mapsReady || !g?.maps || !userLocation) return
    if (!geocoderRef.current) geocoderRef.current = new g.maps.Geocoder()
    geocoderRef.current.geocode({ location: userLocation, region: 'in' }, (results: any, status: any) => {
      if (status === 'OK' && Array.isArray(results)) {
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
      return
    }
    if (!acServiceRef.current) acServiceRef.current = new g.maps.places.AutocompleteService()
    if (!sessionTokenRef.current) sessionTokenRef.current = new g.maps.places.AutocompleteSessionToken()
    const controller = { canceled: false }
    const timeout = setTimeout(() => {
      const request: any = { input: pickupQuery, sessionToken: sessionTokenRef.current, types: ["geocode"], componentRestrictions: { country: 'in' }, strictBounds: true }
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
          setPickupPredictions(preds.map((p: any) => ({ description: p.description, place_id: p.place_id })))
          setShowPickupDropdown(true)
        } else {
          setPickupPredictions([])
          setShowPickupDropdown(false)
        }
      })
    }, 250)
    return () => { controller.canceled = true; clearTimeout(timeout) }
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
    if (!acServiceRef.current) acServiceRef.current = new g.maps.places.AutocompleteService()
    if (!dropSessionTokenRef.current) dropSessionTokenRef.current = new g.maps.places.AutocompleteSessionToken()
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
    return () => { controller.canceled = true; clearTimeout(timeout) }
  }, [dropQuery, mapsReady, userLocation])

  function handleSelectPickup(placeId: string, description: string) {
    const g = (typeof window !== 'undefined' ? (window as any).google : undefined)
    if (!g?.maps?.places) return
    if (!placesServiceRef.current) placesServiceRef.current = new g.maps.places.PlacesService(mapRef.current || document.createElement('div'))
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
        if (mapRef.current) { mapRef.current.panTo({ lat, lng }); mapRef.current.setZoom(16) }
      } else {
        setPickupQuery(description); setPickupPredictions([]); setShowPickupDropdown(false)
      }
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
      if (mapRef.current) { mapRef.current.panTo(userLocation); mapRef.current.setZoom(16) }
    }
    if (g?.maps) {
      if (!geocoderRef.current) geocoderRef.current = new g.maps.Geocoder()
      geocoderRef.current.geocode({ location: userLocation, region: 'in' }, (results: any, status: any) => {
        if (status === 'OK' && Array.isArray(results) && results[0]?.formatted_address) setAndCenter(results[0].formatted_address)
        else setAndCenter('Current location')
      })
    } else setAndCenter('Current location')
  }

  function handleSelectDrop(placeId: string, description: string) {
    const g = (typeof window !== 'undefined' ? (window as any).google : undefined)
    if (!g?.maps?.places) return
    if (!placesServiceRef.current) placesServiceRef.current = new g.maps.places.PlacesService(mapRef.current || document.createElement('div'))
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
        if (mapRef.current) { mapRef.current.panTo({ lat, lng }); mapRef.current.setZoom(16) }
      } else {
        setDropQuery(description); setDropPredictions([]); setShowDropDropdown(false)
      }
      dropSessionTokenRef.current = null
    })
  }

  // Helpers for projecting the cone points
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const toDeg = (rad: number) => (rad * 180) / Math.PI
  function projectPoint(lat: number, lng: number, distanceMeters: number, bearingDeg: number) {
    const R = 6371000
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
    if (lng2 > 180) lng2 -= 360
    if (lng2 < -180) lng2 += 360
    return { lat: toDeg(φ2), lng: lng2 }
  }

  const conePath = useMemo(() => {
    if (!userLocation || heading == null) return null
    const radius = 120
    const halfAngle = 30
    const steps = 12
    const points: { lat: number; lng: number }[] = []
    points.push({ lat: userLocation.lat, lng: userLocation.lng })
    for (let i = -halfAngle; i <= halfAngle; i += (halfAngle * 2) / steps) {
      const p = projectPoint(userLocation.lat, userLocation.lng, radius, heading + i)
      points.push(p)
    }
    return points
  }, [userLocation, heading])

  // Pin-style marker options
  const pickupMarkerOptions = useMemo(() => {
    const g = (typeof window !== 'undefined' ? (window as any).google : undefined)
    if (!g?.maps) return undefined
    const path = "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"
    return { icon: { path, fillColor: '#ef4444', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 2, scale: 1.6, anchor: new g.maps.Point(12, 22) }, zIndex: 999 } as any
  }, [mapsReady])
  const dropMarkerOptions = useMemo(() => {
    const g = (typeof window !== 'undefined' ? (window as any).google : undefined)
    if (!g?.maps) return undefined
    const path = "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"
    return { icon: { path, fillColor: '#3b82f6', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 2, scale: 1.6, anchor: new g.maps.Point(12, 22) }, zIndex: 998 } as any
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
      const result: any = await svc.route({ origin: pickupLocation, destination: dropLocation, travelMode: g.maps.TravelMode.DRIVING, provideRouteAlternatives: false })
      const route = result?.routes?.[0]
      if (!route || !route.legs || !route.legs[0]) throw new Error('No route found')
      setRouteResult(result)
      const leg = route.legs[0]
      setDistanceText(leg.distance?.text || null)
      setDurationText(leg.duration?.text || null)
      const km = (leg.distance?.value || 0) / 1000
      const vehicle = vehicleTypes.find(v => v.name === selectedVehicle)
      const rate = vehicle ? parseRate(vehicle.price) : 0
      const fare = Math.round(km * rate)
      setFareAmount(fare)
      if (route.bounds && mapRef.current?.fitBounds) mapRef.current.fitBounds(route.bounds)

      // Persist or update a pending booking draft with scheduled time
      try {
        const schedISO = scheduleDateTime ? scheduleDateTime.toISOString() : null
        if (!pendingBookingId) {
          const provisional = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
            pickupLocation: pickupQuery,
            pickupLatitude: pickupLocation?.lat,
            pickupLongitude: pickupLocation?.lng,
            dropoffLocation: dropQuery,
            dropoffLatitude: dropLocation?.lat,
            dropoffLongitude: dropLocation?.lng,
            passengerCount: 1,
            estimatedCost: fare,
            bookingType: 'scheduled',
            status: 'pending',
            scheduledPickupTime: schedISO
          }) })
          const j = await provisional.json(); if (provisional.ok) setPendingBookingId(j.booking.id)
        } else {
          await fetch('/api/bookings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
            bookingId: pendingBookingId, action: 'update',
            pickupLocation: pickupQuery,
            pickupLatitude: pickupLocation?.lat,
            pickupLongitude: pickupLocation?.lng,
            dropoffLocation: dropQuery,
            dropoffLatitude: dropLocation?.lat,
            dropoffLongitude: dropLocation?.lng,
            passengerCount: 1,
            estimatedCost: fare,
          }) })
        }
      } catch (e) { console.error('Failed to persist draft scheduled booking', e) }
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
      if (!publicKey) { alert('Payment config missing: NEXT_PUBLIC_RAZORPAY_KEY_ID is not set'); return }
      const res = await fetch('/api/payments/razorpay/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: fareAmount, currency: 'INR', notes: { vehicle: selectedVehicle || '', type: 'scheduled', date: scheduledDate, time: scheduledTime } }) })
      const j = await res.json(); if (!res.ok) throw new Error(j?.error || 'Failed to create order')
      const Razorpay = await loadRazorpay()
      const options = { key: publicKey, amount: j.order.amount, currency: j.order.currency, name: 'Rento', description: 'Scheduled ride fare', order_id: j.order.id, theme: { color: '#171717' },
        handler: async function (_r: any) {
          try {
            if (pendingBookingId) {
              const confirmRes = await fetch('/api/bookings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId: pendingBookingId, action: 'payment_success', orderId: _r.razorpay_order_id, paymentId: _r.razorpay_payment_id, signature: _r.razorpay_signature }) })
              const cj = await confirmRes.json(); if (!confirmRes.ok) throw new Error(cj.error || 'Failed to confirm booking')
              setCreatedBooking(cj.booking)
            }
          } finally { try { razorpayRef.current?.close?.() } catch {} }
        },
        modal: { ondismiss: async () => {
          if (pendingBookingId && !createdBooking) {
            const cancelRes = await fetch('/api/bookings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId: pendingBookingId, action: 'payment_failed', reason: 'User exited Razorpay' }) })
            const cj = await cancelRes.json(); if (cancelRes.ok) setCreatedBooking(cj.booking)
          }
        } }
      }
      const rp = new Razorpay(options); razorpayRef.current = rp; rp.open()
    } catch (e) { console.error('PayNow error', e) }
  }

  async function handlePayLater() {
    try {
      if (!fareAmount) return
      // Ensure a provisional booking exists first
      if (!pendingBookingId) {
        const schedISO = scheduleDateTime ? scheduleDateTime.toISOString() : null
        const provisional = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
          pickupLocation: pickupQuery,
          pickupLatitude: pickupLocation?.lat,
          pickupLongitude: pickupLocation?.lng,
          dropoffLocation: dropQuery,
          dropoffLatitude: dropLocation?.lat,
          dropoffLongitude: dropLocation?.lng,
          passengerCount: 1,
          estimatedCost: fareAmount,
          bookingType: 'scheduled',
          status: 'pending',
          scheduledPickupTime: schedISO
        }) })
        const j = await provisional.json(); if (!provisional.ok) throw new Error(j.error || 'Failed to create provisional booking')
        setPendingBookingId(j.booking.id)
      }
      const id = pendingBookingId || ''
      if (!id) return
      const res = await fetch('/api/bookings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId: id, action: 'pay_later' }) })
      const j2 = await res.json(); if (!res.ok) throw new Error(j2.error || 'Failed to mark pay later')
      setCreatedBooking(j2.booking)
    } catch (e) { console.error('PayLater error', e) }
  }

  async function handleCancel() {
    try { try { razorpayRef.current?.close?.() } catch {}
      if (pendingBookingId && !createdBooking) {
        const res = await fetch('/api/bookings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId: pendingBookingId, action: 'cancel', reason: 'User cancelled from UI' }) })
        const j = await res.json(); if (res.ok) setCreatedBooking(j.booking)
        setPendingBookingId(null)
      }
    } finally {
      setPickupQuery(''); setDropQuery(''); setPickupPredictions([]); setDropPredictions([]); setPickupLocation(null); setDropLocation(null); setSelectedVehicle(null); setRouteResult(null); setDistanceText(null); setDurationText(null); setFareAmount(null); setScheduledDate(''); setScheduledTime('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-64 min-h-screen p-6 bg-white mr-4">
          <div className="mb-8">
            <div className="flex justify-center mb-4">
              <Image src="/rento-logo-gold.png" alt="Rento Logo" width={60} height={60} className="object-contain" />
            </div>
          </div>

          {/* Reusable Navigation Menu */}
          <NavigationMenu active="routes" />
          <QuickActions />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Left Side - Booking Form */}
          <div className="p-6 w-96">

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

            {/* Date and Time Inputs */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-medium text-[#333333] mb-2 block">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#333333]" />
                  <Input type="date" className="pl-10 bg-white border-[#d8d8d8] text-[#171717] placeholder:text-[#666666]" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
                </div>
              </div>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#333333]" />
                <Input type="time" className="pl-10 bg-white border-[#d8d8d8] text-[#171717] placeholder:text-[#666666]" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} />
              </div>
              {scheduledDate && scheduledTime && !scheduleValid && (
                <p className="text-xs text-red-600">Please pick a time at least 5 minutes in the future.</p>
              )}
            </div>

            {/* Vehicle Type Selection */}
            <VehicleSelector vehicles={vehicleTypes} selected={selectedVehicle} onSelect={setSelectedVehicle} />
            <div className="mb-6 text-sm text-[#333333] min-h-5">{selectedVehicle ? (<span>Selected: <span className="font-medium text-[#171717]">{selectedVehicle}</span></span>) : (<span>Select a vehicle type</span>)}</div>

            {/* Get Fare Details Button */}
            <Button className="w-full bg-[#171717] hover:bg-[#333333] text-white font-medium py-3 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!selectedVehicle || !pickupLocation || !dropLocation || !scheduleValid || calculating} onClick={handleGetFareDetails}>
              {calculating ? 'Calculating…' : 'Get Fare Details'}
            </Button>

            <FareSummary distanceText={distanceText} durationText={durationText} fareAmount={fareAmount} onPayNow={handlePayNow} onPayLater={handlePayLater} />
            <div className="mt-3">
              <Button variant="outline" className="w-full" onClick={handleCancel}>Cancel</Button>
            </div>

      {createdBooking && (
              <div className="mt-4 p-3 rounded bg-white shadow text-sm">
        <div className="font-medium text-[#171717] mb-1">{createdBooking.status === 'cancelled' || createdBooking.status === 'payment_failed' ? 'Booking Cancelled' : createdBooking.status === 'waiting_driver' ? 'Waiting for driver' : 'Booking Confirmed'}</div>
                <div>Number: {createdBooking.booking_number}</div>
                <div>Status: {createdBooking.status}</div>
                {createdBooking.estimated_cost != null && <div>Estimated Fare: Rs {createdBooking.estimated_cost}</div>}
        {createdBooking.status === 'waiting_driver' && <div className="text-xs text-gray-600 mt-1">We’re assigning a nearby driver. You’ll see details shortly.</div>}
        {createdBooking.status === 'payment_failed' && <div className="text-xs text-red-600 mt-1">Payment failed or was dismissed.</div>}
              </div>
            )}
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
