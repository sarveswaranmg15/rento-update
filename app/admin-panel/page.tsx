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
  Building,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  TrendingUp,
  TrendingDown,
  Edit,
} from "lucide-react"
import HeaderControls from '@/components/header-controls'
import NavigationMenu from '@/components/navigation-menu'
import QuickActions from '@/components/quick-actions'
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function AdminPanelPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [metrics, setMetrics] = useState<{ total_companies:number, total_hr:number, total_fleets:number, total_companies_change?:number, total_hr_change?:number, total_fleets_change?:number } | null>(null)
  const [members, setMembers] = useState<Array<any>>([])
  const [tenantName, setTenantName] = useState<string | null>(null)
  const [search, setSearch] = useState<string>('')
  const [showActiveOnly, setShowActiveOnly] = useState<boolean | null>(null) // null = all, true = active only, false = inactive only
  const [filterOpen, setFilterOpen] = useState<boolean>(false)
  const [modalSearch, setModalSearch] = useState<string>('')
  const [modalShowActiveOnly, setModalShowActiveOnly] = useState<boolean | null>(null)
  const [modalSort, setModalSort] = useState<string>('created_at')
  const [modalDir, setModalDir] = useState<string>('desc')
  const [modalLimit, setModalLimit] = useState<number>(25)
  const [offset, setOffset] = useState<number>(0)

  // Authorization guard: only super admins can access
  useEffect(() => {
    let superAdmin = false
    try {
      const raw = sessionStorage.getItem('user')
      if (raw) {
        const u = JSON.parse(raw)
        if (u?.role === 'super_admin') superAdmin = true
      }
    } catch {}
    if (!superAdmin && typeof document !== 'undefined') {
      try { if (document.cookie.split('; ').includes('super_admin=1')) superAdmin = true } catch {}
    }
    setIsSuperAdmin(superAdmin)
    setAuthChecked(true)
    if (!superAdmin) {
      router.replace('/admin')
    }
  }, [router])

  useEffect(()=>{
    if (!isSuperAdmin) return
    async function load() {
      try {
        const res = await fetch('/api/admin/metrics')
        if (!res.ok) return
        const data = await res.json()
        setMetrics(data.metrics || null)
      } catch (e) {
        console.error('failed to load metrics', e)
      }
    }
    load()
    // loadMembers is defined in component scope
    loadMembers()
  }, [isSuperAdmin])

  // loadMembers is defined in component scope so it can be called from UI handlers
  async function loadMembers(params?: { search?: string, is_active?: string }){
    try{
      const qp = new URLSearchParams()
      if (params?.search) qp.set('search', params.search)
      if (params?.is_active) qp.set('is_active', params.is_active)
  // include pagination and sort params
  qp.set('limit', String(modalLimit))
  qp.set('offset', String(offset))
  qp.set('sort', modalSort)
  qp.set('dir', modalDir)
  const res = await fetch('/api/admin/members' + (qp.toString() ? `?${qp.toString()}` : ''))
      if(!res.ok) return
      const data = await res.json()
      setMembers(data.members || [])
      if(data.tenantName) setTenantName(data.tenantName)
  // update offset from response meta if present
  if(data.meta && typeof data.meta.offset === 'number') setOffset(data.meta.offset)
    }catch(e){ console.error('failed to load members', e) }
  }

  // export filtered members as CSV
  async function exportCsv() {
    try {
      // build query params for server fallback
      const qp = new URLSearchParams()
      if (search) qp.set('search', search)
      if (showActiveOnly !== null) qp.set('is_active', String(showActiveOnly))
      qp.set('limit', String(modalLimit))
      qp.set('offset', String(offset))
      qp.set('sort', modalSort)
      qp.set('dir', modalDir)

      // If we have members loaded in the UI, generate CSV client-side so we control formatting (BOM, quoting)
      if (members && members.length > 0) {
        const header = ['employee_id', 'company', 'phone', 'email', 'status', 'created_at']
        const rows = members.map(m => [
          m.employee_id ?? m.id ?? '',
          tenantName ?? '',
          m.phone ?? '',
          m.email ?? '',
          m.is_active ? 'Active' : 'Inactive',
          m.created_at ?? ''
        ])

        // escape and quote values, add UTF-8 BOM for Excel compatibility
        const escape = (v: any) => '"' + String(v).replace(/"/g, '""') + '"'
        const csvContent = '\uFEFF' + [header, ...rows].map(r => r.map(escape).join(',')).join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        const ts = new Date().toISOString().replace(/[:.]/g, '-')
        a.href = url
        a.download = `members_export_${ts}.csv`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
        return
      }

      // Fallback: request server-side CSV if no members in UI
      qp.set('export', 'csv')
      const res = await fetch('/api/admin/members?' + qp.toString())
      if (!res.ok) {
        console.error('export failed', res.status)
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const ts = new Date().toISOString().replace(/[:.]/g, '-')
      a.href = url
      a.download = `members_export_${ts}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('export error', e)
    }
  }

  return (
    !authChecked || !isSuperAdmin ? (
      <div className="min-h-screen warm-gradient flex items-center justify-center p-8">
        <div className="text-[#171717]">Loading…</div>
      </div>
    ) : (
    <div className="min-h-screen warm-gradient">
      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-64 min-h-screen p-6 form-card mr-4">
          <div className="mb-8">
            <div className="flex justify-center mb-4">
              <Image src="/rento-logo-gold.png" alt="Rento Logo" width={60} height={60} className="object-contain" />
            </div>
          </div>

          <NavigationMenu active="admin-panel" />
          <QuickActions />
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className=" p-6 h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-[#171717]">Admin Panel</h1>
              <HeaderControls />
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
                    <p className="text-2xl font-bold text-[#171717]">{metrics ? metrics.total_companies : '—'}</p>
                    {metrics && typeof metrics.total_companies_change === 'number' && (
                      <div className="flex items-center gap-1 text-sm">
                        {metrics.total_companies_change >= 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        )}
                        <span className={metrics.total_companies_change >= 0 ? 'text-green-600' : 'text-red-600'}>{Math.abs(Number(metrics.total_companies_change)).toFixed(1)}%</span>
                      </div>
                    )}
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
                    <p className="text-2xl font-bold text-[#171717]">{metrics ? metrics.total_hr : '—'}</p>
                    {metrics && typeof metrics.total_hr_change === 'number' && (
                      <div className="flex items-center gap-1 text-sm">
                        {metrics.total_hr_change >= 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        )}
                        <span className={metrics.total_hr_change >= 0 ? 'text-green-600' : 'text-red-600'}>{Math.abs(Number(metrics.total_hr_change)).toFixed(1)}%</span>
                      </div>
                    )}
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
                    <p className="text-2xl font-bold text-[#171717]">{metrics ? metrics.total_fleets : '—'}</p>
                    {metrics && typeof metrics.total_fleets_change === 'number' && (
                      <div className="flex items-center gap-1 text-sm">
                        {metrics.total_fleets_change >= 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        )}
                        <span className={metrics.total_fleets_change >= 0 ? 'text-green-600' : 'text-red-600'}>{Math.abs(Number(metrics.total_fleets_change)).toFixed(1)}%</span>
                      </div>
                    )}
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
                    value={search}
                    onChange={(e:any)=>setSearch(e.target.value)}
                />
                <Button className="bg-[#ffc641] hover:bg-[#ffb800] text-black" onClick={async()=>{ setOffset(0); await loadMembers({ search, is_active: showActiveOnly===null ? undefined : String(showActiveOnly) }) }}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
                <Button variant="outline" className="bg-white/60 border-[#d8d8d8]" onClick={()=>{
                  // open centered filter modal
                  setModalSearch(search)
                  setModalShowActiveOnly(showActiveOnly)
                  setFilterOpen(true)
                }}>
                  <Filter className="h-4 w-4 mr-2" />
                  {showActiveOnly === null ? 'Filter' : showActiveOnly ? 'Active' : 'Inactive'}
                </Button>
              <Button variant="outline" className="bg-white/60 border-[#d8d8d8]" onClick={exportCsv}>
                Export
                <Download className="h-4 w-4 ml-2" />
              </Button>
            </div>

            {/* Filter Modal - centered popup */}
            {filterOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/40" onClick={()=>setFilterOpen(false)} />
                <div className="bg-white rounded-lg shadow-lg w-[520px] z-10 p-6">
                  <h3 className="text-lg font-semibold mb-4">Filters</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">Search</label>
                      <Input value={modalSearch} onChange={(e:any)=>setModalSearch(e.target.value)} placeholder="Search members..." />
                    </div>

                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">Status</label>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2"><input type="radio" name="status" checked={modalShowActiveOnly===null} onChange={()=>setModalShowActiveOnly(null)} /> All</label>
                        <label className="flex items-center gap-2"><input type="radio" name="status" checked={modalShowActiveOnly===true} onChange={()=>setModalShowActiveOnly(true)} /> Active</label>
                        <label className="flex items-center gap-2"><input type="radio" name="status" checked={modalShowActiveOnly===false} onChange={()=>setModalShowActiveOnly(false)} /> Inactive</label>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">Sort by</label>
                      <div className="flex items-center gap-2">
                        <select value={modalSort} onChange={(e)=>setModalSort(e.target.value)} className="border p-1 rounded">
                          <option value="created_at">Created</option>
                          <option value="employee_id">User ID</option>
                          <option value="first_name">First Name</option>
                          <option value="last_name">Last Name</option>
                          <option value="email">Email</option>
                        </select>
                        <select value={modalDir} onChange={(e)=>setModalDir(e.target.value)} className="border p-1 rounded">
                          <option value="desc">Desc</option>
                          <option value="asc">Asc</option>
                        </select>
                        <select value={String(modalLimit)} onChange={(e)=>setModalLimit(Number(e.target.value))} className="border p-1 rounded">
                          <option value="10">10</option>
                          <option value="25">25</option>
                          <option value="50">50</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-6">
                    <Button variant="ghost" onClick={()=>setFilterOpen(false)}>Cancel</Button>
                    <Button onClick={async()=>{
                      // apply filters
                      setSearch(modalSearch)
                      setShowActiveOnly(modalShowActiveOnly)
                      // convert to API param
                      await loadMembers({ search: modalSearch || undefined, is_active: modalShowActiveOnly===null ? undefined : String(modalShowActiveOnly) })
                      setFilterOpen(false)
                    }}>Apply</Button>
                  </div>
                </div>
              </div>
            )}

            {/* Pagination Controls */}
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button variant="outline" onClick={async()=>{ if(offset - modalLimit >= 0){ setOffset(offset - modalLimit); await loadMembers({ search, is_active: showActiveOnly===null ? undefined : String(showActiveOnly) }) } }}>Prev</Button>
              <Button variant="outline" onClick={async()=>{ setOffset(offset + modalLimit); await loadMembers({ search, is_active: showActiveOnly===null ? undefined : String(showActiveOnly) }) }}>Next</Button>
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

              {members.map((member, index) => (
                <div
                  key={member.id || index}
                  className="grid grid-cols-6 gap-4 p-4 border-b border-[#d8d8d8] last:border-b-0 hover:bg-white/40"
                >
                  <div className="font-medium text-[#171717]">{member.employee_id || member.id}</div>
                  <div className="text-[#171717]">{tenantName || 'Company'}</div>
                  <div className="text-[#171717]">{member.phone || '-'}</div>
                  <div className="text-[#171717]">{member.email || '-'}</div>
                  <div>
                    <Button variant="ghost" size="sm" className="p-1">
                      <Edit className="h-4 w-4 text-[#171717]" />
                    </Button>
                  </div>
                  <div>
                    <Badge className={member.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{member.is_active ? 'Active' : 'Inactive'}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
  )
}
