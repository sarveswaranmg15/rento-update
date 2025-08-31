"use client"

import { Button } from "@/components/ui/button"
import { Bell, Settings, User, ChevronDown } from "lucide-react"

export default function HeaderControls({ className = "" }: { className?: string }) {
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
      <Button variant="ghost" size="sm">
        <User className="h-4 w-4" />
      </Button>
    </div>
  )
}
