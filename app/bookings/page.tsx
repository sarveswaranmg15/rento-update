"use client"

import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import Link from "next/link"
import { Settings, User, Bell, ChevronDown, Filter } from "lucide-react"
import HeaderControls from '@/components/header-controls'
import QuickActions from '@/components/quick-actions'
import NavigationMenu from '@/components/navigation-menu'

export default function Bookings() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const [filters, setFilters] = useState({ status: '', driver: '' })
  const [searchTerm, setSearchTerm] = useState('')

  async function fetchBookings() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.status) params.set('status', filters.status)
      // prefer the inline search box, otherwise use driver filter
      const search = searchTerm || filters.driver
      if (search) params.set('search', search)
      const res = await fetch(`/api/bookings?${params.toString()}`)
      if (!res.ok) throw new Error('failed to fetch')
      const data = await res.json()
      setBookings(data?.bookings || [])
    } catch (e) {
      console.error('fetch bookings error', e)
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-white/60 border-[#d8d8d8] text-[#171717] placeholder:text-[#666666] pr-20"
                />
                <Button onClick={() => fetchBookings()} className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-[#ffc641] hover:bg-[#ffb800] text-[#171717] font-medium px-6">
                  Search
                </Button>
              </div>
              <Button variant="outline" size="sm" className="bg-white/60 border-[#d8d8d8]" onClick={() => setShowFilter(true)}>
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {showFilter && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/40" onClick={() => setShowFilter(false)} />
              <div className="relative bg-white border p-6 rounded shadow w-full max-w-md z-10">
                <h2 className="text-lg font-medium mb-4">Filters</h2>
                <div className="mb-3">
                  <label className="block text-sm mb-1">Status</label>
                  <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="border p-2 rounded w-full">
                    <option value="">All</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="block text-sm mb-1">Driver</label>
                  <Input value={filters.driver} onChange={e => setFilters(f => ({ ...f, driver: e.target.value }))} />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="secondary" onClick={() => setShowFilter(false)}>Close</Button>
                  <Button onClick={() => { setShowFilter(false); fetchBookings(); }}>Apply</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
