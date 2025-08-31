"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"
import {
  Settings,
  User,
  TrendingUp,
  TrendingDown,
  Plus,
  ChevronRight,
  CreditCard,
  Bell,
  ChevronDown,
} from "lucide-react"

import HeaderControls from '@/components/header-controls'
import UserInfoFooter from '@/components/user-info-footer'
import { useEffect, useState } from 'react'
export default function Dashboard() {
  const [counts, setCounts] = useState<{ total_drivers: number; total_employees: number } | null>(null)
  const [tenants, setTenants] = useState<Array<any>>([])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/metrics/dashboard')
        if (!res.ok) return
        const data = await res.json()
        setCounts(data.counts)
        setTenants(data.tenants || [])
      } catch (e) {
        // ignore; frontend will show placeholders
      }
    }
    load()
  }, [])
  return (
    <div className="min-h-screen warm-gradient relative">
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
            <Button
              variant="secondary"
              className="w-full justify-start bg-white/60 text-[#171717] hover:bg-white/80 rounded-full"
            >
              Dashboard
            </Button>
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
              <Button className="w-full bg-[#ffc641] hover:bg-[#ffb800] text-[#171717] font-medium px-3.5 mx-0">Book Ride</Button>
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

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#171717]">Dashboard</h1>
          </div>

          <h2 className="text-xl font-bold text-[#171717] mb-4">Rides Summary</h2>
          <div className="h-64 bg-gradient-to-r from-[#e3e3e3] to-[#f0f0f0] rounded-lg flex items-center justify-center mb-4">
            <div className="w-full h-full relative">
              <svg className="w-full h-full" viewBox="0 0 400 200">
                <polyline
                  fill="none"
                  stroke="#00ff88"
                  strokeWidth="3"
                  points="20,150 60,120 100,140 140,100 180,110 220,80 260,90 300,70 340,100 380,120"
                />
              </svg>
              <div className="absolute bottom-2 left-0 right-0 flex justify-between text-xs text-[#666666] px-4">
                <span>3 July</span>
                <span>4 July</span>
                <span>5 July</span>
                <span>6 July</span>
                <span>7 July</span>
                <span>8 July</span>
                <span>9 July</span>
              </div>
            </div>
          </div>

          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="form-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#333333]">Total Number of Drivers</CardTitle>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <span className="text-[#333333]">•••</span>
                </Button>
              </CardHeader>
              <CardContent>
          <div className="text-2xl font-bold text-[#171717]">{counts ? counts.total_drivers : '—'}</div>
                <div className="flex items-center text-xs text-green-600 mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  12%
                </div>
              </CardContent>
            </Card>

      <Card className="form-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#333333]">Total Number of Employees</CardTitle>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <span className="text-[#333333]">•••</span>
                </Button>
              </CardHeader>
              <CardContent>
        <div className="text-2xl font-bold text-[#171717]">{counts ? counts.total_employees : '—'}</div>
                <div className="flex items-center text-xs text-red-600 mt-1">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  8%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tenant History */}
          <Card className="form-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-[#171717]">Tenant History</CardTitle>
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
      <div className="flex items-center justify-between p-3 rounded-lg bg-white/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-orange-600">✦</span>
                  </div>
                  <div>
        <p className="font-medium text-[#171717]">{tenants[0]?.company_name ?? 'CRED'}</p>
        <p className="text-xs text-[#333333]">{tenants[0]?.created_at ? new Date(tenants[0].created_at).toLocaleDateString() : 'Joined 5 days ago'}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-[#333333]">
                  View
                </Button>
              </div>

      <div className="flex items-center justify-between p-3 rounded-lg bg-white/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-pink-600">F</span>
                  </div>
                  <div>
        <p className="font-medium text-[#171717]">{tenants[1]?.company_name ?? 'Flipkart'}</p>
        <p className="text-xs text-[#333333]">{tenants[1]?.created_at ? new Date(tenants[1].created_at).toLocaleDateString() : 'Joined 10 days ago'}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-[#333333]">
                  View
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Third Panel - Right Side */}
        <div className="w-80 p-6">
          {/* User Controls */}
          <HeaderControls className="justify-end mb-6" />
          {/* Revenue Card */}
          <Card className="mb-6 bg-gradient-to-br from-gray-700 to-gray-900 text-white overflow-hidden relative">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm opacity-80 mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold">$32,819.00</p>
                </div>
                <div className="w-10 h-6 bg-white/20 rounded flex items-center justify-center">
                  <CreditCard className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="opacity-80">Visa</p>
                  <p>•••• •••• •••• 1890</p>
                </div>
                <div className="text-right">
                  <p>05/26</p>
                </div>
              </div>
              <ChevronRight className="absolute top-1/2 right-4 transform -translate-y-1/2 h-5 w-5 opacity-60" />
            </CardContent>
          </Card>

          {/* Admin Card Details */}
          <Card className="form-card mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-[#171717]">Admin</CardTitle>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#333333] mb-1">Card name</p>
                  <p className="font-medium text-[#171717]">Emirhan Dikci</p>
                </div>
                <div>
                  <p className="text-[#333333] mb-1">Card no</p>
                  <p className="font-medium text-[#171717]">•••• •••• •••• 1234</p>
                </div>
                <div>
                  <p className="text-[#333333] mb-1">CVV</p>
                  <p className="font-medium text-[#171717]">•••</p>
                </div>
                <div>
                  <p className="text-[#333333] mb-1">Valid until</p>
                  <p className="font-medium text-[#171717]">01/31</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card className="form-card">
            <CardHeader>
              <div className="flex space-x-4 border-b border-[#d8d8d8]">
                <Button variant="ghost" className="border-b-2 border-[#171717] text-[#171717] rounded-none">
                  History
                </Button>
                <Button variant="ghost" className="text-[#333333] rounded-none">
                  Payment
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: "Tokopaedi", status: "Completed" },
                { name: "Bli bli", status: "Completed" },
                { name: "Amazon", status: "Completed" },
                { name: "Amazon", status: "Completed" },
              ].map((transaction, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <span className="font-medium text-[#171717]">{transaction.name}</span>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    {transaction.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
