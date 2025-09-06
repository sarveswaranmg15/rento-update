"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

type Props = {
  active?:
    | 'dashboard'
    | 'bookings'
    | 'drivers'
    | 'routes'
    | 'analytics'
    | 'admin'
    | 'admin-panel'
    | 'my-bookings'
    | 'profile'
  | 'book-ride'
  | 'pool-ride'
  | 'schedule-ride'
}

export default function NavigationMenu({ active }: Props) {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    let sup = false
    let hasUser = false
    try {
      const raw = sessionStorage.getItem('user')
      if (raw) {
        hasUser = true
        const u = JSON.parse(raw)
        if (u?.role === 'super_admin') sup = true
      }
    } catch {}
    if (!sup && !hasUser) {
      try {
        const cookieStr = typeof document !== 'undefined' ? document.cookie : ''
        sup = /(?:^|; )super_admin=1(?:;|$)/.test(cookieStr)
      } catch {}
    }
    setIsSuperAdmin(sup)
    setAuthChecked(true)
  }, [])

  return (
    <nav className="space-y-1 mb-8">
      <Link href="/dashboard">
        <Button variant={active === 'dashboard' ? 'secondary' : 'ghost'} className={active === 'dashboard' ? 'w-full justify-start bg-white/60 text-[#171717] hover:bg-white/80 rounded-full' : 'w-full justify-start text-[#171717] hover:bg-white/20'}>
          Dashboard
        </Button>
      </Link>
      <Link href="/bookings">
        <Button variant={active === 'bookings' ? 'secondary' : 'ghost'} className={active === 'bookings' ? 'w-full justify-start bg-white/60 text-[#171717] hover:bg-white/80 rounded-full' : 'w-full justify-start text-[#171717] hover:bg-white/20'}>
          Bookings
        </Button>
      </Link>
      <Link href="/drivers">
        <Button variant={active === 'drivers' ? 'secondary' : 'ghost'} className={active === 'drivers' ? 'w-full justify-start bg-white/60 text-[#171717] hover:bg-white/80 rounded-full' : 'w-full justify-start text-[#171717] hover:bg-white/20'}>
          Drivers
        </Button>
      </Link>
      <Link href="/routes">
        <Button variant={active === 'routes' ? 'secondary' : 'ghost'} className={active === 'routes' ? 'w-full justify-start bg-white/60 text-[#171717] hover:bg-white/80 rounded-full' : 'w-full justify-start text-[#171717] hover:bg-white/20'}>
          Routes
        </Button>
      </Link>
      <Link href="/analytics">
        <Button variant={active === 'analytics' ? 'secondary' : 'ghost'} className={active === 'analytics' ? 'w-full justify-start bg-white/60 text-[#171717] hover:bg-white/80 rounded-full' : 'w-full justify-start text-[#171717] hover:bg-white/20'}>
          Analytics
        </Button>
      </Link>
      {authChecked && isSuperAdmin && (
        <Link href="/admin-panel">
          <Button
            variant={active === 'admin' || active === 'admin-panel' ? 'secondary' : 'ghost'}
            className={active === 'admin' || active === 'admin-panel' ? 'w-full justify-start bg-white/60 text-[#171717] hover:bg-white/80 rounded-full' : 'w-full justify-start text-[#171717] hover:bg-white/20'}
          >
            Admin Panel
          </Button>
        </Link>
      )}
      <Link href="/my-bookings">
        <Button variant={active === 'my-bookings' ? 'secondary' : 'ghost'} className={active === 'my-bookings' ? 'w-full justify-start bg-white/60 text-[#171717] hover:bg-white/80 rounded-full' : 'w-full justify-start text-[#171717] hover:bg-white/20'}>
          My Bookings
        </Button>
      </Link>
      <Link href="/profile">
        <Button variant={active === 'profile' ? 'secondary' : 'ghost'} className={active === 'profile' ? 'w-full justify-start bg-white/60 text-[#171717] hover:bg-white/80 rounded-full' : 'w-full justify-start text-[#171717] hover:bg-white/20'}>
          Profile
        </Button>
      </Link>
      {/* <Link href="/book-ride">
        <Button variant={active === 'book-ride' ? 'secondary' : 'ghost'} className={active === 'book-ride' ? 'w-full justify-start bg-white/60 text-[#171717] hover:bg-white/80 rounded-full' : 'w-full justify-start text-[#171717] hover:bg-white/20'}>
          Book Ride
        </Button>
      </Link>
      <Link href="/schedule-ride">
        <Button variant={active === 'schedule-ride' ? 'secondary' : 'ghost'} className={active === 'schedule-ride' ? 'w-full justify-start bg-white/60 text-[#171717] hover:bg-white/80 rounded-full' : 'w-full justify-start text-[#171717] hover:bg-white/20'}>
          Schedule Ride
        </Button>
      </Link>
      <Link href="/pool-ride">
        <Button variant={active === 'pool-ride' ? 'secondary' : 'ghost'} className={active === 'pool-ride' ? 'w-full justify-start bg-white/60 text-[#171717] hover:bg-white/80 rounded-full' : 'w-full justify-start text-[#171717] hover:bg-white/20'}>
          Pool Ride
        </Button>
      </Link> */}
    </nav>
  )
}
