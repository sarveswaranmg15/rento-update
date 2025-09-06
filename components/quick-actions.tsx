"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import UserInfoFooter from '@/components/user-info-footer'

type Props = {
  primaryAction?: string // e.g. '/book-ride'
  showSchedule?: boolean
  showPool?: boolean
}

export default function QuickActions({ primaryAction = '/book-ride', showSchedule = true, showPool = true }: Props) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-[#333333] mb-3">Quick Actions</h3>
      <Link href={primaryAction}>
        <Button className="w-full bg-[#ffc641] hover:bg-[#ffb800] text-[#171717] font-medium px-3.5 mx-0">
          Book Ride
        </Button>
      </Link>
      {showSchedule ? (
        <Link href="/schedule-ride">
          <Button className="w-full bg-[#ffc641] hover:bg-[#ffb800] text-[#171717] font-medium my-3 py-0">
            Schedule Ride
          </Button>
        </Link>
      ) : null}
      {showPool ? (
        <Link href="/pool-ride">
          <Button className="w-full bg-[#ffc641] hover:bg-[#ffb800] text-[#171717] font-medium">Pool Ride</Button>
        </Link>
      ) : null}

      <UserInfoFooter />
    </div>
  )
}
