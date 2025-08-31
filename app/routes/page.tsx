"use client"

import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bell, Settings, User, ChevronDown, Filter, ArrowUpDown, MapPin, Download } from "lucide-react"
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import HeaderControls from '@/components/header-controls'
import QuickActions from '@/components/quick-actions'
import NavigationMenu from '@/components/navigation-menu'
import Link from "next/link"
import Image from "next/image"

type Route = {
  id: string,
  route_code: string,
  estimated_distance?: number,
  frequency_minutes?: number,
  start_location?: string,
  end_location?: string
}

export default function RoutesPage() {
  const [routeData, setRouteData] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [limit, setLimit] = useState(50)
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  const [sortField, setSortField] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc')
  const [filterOpen, setFilterOpen] = useState(false)
  const [isActiveFilter, setIsActiveFilter] = useState<string>('')
  const [minDistance, setMinDistance] = useState<string>('')
  const [maxDistance, setMaxDistance] = useState<string>('')
  const [startLocationFilter, setStartLocationFilter] = useState<string>('')
  const [endLocationFilter, setEndLocationFilter] = useState<string>('')

  async function exportCsv() {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.set('search', searchTerm)
      if (sortField) params.set('sort', sortField)
      if (sortDir) params.set('dir', sortDir)
  if (isActiveFilter) params.set('is_active', isActiveFilter)
  if (minDistance) params.set('min_distance', minDistance)
  if (maxDistance) params.set('max_distance', maxDistance)
  if (startLocationFilter) params.set('start_location', startLocationFilter)
  if (endLocationFilter) params.set('end_location', endLocationFilter)
      params.set('export', 'csv')

      const res = await fetch('/api/routes?' + params.toString())
      if (!res.ok) throw new Error('export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `routes_export_${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('export error', e)
    }
  }

  async function load() {
    const params = new URLSearchParams()
    if (searchTerm) params.set('search', searchTerm)
  if (sortField) params.set('sort', sortField)
  if (sortDir) params.set('dir', sortDir)
    params.set('limit', String(limit))
    params.set('offset', String(offset))
  if (isActiveFilter) params.set('is_active', isActiveFilter)
  if (minDistance) params.set('min_distance', minDistance)
  if (maxDistance) params.set('max_distance', maxDistance)
  if (startLocationFilter) params.set('start_location', startLocationFilter)
  if (endLocationFilter) params.set('end_location', endLocationFilter)

    const res = await fetch('/api/routes?' + params.toString())
    if (!res.ok) return
    const data = await res.json()
    setRouteData(data.routes || [])
    setTotal(data.meta?.total || 0)
  }

  useEffect(() => { load() }, [offset, limit])

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
                  value={searchTerm}
                  onChange={(e)=> setSearchTerm((e.target as HTMLInputElement).value)}
                  placeholder="Search routes..."
                  className="pr-24 bg-white/60 border-[#d8d8d8] text-[#171717] placeholder:text-[#333333]"
                />
                <Button className="absolute right-1 top-1/2 -translate-y-1/2 bg-[#ffc641] hover:bg-[#ffc641]/90 text-[#171717] px-6" onClick={()=> { setOffset(0); load() }}>
                  Search
                </Button>
            </div>
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="bg-white/60 border-[#d8d8d8] text-[#171717]">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72">
                <div className="flex flex-col gap-3">
                  <label className="text-sm text-gray-600">Sort by</label>
                  <select value={sortField} onChange={(e)=> setSortField(e.target.value)} className="bg-white/60 border-[#d8d8d8] p-2 rounded">
                    <option value="created_at">Newest</option>
                    <option value="route_code">Route Code</option>
                    <option value="estimated_distance">Distance</option>
                    <option value="frequency_minutes">Frequency</option>
                    <option value="name">Name</option>
                  </select>

                  <label className="text-sm text-gray-600">Status</label>
                  <select value={isActiveFilter} onChange={(e)=> setIsActiveFilter(e.target.value)} className="bg-white/60 border-[#d8d8d8] p-2 rounded">
                    <option value="">Any</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm text-gray-600">Min distance</label>
                      <input value={minDistance} onChange={(e)=> setMinDistance(e.target.value)} className="w-full p-2 bg-white/60 border-[#d8d8d8] rounded" />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Max distance</label>
                      <input value={maxDistance} onChange={(e)=> setMaxDistance(e.target.value)} className="w-full p-2 bg-white/60 border-[#d8d8d8] rounded" />
                    </div>
                  </div>

                  <label className="text-sm text-gray-600">Start location</label>
                  <input value={startLocationFilter} onChange={(e)=> setStartLocationFilter(e.target.value)} className="w-full p-2 bg-white/60 border-[#d8d8d8] rounded" />

                  <label className="text-sm text-gray-600">End location</label>
                  <input value={endLocationFilter} onChange={(e)=> setEndLocationFilter(e.target.value)} className="w-full p-2 bg-white/60 border-[#d8d8d8] rounded" />

                  <div className="flex items-center gap-2">
                    <Button variant="outline" className="bg-white/60 border-[#d8d8d8]" onClick={()=> { setSortDir(s=> s==='asc' ? 'desc' : 'asc'); }}>
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      {sortDir === 'asc' ? 'Asc' : 'Desc'}
                    </Button>
                    <Button className="bg-[#ffc641] hover:bg-[#ffb800] text-black" onClick={()=>{ setOffset(0); load(); setFilterOpen(false); }}>
                      Apply
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Button variant="outline" className="bg-white/60 border-[#d8d8d8] text-[#171717]" onClick={exportCsv}>
              Export
              <Download className="h-4 w-4 ml-2" />
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
                  {routeData.map((route: Route, index: number) => (
                    <tr key={route.id} className={index % 2 === 0 ? "bg-white/20" : ""}>
                      <td className="py-4 px-4 text-[#171717] font-medium">{route.route_code}</td>
                      <td className="py-4 px-4 text-[#171717]">{route.estimated_distance}</td>
                      <td className="py-4 px-4 text-[#171717]">{route.frequency_minutes}</td>
                      <td className="py-4 px-4 text-[#171717]">{route.start_location}</td>
                      <td className="py-4 px-4 text-[#171717]">{route.end_location}</td>
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
