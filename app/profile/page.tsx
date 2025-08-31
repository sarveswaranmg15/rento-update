"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Bell, Settings, User, ChevronDown, Upload } from "lucide-react"
import HeaderControls from '@/components/header-controls'
import UserInfoFooter from '@/components/user-info-footer'
import Image from "next/image"
import Link from "next/link"

export default function ProfilePage() {
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

          {/* Navigation Menu */}
          <nav className="space-y-1 mb-8">
            <Link href="/dashboard">
              <Button variant="ghost" className="w-full justify-start text-[#171717] hover:bg-white/20">
                Dashboard
              </Button>
            </Link>
            <Link href="/bookings">
              <Button variant="ghost" className="w-full justify-start text-[#171717] hover:bg-white/20">
                Bookings
              </Button>
            </Link>
            <Link href="/drivers">
              <Button variant="ghost" className="w-full justify-start text-[#171717] hover:bg-white/20">
                Drivers
              </Button>
            </Link>
            <Link href="/routes">
              <Button variant="ghost" className="w-full justify-start text-[#171717] hover:bg-white/20">
                Routes
              </Button>
            </Link>
            <Link href="/analytics">
              <Button variant="ghost" className="w-full justify-start text-[#171717] hover:bg-white/20">
                Analytics
              </Button>
            </Link>
            <Link href="/admin-panel">
              <Button variant="ghost" className="w-full justify-start text-[#171717] hover:bg-white/20">
                Admin Panel
              </Button>
            </Link>
            <Link href="/my-bookings">
              <Button variant="ghost" className="w-full justify-start text-[#171717] hover:bg-white/20">
                My Bookings
              </Button>
            </Link>
            <Button
              variant="secondary"
              className="w-full justify-start bg-white/60 text-[#171717] hover:bg-white/80 rounded-full"
            >
              Profile
            </Button>
          </nav>

          {/* Quick Actions */}
          <div className="space-y-3 shadow">
            <h3 className="text-sm font-medium text-[#333333] mb-3">Quick Actions</h3>
            <Link href="/book-ride">
              <Button className="w-full bg-[#ffc641] hover:bg-[#ffb800] text-[#171717] font-medium px-3.5 mx-0">
                Book Ride
              </Button>
            </Link>
            <Link href="/schedule-ride">
              <Button className="w-full bg-[#ffc641] hover:bg-[#ffb800] text-[#171717] font-medium my-3 py-0">
                Schedule Ride
              </Button>
            </Link>
            <Link href="/pool-ride">
              <Button className="w-full bg-[#ffc641] hover:bg-[#ffb800] text-[#171717] font-medium">Pool Ride</Button>
            </Link>
          </div>

          <UserInfoFooter />
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="form-card p-6 h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-[#171717]">Profile</h1>
              <HeaderControls />
            </div>

            {/* Profile Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Side - Profile Info */}
              <div className="flex flex-col items-center space-y-6">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-32 h-32 bg-teal-800 rounded-full flex items-center justify-center">
                    <svg className="w-16 h-16 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5-1.5 1.5-5-5v-.79l-.27-.27A6.516 6.516 0 0 1 9.5 16 6.5 6.5 0 0 1 3 9.5 6.5 6.5 0 0 1 9.5 3m0 2C7.01 5 5 7.01 5 9.5S7.01 14 9.5 14 14 11.99 14 9.5 11.99 5 9.5 5Z" />
                      <path d="M8.5 8.5c0 .55.45 1 1 1s1-.45 1-1-.45-1-1-1-1 .45-1 1Z" />
                      <path d="M12.5 12.5c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5Z" />
                    </svg>
                  </div>
                </div>

                {/* User Info */}
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-[#171717] mb-1">Khusan Akhmedov</h2>
                  <p className="text-[#666666] mb-4">Web-designer</p>
                </div>

                {/* Rides Count */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#171717]">21</div>
                  <div className="text-[#666666] text-sm">Rides</div>
                </div>

                {/* Upload Avatar Button */}
                <Button variant="outline" className="bg-gray-600 border-gray-600 px-6">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload new avatar
                </Button>
              </div>

              {/* Right Side - Basic Info Form */}
              <div className="space-y-6">
                {/* Form Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[#171717]">BASIC INFO</h3>
                  <div className="flex gap-3">
                    <Button variant="outline" className="bg-white/60 border-[#d8d8d8] text-[#171717]">
                      CANCEL
                    </Button>
                    <Button className="bg-[#171717] hover:bg-[#333333] text-white">SAVE</Button>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  {/* First Name and Last Name Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#171717] mb-2">FIRST NAME</label>
                      <Input className="bg-white/60 border-[#d8d8d8]" defaultValue="Khusan" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#171717] mb-2">LAST NAME</label>
                      <Input className="bg-white/60 border-[#d8d8d8]" defaultValue="Akhmedov" />
                    </div>
                  </div>

                  {/* Mobile */}
                  <div>
                    <label className="block text-sm font-medium text-[#171717] mb-2">MOBILE</label>
                    <Input className="bg-white/60 border-[#d8d8d8]" defaultValue="+1 (555) 123-4567" />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-[#171717] mb-2">EMAIL</label>
                    <Input className="bg-white/60 border-[#d8d8d8]" defaultValue="khusan.akhmedov@example.com" />
                  </div>

                  {/* Favourites */}
                  <div>
                    <label className="block text-sm font-medium text-[#171717] mb-2">Favourites</label>
                    <Textarea
                      className="bg-white/60 border-[#d8d8d8] min-h-[120px]"
                      placeholder="Add your favourite locations, routes, or preferences..."
                    />
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
