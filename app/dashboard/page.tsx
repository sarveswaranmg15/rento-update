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
import NavigationMenu from '@/components/navigation-menu'
import QuickActions from '@/components/quick-actions'
import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'
export default function Dashboard() {
  const [counts, setCounts] = useState<{ total_drivers: number; total_employees: number } | null>(null)
  const [tenants, setTenants] = useState<Array<any>>([])
  const [changes, setChanges] = useState<{ drivers_change: number; employees_change: number } | null>(null)
  const [revenue, setRevenue] = useState<any | null>(null)
  const [payments, setPayments] = useState<any[]>([])

  const [trendsData, setTrendsData] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'history' | 'payment'>('history')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/metrics/dashboard')
        if (!res.ok) return
        const data = await res.json()
        setCounts(data.counts)
        setTenants(data.tenants || [])
  setChanges(data.changes || null)
  setRevenue(data.revenue || null)
  setPayments(data.payments || [])
      } catch (e) {
        // ignore; frontend will show placeholders
      }
    }
    load()
  }, [])

  // derive a simple payments summary for Payment tab
  const paymentSummary = payments.reduce((acc: Record<string, { count: number; total: number }>, p: any) => {
    const method = p.payment_method || 'Unknown'
    if (!acc[method]) acc[method] = { count: 0, total: 0 }
    acc[method].count += 1
    acc[method].total += Number(p.amount || 0)
    return acc
  }, {})

  useEffect(() => {
    let mounted = true
    async function loadTrends() {
      try {
        const res = await fetch('/api/metrics/trends?days=30')
        if (!res.ok) return
        const data = await res.json()
        const trends: Array<any> = data.trends || []
        // trends come in DESC order; reverse to chronological
        const prepared = trends
          .slice()
          .reverse()
          .map((t: any) => ({
            date: new Date(t.booking_date).toLocaleDateString(),
            total: Number(t.total_bookings || 0),
            completed: Number(t.completed_bookings || 0),
            cancelled: Number(t.cancelled_bookings || 0),
          }))
        if (mounted) setTrendsData(prepared)
      } catch (e) {
        // ignore
      }
    }
    loadTrends()
    return () => { mounted = false }
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
          <NavigationMenu active="dashboard" />
          <QuickActions />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#171717]">Dashboard</h1>
          </div>

          <h2 className="text-xl font-bold text-[#171717] mb-4">Rides Summary</h2>
          <div className="h-64 bg-gradient-to-r from-[#e3e3e3] to-[#f0f0f0] rounded-lg flex items-center justify-center mb-4 p-3">
            <div className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                {
                  (() => {
                    // Ensure axes render even when there's no real data by using a small fallback dataset
                    const hasRealData = trendsData && trendsData.length > 0
                    const fallback = (() => {
                      const d1 = new Date()
                      const d2 = new Date(Date.now() + 24 * 60 * 60 * 1000)
                      return [
                        { date: d1.toLocaleDateString(), total: 0, completed: 0, cancelled: 0 },
                        { date: d2.toLocaleDateString(), total: 0, completed: 0, cancelled: 0 },
                      ]
                    })()

                    const chartData = hasRealData ? trendsData : fallback
                    const yDomain = hasRealData ? undefined : [0, 1]

                    return (
                      <LineChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#333' }} stroke="#ccc" />
                        <YAxis tick={{ fontSize: 11, fill: '#333' }} allowDecimals={false} domain={yDomain} stroke="#ccc" />
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={24} />
                        <Line type="monotone" dataKey="total" stroke="#00aaff" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="completed" stroke="#00cc88" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="cancelled" stroke="#ff6666" strokeWidth={2} dot={false} />
                      </LineChart>
                    )
                  })()
                }
              </ResponsiveContainer>
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
                <div className="flex items-center text-xs mt-1" style={{ color: changes ? (changes.drivers_change >= 0 ? '#16a34a' : '#dc2626') : '#16a34a' }}>
                  {changes && changes.drivers_change < 0 ? (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  )}
                  {changes ? `${Math.round(Math.abs(Number(changes.drivers_change)))}%` : '—'}
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
                <div className="flex items-center text-xs mt-1" style={{ color: changes ? (changes.employees_change >= 0 ? '#16a34a' : '#dc2626') : '#dc2626' }}>
                  {changes && changes.employees_change < 0 ? (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  )}
                  {changes ? `${Math.round(Math.abs(Number(changes.employees_change)))}%` : '—'}
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
              {tenants && tenants.length > 0 ? (
                tenants.slice(0, 5).map((t: any, i: number) => (
                  <div key={t.id ?? i} className="flex items-center justify-between p-3 rounded-lg bg-white/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">{(t.company_name || '').charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-medium text-[#171717]">{t.company_name}</p>
                        <p className="text-xs text-[#333333]">{t.created_at ? new Date(t.created_at).toLocaleDateString() : ''}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-[#333333]">View</Button>
                  </div>
                ))
              ) : (
                <div className="text-sm text-[#555]">No tenant history available.</div>
              )}
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
                  <p className="text-2xl font-bold">{revenue ? new Intl.NumberFormat(undefined, { style: 'currency', currency: 'INR' }).format(Number(revenue.total_revenue || 0)) : '—'}</p>
                </div>
                <div className="w-10 h-6 bg-white/20 rounded flex items-center justify-center">
                  <CreditCard className="h-4 w-4" />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex-1">
                  <p className="text-[#e5e7eb] mb-1">Last payment method</p>
                  <p className="font-medium">{payments && payments.length > 0 ? (payments[0].payment_method || '-') : '-'}</p>
                </div>
                <div className="ml-4">
                  <Settings className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card className="form-card">
            <CardHeader>
              <div className="flex space-x-4 border-b border-[#d8d8d8]">
                <Button
                  variant="ghost"
                  className={"rounded-none " + (activeTab === 'history' ? 'border-b-2 border-[#171717] text-[#171717]' : 'text-[#333333]')}
                  onClick={() => setActiveTab('history')}
                >
                  History
                </Button>
                <Button
                  variant="ghost"
                  className={"rounded-none " + (activeTab === 'payment' ? 'border-b-2 border-[#171717] text-[#171717]' : 'text-[#333333]')}
                  onClick={() => setActiveTab('payment')}
                >
                  Payment
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeTab === 'history' ? (
                payments && payments.length > 0 ? (
                  payments.map((p, index) => (
                    <div key={p.payment_number ?? index} className="flex items-center justify-between py-2">
                      <div>
                        <span className="font-medium text-[#171717]">{p.payment_description || p.payment_method || p.payment_number}</span>
                        <div className="text-xs text-[#555]">{p.payment_date ? new Date(p.payment_date).toLocaleString() : ''}</div>
                      </div>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                        {p.payment_status || 'Unknown'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-[#555]">No transactions available.</div>
                )
              ) : (
                // Payment tab: show summary by payment method
                Object.keys(paymentSummary).length > 0 ? (
                  Object.entries(paymentSummary).map(([method, info]) => (
                    <div key={method} className="flex items-center justify-between py-2">
                      <div>
                        <span className="font-medium text-[#171717]">{method}</span>
                        <div className="text-xs text-[#555]">{info.count} transaction{info.count > 1 ? 's' : ''}</div>
                      </div>
                      <div className="font-medium text-[#171717]">{new Intl.NumberFormat(undefined, { style: 'currency', currency: 'INR' }).format(info.total)}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-[#555]">No payment methods available.</div>
                )
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
