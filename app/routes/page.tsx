"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bell, Settings, User, ChevronDown, Filter, ArrowUpDown, MapPin } from "lucide-react"
import HeaderControls from '@/components/header-controls'
import QuickActions from '@/components/quick-actions'
import NavigationMenu from '@/components/navigation-menu'
import Link from "next/link"
import Image from "next/image"

export default function RoutesPage() {
  const routeData = [
    { code: "R001", distance: "8km", frequency: "10/day", pickup: "Office", destination: "Home" },
    { code: "R002", distance: "10km", frequency: "50/day", pickup: "Home", destination: "Office" },
    { code: "R003", distance: "11km", frequency: "6/day", pickup: "Home", destination: "Office" },
    { code: "R004", distance: "5km", frequency: "8/day", pickup: "Home", destination: "Office" },
    { code: "R005", distance: "20km", frequency: "10/day", pickup: "Office", destination: "Home" },
    { code: "R006", distance: "4km", frequency: "15/day", pickup: "Office", destination: "Home" },
    { code: "R007", distance: "8km", frequency: "5/day", pickup: "Office", destination: "Home" },
    { code: "R008", distance: "9km", frequency: "7/day", pickup: "Home", destination: "Office" },
  ]

  return (
    <div className="min-h-screen warm-gradient">
      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-64 min-h-screen p-6 form-card mr-4">
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
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-[#171717]">Routes</h1>
            <HeaderControls />
          </div>

          {/* Search and Controls */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Input
                placeholder="Search software, services and more..."
                className="pr-24 bg-white/60 border-[#d8d8d8] text-[#171717] placeholder:text-[#333333]"
              />
              <Button className="absolute right-1 top-1/2 -translate-y-1/2 bg-[#ffc641] hover:bg-[#ffc641]/90 text-[#171717] px-6">
                Search
              </Button>
            </div>
            <Button variant="outline" className="bg-white/60 border-[#d8d8d8] text-[#171717]">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" className="bg-white/60 border-[#d8d8d8] text-[#171717]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Sort
            </Button>
            <Button variant="outline" className="bg-white/60 border-[#d8d8d8] text-[#171717]">
              Export
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Routes Table */}
          <div className="form-card p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#d8d8d8]">
                    <th className="text-left py-3 px-4 text-[#333333] font-medium">Route Code</th>
                    <th className="text-left py-3 px-4 text-[#333333] font-medium">Distance</th>
                    <th className="text-left py-3 px-4 text-[#333333] font-medium">Frequency</th>
                    <th className="text-left py-3 px-4 text-[#333333] font-medium">PickUp Point</th>
                    <th className="text-left py-3 px-4 text-[#333333] font-medium">Destination</th>
                    <th className="text-left py-3 px-4 text-[#333333] font-medium">Show on Map</th>
                  </tr>
                </thead>
                <tbody>
                  {routeData.map((route, index) => (
                    <tr key={route.code} className={index % 2 === 0 ? "bg-white/20" : ""}>
                      <td className="py-4 px-4 text-[#171717] font-medium">{route.code}</td>
                      <td className="py-4 px-4 text-[#171717]">{route.distance}</td>
                      <td className="py-4 px-4 text-[#171717]">{route.frequency}</td>
                      <td className="py-4 px-4 text-[#171717]">{route.pickup}</td>
                      <td className="py-4 px-4 text-[#171717]">{route.destination}</td>
                      <td className="py-4 px-4">
                        <Button variant="ghost" size="sm" className="p-1">
                          <MapPin className="h-5 w-5 text-blue-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
