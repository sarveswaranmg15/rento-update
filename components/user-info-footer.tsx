"use client"

import { useEffect, useState } from "react"

export default function UserInfoFooter({ className }: { className?: string }) {
  const [name, setName] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
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
    } catch (e) {
      setName("Rento Admin")
    }

    // Format today's date as: Sunday 31 August, 2025
    const d = new Date()
    const weekday = d.toLocaleString(undefined, { weekday: "long" })
    const day = d.getDate()
    const month = d.toLocaleString(undefined, { month: "long" })
    const year = d.getFullYear()
    setToday(`${weekday} ${day} ${month}, ${year}`)
  }, [])

  const displayName = name ?? "Rento Admin"
  const displayRole = role ? ` — ${role}` : ""

  return (
    <div className={className ? className : "mt-8 text-xs text-[#333333]"}>
      {displayName}{displayRole} {today}
    </div>
  )
}
