"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, Settings, User, ChevronDown, Users, Car, Clock } from "lucide-react"
import HeaderControls from '@/components/header-controls'
import UserInfoFooter from '@/components/user-info-footer'
import Link from "next/link"
import Image from "next/image"

export default function AnalyticsPage() {
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
            <Button
              variant="secondary"
              className="w-full justify-start bg-white/60 text-[#171717] hover:bg-white/80 rounded-full"
            >
              Analytics
            </Button>
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

          <UserInfoFooter />
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-[#171717]">Analytics</h1>
            <HeaderControls />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex gap-4 mb-6">
            <Select defaultValue="all-time">
              <SelectTrigger className="w-48 bg-white/60 border-[#d8d8d8]">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-time">Timeframe: All-time</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="last-week">Last Week</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="all-people">
              <SelectTrigger className="w-48 bg-white/60 border-[#d8d8d8]">
                <SelectValue placeholder="People" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-people">People: All</SelectItem>
                <SelectItem value="drivers">Drivers Only</SelectItem>
                <SelectItem value="customers">Customers Only</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="all-tenants">
              <SelectTrigger className="w-48 bg-white/60 border-[#d8d8d8]">
                <SelectValue placeholder="Tenant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-tenants">Tenant: All</SelectItem>
                <SelectItem value="cred">CRED</SelectItem>
                <SelectItem value="flipkart">Flipkart</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Analytics Cards - Left Side */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Active Users */}
              <Card className="form-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-sm text-[#333333]">Active Users</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#171717]">
                    27<span className="text-sm text-[#333333]">/80</span>
                  </div>
                </CardContent>
              </Card>

              {/* Active Drivers */}
              <Card className="form-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Car className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-sm text-[#333333]">Active Drivers</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#171717]">3,298</div>
                </CardContent>
              </Card>

              {/* Average Travel Length */}
              <Card className="form-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Clock className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-sm text-[#333333]">Av. Travel Length</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#171717]">2m 34s</div>
                </CardContent>
              </Card>

              {/* Last Month Revenue */}
              <Card className="form-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-[#333333]">Last Month Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#171717]">64%</div>
                </CardContent>
              </Card>

              {/* Current */}
              <Card className="form-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-[#333333]">Current</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#171717] mb-2">86%</div>
                  <div className="h-8 flex items-end">
                    <svg className="w-full h-full" viewBox="0 0 100 20">
                      <polyline
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        points="0,15 20,12 40,14 60,10 80,8 100,6"
                      />
                    </svg>
                  </div>
                </CardContent>
              </Card>

              {/* Usage Increase */}
              <Card className="form-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-[#333333]">Usage Increase</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#171717] mb-2">+34%</div>
                  <div className="h-8 flex items-end">
                    <svg className="w-full h-full" viewBox="0 0 100 20">
                      <polyline
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        points="0,18 20,16 40,14 60,12 80,8 100,4"
                      />
                    </svg>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bar Chart - Right Side */}
            <div className="lg:col-span-1">
              <Card className="form-card h-full">
                <CardContent className="p-6">
                  <div className="h-64 flex items-end justify-between gap-2">
                    {[
                      { month: "JAN", value: 150 },
                      { month: "FEB", value: 180 },
                      { month: "MAR", value: 160 },
                      { month: "APR", value: 240 },
                      { month: "MAY", value: 280 },
                      { month: "JUN", value: 200 },
                      { month: "JUL", value: 260 },
                      { month: "AUG", value: 120 },
                      { month: "SEP", value: 300 },
                      { month: "OCT", value: 340 },
                      { month: "NOV", value: 380 },
                      { month: "DEC", value: 400 },
                    ].map((data, index) => (
                      <div key={data.month} className="flex flex-col items-center gap-2 flex-1">
                        <div
                          className="w-full bg-blue-500 rounded-t-sm min-h-[4px]"
                          style={{ height: `${(data.value / 400) * 200}px` }}
                        />
                        <span className="text-xs text-[#333333] transform -rotate-45 origin-center">{data.month}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-[#333333] mt-4">
                    <span>0</span>
                    <span>100</span>
                    <span>200</span>
                    <span>300</span>
                    <span>400</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom Visualization Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bookings of Companies */}
            <Card className="form-card">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-[#171717]">Bookings of Companies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center relative overflow-hidden">
                  {/* Bubble Chart Simulation */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-full h-full">
                      {/* Large bubbles */}
                      <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-blue-500 rounded-full opacity-70 flex items-center justify-center text-white text-xs font-bold">
                        CRED
                      </div>
                      <div className="absolute top-1/3 right-1/4 w-12 h-12 bg-green-500 rounded-full opacity-70 flex items-center justify-center text-white text-xs font-bold">
                        FLIP
                      </div>
                      <div className="absolute bottom-1/3 left-1/4 w-10 h-10 bg-purple-500 rounded-full opacity-70"></div>
                      <div className="absolute top-1/4 left-1/2 w-8 h-8 bg-orange-500 rounded-full opacity-70"></div>
                      <div className="absolute bottom-1/4 right-1/3 w-14 h-14 bg-teal-500 rounded-full opacity-70"></div>

                      {/* Small bubbles */}
                      <div className="absolute top-3/4 left-1/2 w-6 h-6 bg-pink-500 rounded-full opacity-60"></div>
                      <div className="absolute top-1/6 right-1/6 w-4 h-4 bg-yellow-500 rounded-full opacity-60"></div>
                      <div className="absolute bottom-1/6 left-1/6 w-5 h-5 bg-red-500 rounded-full opacity-60"></div>
                    </div>
                  </div>

                  {/* Treemap on the right */}
                  <div className="absolute right-4 top-4 w-24 h-32 grid grid-cols-3 gap-1">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-sm ${
                          i % 4 === 0
                            ? "bg-blue-400"
                            : i % 4 === 1
                              ? "bg-purple-400"
                              : i % 4 === 2
                                ? "bg-green-400"
                                : "bg-orange-400"
                        } opacity-70`}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hex Bins */}
            <Card className="form-card">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-[#171717]">Hex bins</CardTitle>
                <p className="text-sm text-[#333333]">#20 colors, diverging palette</p>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex">
                  {/* Hexagonal heatmap simulation */}
                  <div className="flex-1 flex items-center justify-center relative">
                    <div className="grid grid-cols-8 gap-1 transform rotate-12">
                      {Array.from({ length: 64 }).map((_, i) => {
                        const colors = [
                          "bg-purple-900",
                          "bg-purple-800",
                          "bg-purple-700",
                          "bg-purple-600",
                          "bg-blue-700",
                          "bg-blue-600",
                          "bg-blue-500",
                          "bg-blue-400",
                          "bg-teal-600",
                          "bg-teal-500",
                          "bg-teal-400",
                          "bg-green-400",
                          "bg-yellow-400",
                          "bg-yellow-300",
                          "bg-orange-300",
                          "bg-orange-200",
                        ]
                        const colorIndex = Math.floor(Math.random() * colors.length)
                        return (
                          <div
                            key={i}
                            className={`w-3 h-3 ${colors[colorIndex]} opacity-80`}
                            style={{
                              clipPath: "polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)",
                            }}
                          />
                        )
                      })}
                    </div>
                  </div>

                  {/* Color Legend */}
                  <div className="w-16 flex flex-col justify-center items-center gap-1">
                    <div className="text-xs text-[#333333] mb-2">95</div>
                    {[
                      "bg-purple-900",
                      "bg-purple-800",
                      "bg-purple-700",
                      "bg-blue-700",
                      "bg-blue-600",
                      "bg-blue-500",
                      "bg-teal-600",
                      "bg-teal-500",
                      "bg-green-500",
                      "bg-yellow-400",
                      "bg-orange-300",
                    ].map((color, i) => (
                      <div key={i} className={`w-4 h-2 ${color}`} />
                    ))}
                    <div className="text-xs text-[#333333] mt-2">1</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
