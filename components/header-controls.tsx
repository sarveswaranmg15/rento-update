"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Bell, Settings, User, ChevronDown } from "lucide-react"
import Link from 'next/link'
import { Chart } from 'react-google-charts'

export default function HeaderControls({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

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

  useEffect(() => {
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
    // initialize current tenant label from sessionStorage
    const label = sessionStorage.getItem('selectedTenantLabel')
    if (label) setTenantLabel(label)
    // fetch tenants
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
  }

  async function saveSetting(){
    try{
      await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: settingKey, value: settingVal }) })
      setSettingsOpen(false)
    }catch{}
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Tenant Selector */}
      <div className="relative" ref={tenantRef}>
        <Button variant="outline" className="bg-white/60 border-[#d8d8d8]" onClick={() => setTenantsOpen(o => !o)}>
          <Settings className="h-4 w-4 mr-2" />
          {tenantLabel}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
        {tenantsOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded shadow-lg border border-[#e5e7eb] z-50 max-h-80 overflow-auto">
            <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100" onClick={() => selectTenant(null, 'All Tenants')}>All Tenants</button>
            {tenants.map((t:any)=> (
              <button key={t.schema_name} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100" onClick={() => selectTenant(t.schema_name, t.label || t.subdomain || t.schema_name)}>
                {t.label || t.subdomain || t.schema_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <Button variant="ghost" size="sm" onClick={async ()=>{ setNotifOpen(o=>!o); if(!notifOpen) await loadNotifications() }} aria-haspopup="true" aria-expanded={notifOpen}>
          <Bell className="h-4 w-4" />
        </Button>
        {notifOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded shadow-lg border border-[#e5e7eb] z-50 max-h-96 overflow-auto">
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <span className="text-sm font-medium">Notifications</span>
              <button className="text-xs text-blue-600" onClick={markAllNotifications}>Mark all read</button>
            </div>
            <div className="divide-y">
              {notifs.length === 0 && <div className="p-3 text-sm text-gray-500">No notifications</div>}
              {notifs.map((n:any)=> (
                <div key={n.id} className="p-3 text-sm">
                  <div className="font-medium text-gray-800 flex items-center justify-between">
                    <span>{n.title || 'Notification'}</span>
                    {!n.is_read && <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full" />}
                  </div>
                  {n.body && <div className="text-gray-600 mt-1">{n.body}</div>}
                  <div className="text-xs text-gray-400 mt-1">{n.created_at ? new Date(n.created_at).toLocaleString() : ''}</div>
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
          <div className="absolute right-0 mt-2 w-72 bg-white rounded shadow-lg border border-[#e5e7eb] z-50 p-3">
            <div className="text-sm font-medium mb-2">Settings</div>
            <label className="block text-xs text-gray-600 mb-1">Key</label>
            <input value={settingKey} onChange={e=>setSettingKey(e.target.value)} className="w-full border rounded px-2 py-1 text-sm mb-2" />
            <label className="block text-xs text-gray-600 mb-1">Value</label>
            <input value={settingVal} onChange={e=>setSettingVal(e.target.value)} className="w-full border rounded px-2 py-1 text-sm mb-3" />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={()=> setSettingsOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={saveSetting}>Save</Button>
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
