"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, Settings, User, ChevronDown, Filter, ArrowUpDown, ImportIcon as ExportIcon } from "lucide-react"
import HeaderControls from '@/components/header-controls'
import NavigationMenu from '@/components/navigation-menu'
import QuickActions from '@/components/quick-actions'
import Link from "next/link"
import Image from "next/image"

export default function MyBookingsPage() {
  return (
    <div className="min-h-screen warm-gradient">
      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-64 min-h-screen p-6 form-card mr-4">
          <div className="flex justify-center mb-8">
            <Image src="/rento-logo-gold.png" alt="Rento" width={60} height={60} className="object-contain" />
          </div>

          <NavigationMenu active="my-bookings" />
          <QuickActions />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-[#171717]">My Bookings</h1>
            <HeaderControls />
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Input
                placeholder="Search software, services and more..."
                className="bg-white/60 border-[#d8d8d8] pr-20"
              />
              <Button className="absolute right-1 top-1 bg-[#ffc641] hover:bg-[#ffb800] text-[#171717] h-8">
                Search
              </Button>
            </div>
            <Button variant="outline" className="bg-white/60 border-[#d8d8d8]">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" className="bg-white/60 border-[#d8d8d8]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Sort
            </Button>
            <Button variant="outline" className="bg-white/60 border-[#d8d8d8]">
              Export
              <ExportIcon className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex gap-2 mb-6">
            <Button variant="secondary" className="bg-white/60 rounded-full">
              Completed
            </Button>
            <Button variant="ghost" className="text-[#171717] hover:bg-white/20">
              Cancelled
            </Button>
            <Button variant="ghost" className="text-[#171717] hover:bg-white/20">
              Upcoming
            </Button>
          </div>

          {/* Booking Cards */}
          <div className="space-y-4">
            {/* Booking Card 1 */}
            <div className="form-card p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <span className="font-semibold text-[#171717]">Booking #12345</span>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">✅ Completed</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <span className="text-sm text-[#333333]">Pickup: </span>
                      <span className="text-[#171717]">Anna Nagar, Chennai</span>
                    </div>
                    <div>
                      <span className="text-sm text-[#333333]">Dropoff: </span>
                      <span className="text-[#171717]">T Nagar, Chennai</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-[#333333]">Date: </span>
                      <span className="text-[#171717]">15 Aug 2025, 10:30 AM</span>
                    </div>
                    <div>
                      <span className="text-sm text-[#333333]">Fare: </span>
                      <span className="text-[#171717]">₹250 (Estimated ₹240)</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div className="text-center">
                    <p className="text-sm text-[#333333] mb-1">Car Type</p>
                    <p className="font-semibold text-[#171717]">Sedan</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-[#333333] mb-2">Driver</p>
                    <Avatar className="w-12 h-12">
                      <AvatarImage src="/smiling-man-driver.png" />
                      <AvatarFallback>DR</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Card 2 */}
            <div className="form-card p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <span className="font-semibold text-[#171717]">Booking #12345</span>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">✅ Completed</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <span className="text-sm text-[#333333]">Pickup: </span>
                      <span className="text-[#171717]">Anna Nagar, Chennai</span>
                    </div>
                    <div>
                      <span className="text-sm text-[#333333]">Dropoff: </span>
                      <span className="text-[#171717]">T Nagar, Chennai</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-[#333333]">Date: </span>
                      <span className="text-[#171717]">15 Aug 2025, 10:30 AM</span>
                    </div>
                    <div>
                      <span className="text-sm text-[#333333]">Fare: </span>
                      <span className="text-[#171717]">₹250 (Estimated ₹240)</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div className="text-center">
                    <p className="text-sm text-[#333333] mb-1">Car Type</p>
                    <p className="font-semibold text-[#171717]">Sedan</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-[#333333] mb-2">Driver</p>
                    <Avatar className="w-12 h-12">
                      <AvatarImage src="/smiling-man-driver.png" />
                      <AvatarFallback>DR</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Card 3 */}
            <div className="form-card p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <span className="font-semibold text-[#171717]">Booking #12345</span>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">✅ Completed</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <span className="text-sm text-[#333333]">Pickup: </span>
                      <span className="text-[#171717]">Anna Nagar, Chennai</span>
                    </div>
                    <div>
                      <span className="text-sm text-[#333333]">Dropoff: </span>
                      <span className="text-[#171717]">T Nagar, Chennai</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-[#333333]">Date: </span>
                      <span className="text-[#171717]">15 Aug 2025, 10:30 AM</span>
                    </div>
                    <div>
                      <span className="text-sm text-[#333333]">Fare: </span>
                      <span className="text-[#171717]">₹250 (Estimated ₹240)</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div className="text-center">
                    <p className="text-sm text-[#333333] mb-1">Car Type</p>
                    <p className="font-semibold text-[#171717]">Sedan</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-[#333333] mb-2">Driver</p>
                    <Avatar className="w-12 h-12">
                      <AvatarImage src="/smiling-man-driver.png" />
                      <AvatarFallback>DR</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
