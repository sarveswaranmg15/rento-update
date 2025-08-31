"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Bell,
  Settings,
  User,
  ChevronDown,
  Users,
  UserCheck,
  Monitor,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import HeaderControls from '@/components/header-controls'
import QuickActions from '@/components/quick-actions'
import NavigationMenu from '@/components/navigation-menu'
import Image from "next/image"
import Link from "next/link"

export default function DriversPage() {
  const driversData = [
    {
      name: "Jane Cooper",
      company: "Red Taxi",
      phone: "(225) 555-0118",
      pickup: "Office",
      destination: "Home",
      status: "Completed",
      statusColor: "bg-green-100 text-green-800",
    },
    {
      name: "Floyd Miles",
      company: "FastTrack",
      phone: "(205) 555-0100",
      pickup: "Home",
      destination: "Office",
      status: "On the Way",
      statusColor: "bg-red-100 text-red-800",
    },
    {
      name: "Ronald Richards",
      company: "ABC taxi",
      phone: "(302) 555-0107",
      pickup: "Home",
      destination: "Office",
      status: "Picking Up",
      statusColor: "bg-red-100 text-red-800",
    },
    {
      name: "Marvin McKinney",
      company: "XYZ taxi",
      phone: "(252) 555-0126",
      pickup: "Home",
      destination: "Office",
      status: "Completed",
      statusColor: "bg-green-100 text-green-800",
    },
    {
      name: "Jerome Bell",
      company: "QuickRide",
      phone: "(629) 555-0129",
      pickup: "Office",
      destination: "Home",
      status: "Completed",
      statusColor: "bg-green-100 text-green-800",
    },
    {
      name: "Kathryn Murphy",
      company: "Red Taxi",
      phone: "(406) 555-0120",
      pickup: "Office",
      destination: "Home",
      status: "Complete",
      statusColor: "bg-green-100 text-green-800",
    },
    {
      name: "Jacob Jones",
      company: "FastTrack",
      phone: "(208) 555-0112",
      pickup: "Office",
      destination: "Home",
      status: "Complete",
      statusColor: "bg-green-100 text-green-800",
    },
    {
      name: "Kristin Watson",
      company: "ABC taxi",
      phone: "(704) 555-0127",
      pickup: "Home",
      destination: "Office",
      status: "On the way",
      statusColor: "bg-red-100 text-red-800",
    },
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

          <NavigationMenu active="drivers" />
          <QuickActions />
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className=" p-6 h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-[#171717]">Drivers</h1>
              <HeaderControls />
            </div>

            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="bg-white/60 rounded-lg p-6 border border-[#d8d8d8]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Drivers</p>
                    <p className="text-2xl font-bold text-[#171717]">5,423</p>
                    <div className="flex items-center gap-1 text-sm">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="text-green-600">16% this month</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/60 rounded-lg p-6 border border-[#d8d8d8]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <UserCheck className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Fleet Managers</p>
                    <p className="text-2xl font-bold text-[#171717]">1,893</p>
                    <div className="flex items-center gap-1 text-sm">
                      <TrendingDown className="h-3 w-3 text-red-600" />
                      <span className="text-red-600">1% this month</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/60 rounded-lg p-6 border border-[#d8d8d8]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Monitor className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Active Drivers</p>
                    <p className="text-2xl font-bold text-[#171717]">1890</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 flex items-center gap-2">
                <Input
                  placeholder="Search software, services and more..."
                  className="flex-1 bg-white/60 border-[#d8d8d8]"
                />
                <Button className="bg-[#ffc641] hover:bg-[#ffb800] text-black">
                  <Search className="h-4 w-4 mr-2" />
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
                <Download className="h-4 w-4 ml-2" />
              </Button>
            </div>

            <div className="bg-white/60 rounded-lg border border-[#d8d8d8] overflow-hidden">
              <div className="grid grid-cols-6 gap-4 p-4 bg-gray-50/50 border-b border-[#d8d8d8] text-sm font-medium text-gray-500">
                <div>Customer Name</div>
                <div>Company</div>
                <div>Phone Number</div>
                <div>PickUp Point</div>
                <div>Destination</div>
                <div>Status</div>
              </div>

              {driversData.map((driver, index) => (
                <div
                  key={index}
                  className="grid grid-cols-6 gap-4 p-4 border-b border-[#d8d8d8] last:border-b-0 hover:bg-white/40"
                >
                  <div className="font-medium text-[#171717]">{driver.name}</div>
                  <div className="text-[#171717]">{driver.company}</div>
                  <div className="text-[#171717]">{driver.phone}</div>
                  <div className="text-[#171717]">{driver.pickup}</div>
                  <div className="text-[#171717]">{driver.destination}</div>
                  <div>
                    <Badge className={driver.statusColor}>{driver.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
