"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Bell, Settings, User, ChevronDown } from "lucide-react"
import Link from 'next/link'
// removed unused Chart import to avoid any potential SSR/CSR divergence
import { useTheme } from 'next-themes'

export default function HeaderControls({ className = "" }: { className?: string }) {
  // Note: Do NOT derive initial auth from cookies during first render to avoid hydration mismatch
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [mounted, setMounted] = useState(false)

  const [tenantsOpen, setTenantsOpen] = useState(false)
  const tenantRef = useRef<HTMLDivElement | null>(null)
  const [tenants, setTenants] = useState<any[]>([])
  const [tenantLabel, setTenantLabel] = useState<string>('Select Tenant')

  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState<any[]>([])
  const notifRef = useRef<HTMLDivElement | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement | null>(null)
  const [settingKey, setSettingKey] = useState('dashboard.theme')
  const [settingVal, setSettingVal] = useState('light')
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
  // flip to mounted after first paint to render real UI
  setMounted(true)

    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
      if (tenantRef.current && !tenantRef.current.contains(e.target as Node)) {
        setTenantsOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setSettingsOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  useEffect(() => {
    // Determine super admin from sessionStorage or (fallback) cookie on client after mount
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
    // Only consider cookie fallback when there is no user session persisted
    if (!sup && !hasUser) {
      try {
        const cookieStr = typeof document !== 'undefined' ? document.cookie : ''
        sup = /(?:^|; )super_admin=1(?:;|$)/.test(cookieStr)
      } catch {}
    }
    setIsSuperAdmin(sup)
    setAuthChecked(true)
    if (!sup) return

    // initialize current tenant label from sessionStorage
    const label = sessionStorage.getItem('selectedTenantLabel')
    if (label) setTenantLabel(label)
    // fetch tenants only for super admin
    ;(async ()=>{
      try{
        const res = await fetch('/api/tenants')
        if(res.ok){
          const data = await res.json()
          setTenants(data?.tenants || [])
        }
      }catch{}
    })()
  }, [])

  async function loadNotifications(){
    try{
      const res = await fetch('/api/notifications')
      if(res.ok){
        const data = await res.json()
        setNotifs(data?.notifications || [])
      }
    }catch{}
  }

  async function markAllNotifications(){
    try{ await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true }) }) ; await loadNotifications() }catch{}
  }

  function selectTenant(schema: string | null, label: string) {
    if (schema) {
      sessionStorage.setItem('selectedTenantSchema', schema)
      sessionStorage.setItem('selectedTenantLabel', label)
      setTenantLabel(label)
    } else {
      sessionStorage.removeItem('selectedTenantSchema')
      sessionStorage.setItem('selectedTenantLabel', 'All Tenants')
      setTenantLabel('All Tenants')
    }
    setTenantsOpen(false)
    // set cookie for SSR and cross-page
    fetch(`/api/tenant/select?schema=${schema ? encodeURIComponent(schema) : ''}`).catch(()=>{})
    // notify app
    try { (window as any).dispatchEvent(new CustomEvent('tenant:changed', { detail: { schema, label } })) } catch {}
    window.location.reload();
  }

  async function saveSetting(){
    try{
      await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: settingKey, value: settingVal }) })
      setSettingsOpen(false)
    }catch{}
  }

  // Stable placeholder to ensure SSR and first client render are identical
  if (!mounted) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="h-9 w-36 bg-muted rounded-md" />
        <div className="h-9 w-9 bg-muted rounded-md" />
        <div className="h-9 w-9 bg-muted rounded-md" />
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Tenant Selector - visible only to super admin */}
  {authChecked && isSuperAdmin && (
        <div className="relative" ref={tenantRef}>
          <Button variant="outline" className="bg-secondary/60 border-border" onClick={() => setTenantsOpen(o => !o)}>
            <Settings className="h-4 w-4 mr-2" />
            {tenantLabel}
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
          {tenantsOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-popover text-popover-foreground rounded shadow-lg border border-border z-50 max-h-80 overflow-auto">
              {tenants.map((t:any)=> (
                <button key={t.schema_name} className="w-full text-left px-3 py-2 text-sm hover:bg-accent" onClick={() => selectTenant(t.schema_name, t.label || t.subdomain || t.schema_name)}>
                  {t.label || t.subdomain || t.schema_name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <Button variant="ghost" size="sm" onClick={async ()=>{ setNotifOpen(o=>!o); if(!notifOpen) await loadNotifications() }} aria-haspopup="true" aria-expanded={notifOpen}>
          <Bell className="h-4 w-4" />
        </Button>
        {notifOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-popover text-popover-foreground rounded shadow-lg border border-border z-50 max-h-96 overflow-auto">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <span className="text-sm font-medium">Notifications</span>
              <button className="text-xs text-blue-600" onClick={markAllNotifications}>Mark all read</button>
            </div>
            <div className="divide-y">
              {notifs.length === 0 && <div className="p-3 text-sm text-muted-foreground">No notifications</div>}
              {notifs.map((n:any)=> (
                <div key={n.id} className="p-3 text-sm">
                  <div className="font-medium text-popover-foreground flex items-center justify-between">
                    <span>{n.title || 'Notification'}</span>
                    {!n.is_read && <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full" />}
                  </div>
                  {n.body && <div className="text-muted-foreground mt-1">{n.body}</div>}
                  <div className="text-xs text-muted-foreground mt-1">{n.created_at ? new Date(n.created_at).toLocaleString() : ''}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="relative" ref={settingsRef}>
        <Button variant="ghost" size="sm" onClick={()=> setSettingsOpen(o=>!o)} aria-haspopup="true" aria-expanded={settingsOpen}>
          <Settings className="h-4 w-4" />
        </Button>
        {settingsOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-popover text-popover-foreground rounded shadow-lg border border-border z-50 p-3">
            <div className="text-sm font-medium mb-3">Theme</div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={resolvedTheme === 'light' ? 'default' : 'outline'}
                onClick={() => { setTheme('light'); setSettingsOpen(false) }}
              >
                Light
              </Button>
              <Button
                size="sm"
                variant={resolvedTheme === 'dark' ? 'default' : 'outline'}
                onClick={() => { setTheme('dark'); setSettingsOpen(false) }}
              >
                Dark
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Profile */}
      <div className="relative" ref={menuRef}>
        <Button variant="ghost" size="sm" onClick={() => setOpen(o => !o)} aria-haspopup="true" aria-expanded={open}>
          <User className="h-4 w-4" />
        </Button>

        {open && (
          <div className="absolute right-0 mt-2 w-40 bg-popover text-popover-foreground rounded shadow-lg border border-border z-50">
            <Link href="/profile" className="block px-4 py-2 text-sm hover:bg-accent">Profile</Link>
            <button
              className="w-full text-left px-4 py-2 text-sm hover:bg-accent"
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
