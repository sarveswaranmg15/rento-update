"use client"

import Image from 'next/image'
import NavigationMenu from '@/components/navigation-menu'
import QuickActions from '@/components/quick-actions'
import HeaderControls from '@/components/header-controls'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
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
              <h1 className="text-2xl font-bold text-[#171717]">Settings</h1>
              <HeaderControls />
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-[#171717] mb-2">Preferences</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded border">
                    <label className="block text-sm text-gray-600 mb-1">Theme</label>
                    <select className="w-full border rounded px-2 py-1 text-sm">
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System</option>
                    </select>
                  </div>
                  <div className="p-4 bg-white rounded border">
                    <label className="block text-sm text-gray-600 mb-1">Notifications</label>
                    <div className="flex items-center gap-2 text-sm">
                      <input id="emailNotifs" type="checkbox" className="border" defaultChecked />
                      <label htmlFor="emailNotifs">Email updates</label>
                    </div>
                    <div className="flex items-center gap-2 text-sm mt-2">
                      <input id="smsNotifs" type="checkbox" className="border" />
                      <label htmlFor="smsNotifs">SMS alerts</label>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <Button className="bg-[#171717] hover:bg-[#333333] text-white">Save Changes</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
