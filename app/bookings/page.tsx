import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import Link from "next/link"
import { Settings, User, Bell, ChevronDown, Filter } from "lucide-react"
import HeaderControls from '@/components/header-controls'
import QuickActions from '@/components/quick-actions'
import NavigationMenu from '@/components/navigation-menu'

export default function Bookings() {
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

          {/* Reusable navigation component */}
          <NavigationMenu active="bookings" />
          <QuickActions />
        </div>

        {/* Main Content Area - Removed right sidebar, now takes full remaining width */}
        <div className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-[#171717]">Bookings History</h1>
            <HeaderControls />
          </div>

          <div className="form-card p-6">
            <div className="flex gap-3 items-center">
              <div className="flex-1 relative">
                <Input
                  placeholder="Search software, services and more..."
                  className="w-full bg-white/60 border-[#d8d8d8] text-[#171717] placeholder:text-[#666666] pr-20"
                />
                <Button className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-[#ffc641] hover:bg-[#ffb800] text-[#171717] font-medium px-6">
                  Search
                </Button>
              </div>
              <Button variant="outline" size="sm" className="bg-white/60 border-[#d8d8d8]">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
