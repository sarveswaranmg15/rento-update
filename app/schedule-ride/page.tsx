"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bell, Settings, User, MapPin, Calendar, Clock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import QuickActions from '@/components/quick-actions'
import { GoogleMap, LoadScript } from "@react-google-maps/api";
import NavigationMenu from '@/components/navigation-menu'

export default function ScheduleRidePage() {
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
          <div className="p-6">

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
                  className="pl-10 bg-white border-[#d8d8d8] text-[#171717] placeholder:text-[#666666]"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#333333]" />
                <Input
                  placeholder="Dropout location"
                  className="pl-10 bg-white border-[#d8d8d8] text-[#171717] placeholder:text-[#666666]"
                />
              </div>
            </div>

            {/* Date and Time Inputs */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-medium text-[#333333] mb-2 block">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#333333]" />
                  <Input
                    placeholder="Today"
                    className="pl-10 bg-white border-[#d8d8d8] text-[#171717] placeholder:text-[#666666]"
                  />
                </div>
              </div>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#333333]" />
                <Input
                  placeholder="Schedule Time"
                  className="pl-10 bg-white border-[#d8d8d8] text-[#171717] placeholder:text-[#666666]"
                />
              </div>
            </div>

            {/* Vehicle Type Selection */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {vehicleTypes.map((vehicle, index) => (
                <div
                  key={index}
                  className="p-4 bg-white border border-[#d8d8d8] rounded-lg hover:bg-white/80 cursor-pointer transition-colors"
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
              <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={{ lat: 13.0827, lng: 80.2707 }}
                  zoom={12}
                >
                  {/* Child components, such as markers, info windows, etc. */}
                </GoogleMap>
              </LoadScript>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
