"use client"

import { useEffect, useState } from 'react'
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
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'

export default function DriversPage() {
  const [metrics, setMetrics] = useState<{ total_drivers: number; total_fleet_managers: number; active_drivers: number } | null>(null)
  const [changes, setChanges] = useState<{ drivers_change: number; employees_change: number; fleet_managers_change?: number } | null>(null)
  const [driversData, setDriversData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc')
  const [limit, setLimit] = useState(50)
  const [offset, setOffset] = useState(0)
  const [totalDrivers, setTotalDrivers] = useState(0)
  const [filterOpen, setFilterOpen] = useState(false)

  async function exportCsv() {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.set('search', searchTerm)
      if (sortField) params.set('sort', sortField)
      if (sortDir) params.set('dir', sortDir)
      params.set('export', 'csv')

      const res = await fetch('/api/drivers?' + params.toString())
      if (!res.ok) throw new Error('export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `drivers_export_${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('export error', e)
    }
  }

  async function load() {
    setLoading(true)
    try {
      // build query params
      const params = new URLSearchParams()
      if (searchTerm) params.set('search', searchTerm)
      if (sortField) params.set('sort', sortField)
      if (sortDir) params.set('dir', sortDir)
      if (limit) params.set('limit', String(limit))
      if (offset) params.set('offset', String(offset))

      const res = await fetch('/api/drivers?' + params.toString())
      if (!res.ok) throw new Error('failed')
      const data = await res.json()
      // Coerce numeric/string values returned from the API into proper numbers
      const rawMetrics = data.metrics || { total_drivers: 0, total_fleet_managers: 0, active_drivers: 0 }
        // If API returns a total_fleet_managers value at top-level (from changes), prefer it
        const totalFleetFromTop = Number(data.total_fleet_managers ?? rawMetrics.total_fleet_managers) || 0
        setMetrics({
          total_drivers: Number(rawMetrics.total_drivers) || 0,
          total_fleet_managers: totalFleetFromTop,
          active_drivers: Number(rawMetrics.active_drivers) || 0,
        })

      const rawChanges = data.changes || { drivers_change: 0, employees_change: 0 }
      setChanges({
        drivers_change: Number(rawChanges.drivers_change) || 0,
        employees_change: Number(rawChanges.employees_change) || 0,
        fleet_managers_change: Number(data.fleet_managers_change ?? rawChanges.employees_change) || 0,
      })
  // map drivers to table-friendly shape
  setDriversData((data.drivers || []).map((d: any) => ({
        name: d.driver_code || d.id,
        company: '',
        phone: '',
        pickup: '',
        destination: '',
        status: d.status || '',
        statusColor: d.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      })))
  setTotalDrivers(data.meta?.total || 0)
    } catch (e) {
      console.error('load drivers error', e)
      setMetrics({ total_drivers: 0, total_fleet_managers: 0, active_drivers: 0 })
      setDriversData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

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
                    <p className="text-2xl font-bold text-[#171717]">{metrics ? metrics.total_drivers.toLocaleString() : '—'}</p>
                    <div className="flex items-center gap-1 text-sm">
                      {changes && changes.drivers_change > 0 ? (
                        <>
                          <TrendingUp className="h-3 w-3 text-green-600" />
                          <span className="text-green-600">{changes.drivers_change.toFixed(0)}% this month</span>
                        </>
                      ) : changes && changes.drivers_change < 0 ? (
                        <>
                          <TrendingDown className="h-3 w-3 text-red-600" />
                          <span className="text-red-600">{Math.abs(changes.drivers_change).toFixed(0)}% this month</span>
                        </>
                      ) : (
                        <span className="text-gray-500">— this month</span>
                      )}
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
                    <p className="text-2xl font-bold text-[#171717]">{metrics ? metrics.total_fleet_managers.toLocaleString() : '—'}</p>
                    <div className="flex items-center gap-1 text-sm">
                      {changes && (changes.fleet_managers_change ?? changes.employees_change) > 0 ? (
                        <>
                          <TrendingUp className="h-3 w-3 text-green-600" />
                          <span className="text-green-600">{(changes.fleet_managers_change ?? changes.employees_change).toFixed(0)}% this month</span>
                        </>
                      ) : changes && (changes.fleet_managers_change ?? changes.employees_change) < 0 ? (
                        <>
                          <TrendingDown className="h-3 w-3 text-red-600" />
                          <span className="text-red-600">{Math.abs(changes.fleet_managers_change ?? changes.employees_change).toFixed(0)}% this month</span>
                        </>
                      ) : (
                        <span className="text-gray-500">— this month</span>
                      )}
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
                    <p className="text-2xl font-bold text-[#171717]">{metrics ? metrics.active_drivers.toLocaleString() : '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 flex items-center gap-2">
                <Input
                  value={searchTerm}
                  onChange={(e)=> setSearchTerm((e.target as HTMLInputElement).value)}
                  placeholder="Search driver code or id..."
                  className="flex-1 bg-white/60 border-[#d8d8d8]"
                />
                <Button className="bg-[#ffc641] hover:bg-[#ffb800] text-black" onClick={()=>{ setOffset(0); load() }}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
              <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="bg-white/60 border-[#d8d8d8]">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56">
                  <div className="flex flex-col gap-3">
                    <label className="text-sm text-gray-600">Sort by</label>
                    <select value={sortField} onChange={(e)=> setSortField(e.target.value)} className="bg-white/60 border-[#d8d8d8] p-2 rounded">
                      <option value="created_at">Newest</option>
                      <option value="rating">Rating</option>
                      <option value="driver_code">Driver Code</option>
                    </select>
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
               <Button variant="outline" className="bg-white/60 border-[#d8d8d8]" onClick={exportCsv}>
                 Export
                 <Download className="h-4 w-4 ml-2" />
               </Button>
             </div>

             <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
               <div>Showing {Math.min(totalDrivers, offset+1)} - {Math.min(totalDrivers, offset+limit)} of {totalDrivers}</div>
               <div className="flex items-center gap-2">
                 <Button variant="ghost" onClick={()=> { setOffset(Math.max(0, offset - limit)); load() }} disabled={offset===0}>Prev</Button>
                 <Button variant="ghost" onClick={()=> { setOffset(offset + limit); load() }} disabled={offset+limit >= totalDrivers}>Next</Button>
               </div>
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

               {driversData.map((driver: any, index: number) => (
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
