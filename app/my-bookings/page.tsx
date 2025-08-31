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
import { useEffect, useState } from "react"

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [limit, setLimit] = useState(50)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalSearch, setModalSearch] = useState('')
  const [modalStatus, setModalStatus] = useState<string | null>(null)
  const [modalSort, setModalSort] = useState('created_at')
  const [modalDir, setModalDir] = useState<'asc'|'desc'>('desc')
  // global sort/dir used for listing and export
  const [sort, setSort] = useState<string>('created_at')
  const [dir, setDir] = useState<'asc'|'desc'>('desc')

  async function loadBookings() {
    setLoading(true)
    try {
      const qp = new URLSearchParams()
      if (searchTerm) qp.set('search', searchTerm)
      if (statusFilter) qp.set('status', statusFilter)
      qp.set('limit', String(limit))
      qp.set('offset', String(offset))
      qp.set('sort', sort)
      qp.set('dir', dir)
      const res = await fetch('/api/my-bookings?' + qp.toString())
      if (!res.ok) {
        const txt = await res.text().catch(()=>'<no body>')
        console.error('loadBookings failed:', res.status, txt)
        // include response body in thrown error for caller stack
        throw new Error(`loadBookings failed: ${res.status} ${txt}`)
      }
      const data = await res.json()
      setBookings(data.bookings || [])
    } catch (e) {
      console.error('load bookings', e)
      setBookings([])
    } finally { setLoading(false) }
  }

  useEffect(()=>{ loadBookings() }, [offset])

  async function exportCsv() {
    const qp = new URLSearchParams()
    if (searchTerm) qp.set('search', searchTerm)
    if (statusFilter) qp.set('status', statusFilter)
    qp.set('sort', sort)
    qp.set('dir', dir)
    qp.set('export', 'csv')
    const res = await fetch('/api/my-bookings?' + qp.toString())
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bookings_export_${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

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
                value={searchTerm}
                onChange={(e:any)=>setSearchTerm(e.target.value)}
              />
              <Button className="absolute right-1 top-1 bg-[#ffc641] hover:bg-[#ffb800] text-[#171717] h-8" onClick={()=>{ setOffset(0); loadBookings() }}>
                Search
              </Button>
            </div>
            <Button variant="outline" className="bg-white/60 border-[#d8d8d8]" onClick={()=>{ setModalSearch(searchTerm); setModalStatus(statusFilter); setModalSort(modalSort); setModalDir(modalDir); setModalOpen(true) }}>
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" className="bg-white/60 border-[#d8d8d8]" onClick={exportCsv}>
              Export
              <ExportIcon className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex gap-2 mb-6">
            <Button variant={statusFilter === 'completed' ? 'secondary' : 'ghost'} className={statusFilter === 'completed' ? 'bg-white/60 rounded-full' : 'text-[#171717] hover:bg-white/20'} onClick={()=>{ setStatusFilter('completed'); setOffset(0); loadBookings() }}>
              Completed
            </Button>
            <Button variant={statusFilter === 'cancelled' ? 'secondary' : 'ghost'} className={statusFilter === 'cancelled' ? 'bg-white/60 rounded-full' : 'text-[#171717] hover:bg-white/20'} onClick={()=>{ setStatusFilter('cancelled'); setOffset(0); loadBookings() }}>
              Cancelled
            </Button>
            <Button variant={statusFilter === 'upcoming' ? 'secondary' : 'ghost'} className={statusFilter === 'upcoming' ? 'bg-white/60 rounded-full' : 'text-[#171717] hover:bg-white/20'} onClick={()=>{ setStatusFilter('upcoming'); setOffset(0); loadBookings() }}>
              Upcoming
            </Button>
          </div>

          {/* Booking Cards */}
          <div className="space-y-4">
            {bookings.map((b:any)=> (
              <div key={b.id} className="form-card p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <span className="font-semibold text-[#171717]">{b.booking_number}</span>
                      <Badge className={b.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>{b.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <span className="text-sm text-[#333333]">Pickup: </span>
                        <span className="text-[#171717]">{b.pickup_location}</span>
                      </div>
                      <div>
                        <span className="text-sm text-[#333333]">Dropoff: </span>
                        <span className="text-[#171717]">{b.dropoff_location}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-[#333333]">Date: </span>
                        <span className="text-[#171717]">{new Date(b.scheduled_pickup_time).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-sm text-[#333333]">Fare: </span>
                        <span className="text-[#171717]">{b.estimated_cost} (Estimated)</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-4">
                    <div className="text-center">
                      <p className="text-sm text-[#333333] mb-1">Car Type</p>
                      <p className="font-semibold text-[#171717]">{b.car_type || 'Sedan'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-[#333333] mb-2">Driver</p>
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={b.driver_avatar || '/smiling-man-driver.png'} />
                        <AvatarFallback>{(b.driver_name || 'DR').split(' ').map((n: string) => n[0]).join('').slice(0,2)}</AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filter Modal */}
          {modalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/40" onClick={()=>setModalOpen(false)} />
              <div className="bg-white rounded-lg shadow-lg w-[520px] z-10 p-6">
                <h3 className="text-lg font-semibold mb-4">Filters</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Search</label>
                    <Input value={modalSearch} onChange={(e:any)=>setModalSearch(e.target.value)} placeholder="Search bookings..." />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Status</label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2"><input type="radio" name="status" checked={modalStatus===null} onChange={()=>setModalStatus(null)} /> All</label>
                      <label className="flex items-center gap-2"><input type="radio" name="status" checked={modalStatus==='completed'} onChange={()=>setModalStatus('completed')} /> Completed</label>
                      <label className="flex items-center gap-2"><input type="radio" name="status" checked={modalStatus==='cancelled'} onChange={()=>setModalStatus('cancelled')} /> Cancelled</label>
                      <label className="flex items-center gap-2"><input type="radio" name="status" checked={modalStatus==='upcoming'} onChange={()=>setModalStatus('upcoming')} /> Upcoming</label>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Sort by</label>
                    <div className="flex items-center gap-2">
                      <select value={modalSort} onChange={(e)=>setModalSort(e.target.value)} className="border p-1 rounded">
                        <option value="created_at">Created</option>
                        <option value="booking_number">Booking #</option>
                        <option value="pickup_location">Pickup</option>
                        <option value="dropoff_location">Dropoff</option>
                        <option value="estimated_cost">Fare</option>
                      </select>
                      <select value={modalDir} onChange={(e)=>setModalDir(e.target.value as 'asc'|'desc')} className="border p-1 rounded">
                        <option value="desc">Desc</option>
                        <option value="asc">Asc</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="ghost" onClick={()=>setModalOpen(false)}>Cancel</Button>
                  <Button onClick={async()=>{
                    setSearchTerm(modalSearch)
                    setStatusFilter(modalStatus)
                    // apply sort/dir to global state
                    setSort(modalSort)
                    setDir(modalDir)
                    setModalOpen(false)
                    // apply sort and direction by storing into modalSort/modalDir used in loadBookings
                    setOffset(0)
                    // call loadBookings with updated params
                    await loadBookings()
                  }}>Apply</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
