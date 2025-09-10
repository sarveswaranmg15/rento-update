"use client"

import Image from 'next/image'
import NavigationMenu from '@/components/navigation-menu'
import QuickActions from '@/components/quick-actions'
import HeaderControls from '@/components/header-controls'

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        <div className="w-64 min-h-screen p-6 form-card mr-4">
          <div className="mb-8">
            <div className="flex justify-center mb-4">
              <Image src="/rento-logo-gold.png" alt="Rento Logo" width={60} height={60} className="object-contain" />
            </div>
          </div>
          <NavigationMenu />
          <QuickActions />
        </div>
        <div className="flex-1 p-6">
          <div className="form-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-[#171717]">Notifications</h1>
              <HeaderControls />
            </div>

            <div className="space-y-4 text-sm text-gray-600">
              <p>This page shows your notifications. Use the bell in the header to preview and mark them as read.</p>
              <ul className="list-disc pl-6">
                <li>Ride updates</li>
                <li>Payment receipts</li>
                <li>Promotions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
