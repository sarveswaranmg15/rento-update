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
  Building,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  TrendingUp,
  TrendingDown,
  Edit,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function AdminPanelPage() {
  const membersData = [
    {
      userId: "HR001",
      company: "Microsoft",
      phone: "(225) 555-0118",
      email: "jane@microsoft.com",
      status: "Verified",
      statusColor: "bg-green-100 text-green-800",
    },
    {
      userId: "FL002",
      company: "Fasttrack",
      phone: "(205) 555-0100",
      email: "floyd@yahoo.com",
      status: "Verification Pending",
      statusColor: "bg-red-100 text-red-800",
    },
    {
      userId: "HR008",
      company: "Adobe",
      phone: "(302) 555-0107",
      email: "ronald@adobe.com",
      status: "Verified",
      statusColor: "bg-green-100 text-green-800",
    },
    {
      userId: "HR005",
      company: "Tesla",
      phone: "(252) 555-0126",
      email: "marvin@tesla.com",
      status: "Verification Pending",
      statusColor: "bg-red-100 text-red-800",
    },
    {
      userId: "FL101",
      company: "RedTaxi",
      phone: "(629) 555-0129",
      email: "jerome@google.com",
      status: "Verified",
      statusColor: "bg-green-100 text-green-800",
    },
    {
      userId: "HR101",
      company: "Microsoft",
      phone: "(406) 555-0120",
      email: "kathryn@microsoft.com",
      status: "Verification Pending",
      statusColor: "bg-red-100 text-red-800",
    },
    {
      userId: "FL223",
      company: "ABC cabs",
      phone: "(208) 555-0112",
      email: "jacob@yahoo.com",
      status: "Verified",
      statusColor: "bg-green-100 text-green-800",
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
            <Button
              variant="secondary"
              className="w-full justify-start bg-white/60 text-[#171717] hover:bg-white/80 rounded-full"
            >
              Admin Panel
            </Button>
            <Link href="/my-bookings">
              <Button variant="ghost" className="w-full justify-start text-[#171717] hover:bg-white/20">
                My Bookings
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="ghost" className="w-full justify-start text-[#171717] hover:bg-white/20">
                Profile
              </Button>
            </Link>
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

          <div className="mt-8 text-xs text-[#333333]">Rento Admin Sunday 17 August, 2025</div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className=" p-6 h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-[#171717]">Admin Panel</h1>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="bg-white/60 border-[#d8d8d8]">
                  <Settings className="h-4 w-4 mr-2" />
                  Select Tenant
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
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
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="bg-white/60 rounded-lg p-6 border border-[#d8d8d8]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Building className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Companies</p>
                    <p className="text-2xl font-bold text-[#171717]">500</p>
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
                    <p className="text-sm text-gray-500">Total HR</p>
                    <p className="text-2xl font-bold text-[#171717]">900</p>
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
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Fleets</p>
                    <p className="text-2xl font-bold text-[#171717]">800</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Controls */}
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

            {/* Active Members Table */}
            <div className="bg-white/60 rounded-lg border border-[#d8d8d8] overflow-hidden">
              <div className="p-4 border-b border-[#d8d8d8]">
                <h3 className="text-lg font-semibold text-teal-600">Active Members</h3>
              </div>

              <div className="grid grid-cols-6 gap-4 p-4 bg-gray-50/50 border-b border-[#d8d8d8] text-sm font-medium text-gray-500">
                <div>User ID</div>
                <div>Company</div>
                <div>Phone Number</div>
                <div>Email</div>
                <div>Edit</div>
                <div>Status</div>
              </div>

              {membersData.map((member, index) => (
                <div
                  key={index}
                  className="grid grid-cols-6 gap-4 p-4 border-b border-[#d8d8d8] last:border-b-0 hover:bg-white/40"
                >
                  <div className="font-medium text-[#171717]">{member.userId}</div>
                  <div className="text-[#171717]">{member.company}</div>
                  <div className="text-[#171717]">{member.phone}</div>
                  <div className="text-[#171717]">{member.email}</div>
                  <div>
                    <Button variant="ghost" size="sm" className="p-1">
                      <Edit className="h-4 w-4 text-[#171717]" />
                    </Button>
                  </div>
                  <div>
                    <Badge className={member.statusColor}>{member.status}</Badge>
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
