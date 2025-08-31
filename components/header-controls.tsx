"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Bell, Settings, User, ChevronDown } from "lucide-react"
import Link from 'next/link'

export default function HeaderControls({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Button variant="outline" className="bg-white/60 border-[#d8d8d8]">
        <Settings className="h-4 w-4 mr-2" />
        Select Tenant
        <ChevronDown className="h-4 w-4 ml-2" />
      </Button>
      <Button variant="ghost" size="sm">
        <Bell className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm">
        <Settings className="h-4 w-4" />
      </Button>

      <div className="relative" ref={menuRef}>
        <Button variant="ghost" size="sm" onClick={() => setOpen(o => !o)} aria-haspopup="true" aria-expanded={open}>
          <User className="h-4 w-4" />
        </Button>

        {open && (
          <div className="absolute right-0 mt-2 w-40 bg-white rounded shadow-lg border border-[#e5e7eb] z-50">
            <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</Link>
            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => { window.location.href = '/api/auth/logout' }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
