"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Bell, Settings, User, ChevronDown, Upload } from "lucide-react"
import HeaderControls from '@/components/header-controls'
import QuickActions from '@/components/quick-actions'
import NavigationMenu from '@/components/navigation-menu'
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState, useRef } from 'react'

export default function ProfilePage() {
  const [profile, setProfile] = useState<any | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [mobile, setMobile] = useState('')
  const [email, setEmail] = useState('')
  const [favourites, setFavourites] = useState('')
  const [schema, setSchema] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // helper to normalize different user shapes
  function normalize(u:any){
    if(!u) return null
    return {
      id: u.id || u.user_id || null,
      firstName: u.firstName ?? u.first_name ?? '',
      lastName: u.lastName ?? u.last_name ?? '',
      email: u.email ?? '',
      role: u.role ?? u.user_role ?? 'User',
      phone: u.phone ?? u.mobile ?? '',
      rides_count: u.rides_count ?? u.ridesCount ?? u.rides ?? 0,
      tenant: u.tenant ?? u.schemaName ? { schemaName: u.schemaName } : (u.tenant || null),
      avatar_url: u.avatar_url ?? u.avatarUrl ?? ''
    }
  }

  async function loadProfile(){
    setLoading(true)
    try{
      const selected = sessionStorage.getItem('selectedTenantSchema')
      if (selected) setSchema(selected)
      let filled = false
      try{
        const raw = sessionStorage.getItem('user')
        if (raw) {
          const parsed = JSON.parse(raw)
          const maybeId = parsed?.id || parsed?.user_id || null
          if (maybeId) {
            const res = await fetch('/api/profile?id=' + encodeURIComponent(maybeId))
            if (res.ok) {
              const data = await res.json()
              const rawUser = data.user || null
              if (rawUser) {
                const p = normalize(rawUser)
                if (p) {
                  setProfile(p)
                  setAvatarPreview(null)
                  setFirstName(p.firstName || '')
                  setLastName(p.lastName || '')
                  setMobile(p.phone || '')
                  setEmail(p.email || '')
                  setFavourites(rawUser.favourites || rawUser.favorite || '')
                  try { sessionStorage.setItem('user', JSON.stringify(rawUser)) } catch{}
                  filled = true
                }
              }
            }
          } else {
            const p = normalize(parsed)
            if (p) {
              setProfile(p)
              setAvatarPreview(null)
              setFirstName(p.firstName || '')
              setLastName(p.lastName || '')
              setMobile(p.phone || '')
              setEmail(p.email || '')
              setFavourites(parsed.favourites || parsed.favorite || '')
              filled = true
            }
          }
        }
      } catch {}
      
      if (!filled) {
        try{
          const res = await fetch('/api/profile')
          if(res.ok){
            const data = await res.json()
            const rawUser = data.user || null
            if (rawUser) {
              const p = normalize(rawUser)
              if (p) {
                setProfile(p)
                setAvatarPreview(null)
                setFirstName(p.firstName || '')
                setLastName(p.lastName || '')
                setMobile(p.phone || '')
                setEmail(p.email || '')
                setFavourites(rawUser.favourites || rawUser.favorite || '')
                try { sessionStorage.setItem('user', JSON.stringify(rawUser)) } catch{}
              }
            }
          }
        } catch {}
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{ loadProfile() }, [])

  async function save(avatarOverride?: string){
    if(!profile?.id) return
    try{
      setSaving(true)
      const payload:any = { id: String(profile.id), first_name: firstName, last_name: lastName, phone: mobile, email }
      const avatarUrl = avatarOverride != null ? avatarOverride : profile?.avatar_url
      if (avatarUrl) payload.avatar_url = avatarUrl
      if (schema) payload.schema = schema
      const res = await fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if(!data?.ok){ console.error('save failed', data?.error) } else { await loadProfile() }
    } finally { setSaving(false) }
  }
  
  async function onAvatarSelected(e: React.ChangeEvent<HTMLInputElement>){
    const file = e.target.files && e.target.files[0]
    if (!file) return
    // quick preview
    try {
      const previewUrl = URL.createObjectURL(file)
      setAvatarPreview(previewUrl)
    } catch {}
    // upload to server
    const fd = new FormData()
    fd.append('file', file)
    try{
      const res = await fetch('/api/upload/avatar', { method: 'POST', body: fd })
      const data = await res.json()
      if (data?.ok && data?.url) {
        setProfile((p:any)=> ({ ...(p||{}), avatar_url: data.url }))
        await save(data.url)
      }
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  if (loading) return <div className="p-6">Loading...</div>
  if (!profile) return <div className="p-6">No user found</div>

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

          <NavigationMenu active="profile" />
          <QuickActions />
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="form-card p-6 h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-[#171717]">Profile</h1>
              <HeaderControls />
            </div>

            {/* Profile Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Side - Profile Info */}
              <div className="flex flex-col items-center space-y-6">
                {/* Avatar */}
                <div className="relative">
                  {(avatarPreview || profile?.avatar_url) ? (
                    <img src={avatarPreview || profile?.avatar_url || ''} alt="Avatar" className="w-32 h-32 rounded-full object-cover border" />
                  ) : (
                    <div className="w-32 h-32 bg-teal-800 rounded-full flex items-center justify-center">
                      <svg className="w-16 h-16 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5-1.5 1.5-5-5v-.79l-.27-.27A6.516 6.516 0 0 1 9.5 16 6.5 6.5 0 0 1 3 9.5 6.5 6.5 0 0 1 9.5 3m0 2C7.01 5 5 7.01 5 9.5S7.01 14 9.5 14 14 11.99 14 9.5 11.99 5 9.5 5Z" />
                        <path d="M8.5 8.5c0 .55.45 1 1 1s1-.45 1-1-.45-1-1-1-1 .45-1 1Z" />
                        <path d="M12.5 12.5c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5Z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-[#171717] mb-1">{firstName + (lastName ? ' ' + lastName : '')}</h2>
                  <p className="text-[#666666] mb-4">{profile?.role || 'User'}</p>
                </div>

                {/* Rides Count */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#171717]">{profile?.rides_count ?? '—'}</div>
                  <div className="text-[#666666] text-sm">Rides</div>
                </div>

                {/* Upload Avatar Button */}
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={onAvatarSelected} />
                <Button variant="outline" className="bg-gray-600 border-gray-600 px-6" onClick={()=> fileRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload new avatar
                </Button>
              </div>

              {/* Right Side - Basic Info Form */}
              <div className="space-y-6">
                {/* Form Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[#171717]">BASIC INFO</h3>
                  <div className="flex gap-3">
                    <Button variant="outline" className="bg-white/60 border-[#d8d8d8] text-[#171717]" onClick={()=>{
                      sessionStorage.removeItem('user')
                      setProfile(null)
                    }}>
                      CANCEL
                    </Button>
                    <Button className="bg-[#171717] hover:bg-[#333333] text-white" onClick={()=>save()} disabled={saving}>{saving ? 'Saving...' : 'SAVE'}</Button>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  {/* First Name and Last Name Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#171717] mb-2">FIRST NAME</label>
                      <Input className="bg-white/60 border-[#d8d8d8]" value={firstName} onChange={(e:any)=>setFirstName(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#171717] mb-2">LAST NAME</label>
                      <Input className="bg-white/60 border-[#d8d8d8]" value={lastName} onChange={(e:any)=>setLastName(e.target.value)} />
                    </div>
                  </div>

                  {/* Mobile */}
                  <div>
                    <label className="block text-sm font-medium text-[#171717] mb-2">MOBILE</label>
                    <Input className="bg-white/60 border-[#d8d8d8]" value={mobile} onChange={(e:any)=>setMobile(e.target.value)} />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-[#171717] mb-2">EMAIL</label>
                    <Input className="bg-white/60 border-[#d8d8d8]" value={email} onChange={(e:any)=>setEmail(e.target.value)} />
                  </div>

                  {/* Favourites */}
                  <div>
                    <label className="block text-sm font-medium text-[#171717] mb-2">Favourites</label>
                    <Textarea
                      className="bg-white/60 border-[#d8d8d8] min-h-[120px]"
                      placeholder="Add your favourite locations, routes, or preferences..."
                      value={favourites}
                      onChange={(e:any)=>setFavourites(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
