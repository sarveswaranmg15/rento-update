"use client"

import { useEffect, useState } from "react"
import { Calendar } from "lucide-react"

export default function UserInfoFooter({ className }: { className?: string }) {
  const [name, setName] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [tenant, setTenant] = useState<string | null>(null)
  const [today, setToday] = useState<string>("")

  useEffect(() => {
    // Load user from sessionStorage if available
    try {
      const raw = sessionStorage.getItem("user")
      if (raw) {
        const u = JSON.parse(raw)
        // Accept different possible shapes
        setName(u.firstName ? `${u.firstName} ${u.lastName ?? ""}`.trim() : u.name ?? u.email ?? "Rento Admin")
        setRole(u.role ?? u.role_name ?? null)
      } else {
        setName("Rento Admin")
      }
    } catch {
      setName("Rento Admin")
    }

    // Load selected tenant label if any (set by header controls)
    try {
      const tl = sessionStorage.getItem("selectedTenantLabel")
      if (tl) setTenant(tl)
    } catch {}

    // Format today's date as: Sunday 31 August, 2025 (client-side only to avoid hydration mismatch)
    const d = new Date()
    const weekday = d.toLocaleString(undefined, { weekday: "short" })
    const day = d.getDate()
    const month = d.toLocaleString(undefined, { month: "short" })
    setToday(`${weekday}, ${day} ${month}`)
  }, [])

  const displayName = name ?? "Rento Admin"
  const prettyRole = role ? (role as string).replace(/_/g, " ") : null

  return (
    <div className={className ? className : "mt-8 pt-3 text-xs text-[#333333]"}>
      <div className="space-y-1">
        {/* Name */}
        <div className="flex items-center gap-2">
          <span className="w-16 text-[#171717] font-medium">Name</span>
          <span className="text-[#171717]">:</span>
          <span className="truncate">{displayName}</span>
        </div>

        {/* Role */}
        {prettyRole && (
          <div className="flex items-center gap-2">
            <span className="w-16 text-[#171717] font-medium">Role</span>
            <span className="text-[#171717]">:</span>
            <span>
              <span className="flex items-center gap-2 text-gray-500">
                {prettyRole}
              </span>
            </span>
          </div>
        )}

        {/* Tenant */}
        {tenant && (
          <div className="flex items-center gap-2">
            <span className="w-16 text-[#171717] font-medium">Tenant</span>
            <span className="text-[#171717]">:</span>
            <span className="truncate text-gray-700">{tenant}</span>
          </div>
        )}

        {/* Date */}
        <div className="flex items-center gap-2">
          <span className="w-16 text-[#171717] font-medium">Date</span>
          <span className="text-[#171717]">:</span>
          <span className="flex items-center gap-2 text-gray-500">
            {today}
          </span>
        </div>
      </div>
    </div>
  )
}
