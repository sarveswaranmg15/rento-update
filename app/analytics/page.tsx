"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, Settings, User, ChevronDown, Users, Car, Clock } from "lucide-react"
import HeaderControls from '@/components/header-controls'
import QuickActions from '@/components/quick-actions'
import NavigationMenu from '@/components/navigation-menu'
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from 'react'
import { Chart } from 'react-google-charts'

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<any | null>(null)
  const [companies, setCompanies] = useState<any[]>([])
  const [hex, setHex] = useState<any[]>([])
  const [schema, setSchema] = useState<string | null>(null)
  const [tenants, setTenants] = useState<any[]>([])
  const [tenantValue, setTenantValue] = useState<string>('all-tenants')

  async function loadAnalytics(s?: string | null){
    try{
      const url = '/api/analytics' + (s ? ('?schema=' + encodeURIComponent(s)) : '')
      const res = await fetch(url)
      if(res.ok){
        const data = await res.json()
        setMetrics(data?.metrics || data?.data || null)
        setCompanies(data?.companies || [])
        setHex(data?.hex || [])
      }
    }catch(e){ console.error('load analytics', e) }
  }

  useEffect(()=>{
    (async ()=>{
      try{
        const raw = sessionStorage.getItem('user')
        let s: string | null = null
        if(raw){
          const u = JSON.parse(raw)
          s = u?.tenant?.schemaName || u?.schemaName || u?.tenant?.schema_name || null
        }
        setSchema(s)
        if (s) setTenantValue(s)
        await loadAnalytics(s)
      }catch(e){ console.error('init analytics', e) }
    })()
  },[])

  useEffect(()=>{
    (async ()=>{
      try{
        const res = await fetch('/api/tenants')
        if(res.ok){
          const data = await res.json()
          setTenants(data?.tenants || [])
        }
      }catch(e){ console.error('load tenants', e) }
    })()
  },[])
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

          <NavigationMenu active="analytics" />
          <QuickActions />
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

            <Select value={tenantValue} onValueChange={async (val)=>{
              setTenantValue(val)
              const nextSchema = val === 'all-tenants' ? null : val
              setSchema(nextSchema)
              await loadAnalytics(nextSchema)
            }}>
               <SelectTrigger className="w-48 bg-white/60 border-[#d8d8d8]">
                 <SelectValue placeholder="Tenant" />
               </SelectTrigger>
               <SelectContent>
                <SelectItem value="all-tenants">Tenant: All</SelectItem>
                {tenants.map((t:any)=> (
                  <SelectItem key={t.schema_name} value={t.schema_name}>
                    {t.label || t.subdomain || t.schema_name}
                  </SelectItem>
                ))}
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
                    {metrics?.active_users ?? 0}
                    <span className="text-sm text-[#333333]">/{metrics?.total_users ?? 0}</span>
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
                  <div className="text-2xl font-bold text-[#171717]">{metrics?.active_drivers ?? 0}</div>
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
                  <div className="text-2xl font-bold text-[#171717]">
                    {metrics?.avg_travel_seconds != null ? `${Math.floor(metrics.avg_travel_seconds/60)}m ${Math.round(metrics.avg_travel_seconds%60)}s` : '—'}
                  </div>
                </CardContent>
              </Card>

              {/* Last Month Revenue */}
              <Card className="form-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-[#333333]">Last Month Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#171717]">
                    {metrics?.last_month_revenue != null ? Intl.NumberFormat(undefined, { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(metrics.last_month_revenue)) : '—'}
                  </div>
                  <div className="mt-2">
                    <Chart
                      chartType="ColumnChart"
                      width="100%"
                      height="80px"
                      data={(() => {
                        const v = Number(metrics?.last_month_revenue) || 0
                        return [['Label','Revenue'], ['Last Month', v]]
                      })() as any}
                      options={{ legend: 'none', colors: ['#10b981'], chartArea: { width: '90%', height: '60%' }, hAxis: { textPosition: 'none' }, vAxis: { textPosition: 'none', viewWindow: { min: 0 } } }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Current */}
              <Card className="form-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-[#333333]">Current</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#171717] mb-2">
                    {metrics?.current_pct != null ? `${Math.round(metrics.current_pct)}%` : '—'}
                  </div>
                  <Chart
                    chartType="LineChart"
                    width="100%"
                    height="80px"
                    data={(() => {
                      const rows = (metrics?.monthly_bookings || []).map((m:any)=> [String(m.month || ''), Number(m.value)||0])
                      return [['Month','Bookings'], ...(rows.length ? rows : [['-', 0]])]
                    })() as any}
                    options={{ legend: 'none', chartArea: { width: '90%', height: '60%' }, hAxis: { textPosition: 'none' }, vAxis: { textPosition: 'none' }, curveType: 'function', colors: ['#3b82f6'] }}
                  />
                </CardContent>
              </Card>

              {/* Usage Increase */}
              <Card className="form-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-[#333333]">Usage Increase</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#171717] mb-2">
                    {metrics?.usage_increase_pct != null ? `${metrics.usage_increase_pct > 0 ? '+' : ''}${Math.round(metrics.usage_increase_pct)}%` : '—'}
                  </div>
                  <Chart
                    chartType="LineChart"
                    width="100%"
                    height="80px"
                    data={(() => {
                      const rows = (metrics?.monthly_bookings || []).map((m:any)=> [String(m.month || ''), Number(m.value)||0])
                      return [['Month','Bookings'], ...(rows.length ? rows : [['-', 0]])]
                    })() as any}
                    options={{ legend: 'none', chartArea: { width: '90%', height: '60%' }, hAxis: { textPosition: 'none' }, vAxis: { textPosition: 'none' }, curveType: 'function', colors: ['#3b82f6'] }}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Bar Chart - Right Side */}
            <div className="lg:col-span-1">
              <Card className="form-card h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-[#333333]">Monthly Bookings</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <Chart
                    chartType="ColumnChart"
                    width="100%"
                    height="260px"
                    data={(() => {
                      const rows = (metrics?.monthly_bookings || []).map((m:any)=> [String(m.month || ''), Number(m.value) || 0])
                      return [['Month', 'Bookings'], ...(rows.length ? rows : [['-', 0]])]
                    })() as any}
                    options={{ title: 'Monthly Bookings', legend: { position: 'none' }, colors: ['#3b82f6'], chartArea: { width: '85%', height: '70%' } }}
                  />
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
                <Chart
                  chartType="PieChart"
                  width="100%"
                  height="260px"
                  data={(() => {
                    const rows = companies.map((c:any)=> [String(c.label || 'Unknown'), Number(c.value) || 0])
                    return [['Company', 'Bookings'], ...(rows.length ? rows : [['No Data', 0]])]
                  })() as any}
                  options={{ legend: { position: 'right' }, chartArea: { width: '80%', height: '80%' } }}
                />
              </CardContent>
            </Card>

            {/* Hex Bins */}
            <Card className="form-card">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-[#171717]">Hex bins</CardTitle>
                <p className="text-sm text-[#333333]">#20 colors, diverging palette</p>
              </CardHeader>
              <CardContent>
                <Chart
                  chartType="BubbleChart"
                  width="100%"
                  height="280px"
                  data={(() => {
                    const rows = hex.map((h:any, i:number)=> [String(h.bin_x + ',' + h.bin_y), Number(h.bin_x)||0, Number(h.bin_y)||0, 'B', Number(h.value)||0])
                    return [['ID','X','Y','Group','Size'], ...(rows.length ? rows : [['0,0', 0, 0, 'B', 0]])]
                  })() as any}
                  options={{ colorAxis: { colors: ['#93c5fd', '#1d4ed8'] }, legend: 'none', chartArea: { width: '85%', height: '75%' } }}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
