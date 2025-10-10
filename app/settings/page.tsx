"use client"

import Image from 'next/image'
import NavigationMenu from '@/components/navigation-menu'
import QuickActions from '@/components/quick-actions'
import HeaderControls from '@/components/header-controls'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export default function SettingsPage() {
  const { theme, setTheme, systemTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="flex">
        <div className="w-64 min-h-screen p-6 form-card mr-4">
          <div className="mb-8">
            <div className="flex justify-center mb-4">
              <Image src="/rento-logo-gold.png" alt="Rento Logo" width={60} height={60} className="object-contain" />
            </div>
          </div>
          <NavigationMenu active="settings" />
          <QuickActions />
        </div>
        <div className="flex-1 p-6">
          <div className="form-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-[#171717] dark:text-white">Settings</h1>
              <HeaderControls />
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-[#171717] dark:text-white mb-2">Preferences</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white dark:bg-gray-800 rounded border dark:border-gray-700">
                    <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">Theme</label>
                    {/* Avoid hydration mismatch by waiting until mounted */}
                    <div className="flex gap-2">
                      <Button
                        variant={mounted && (resolvedTheme === 'light') ? 'default' : 'outline'}
                        className={mounted && (resolvedTheme === 'light') ? 'bg-[#171717] text-white hover:bg-[#333333]' : ''}
                        onClick={() => setTheme('light')}
                      >
                        Light
                      </Button>
                      <Button
                        variant={mounted && (resolvedTheme === 'dark') ? 'default' : 'outline'}
                        className={mounted && (resolvedTheme === 'dark') ? 'bg-[#171717] text-white hover:bg-[#333333]' : ''}
                        onClick={() => setTheme('dark')}
                      >
                        Dark
                      </Button>
                      <Button
                        variant={mounted && (theme === 'system' || (!theme && resolvedTheme)) ? 'default' : 'outline'}
                        className={mounted && (theme === 'system') ? 'bg-[#171717] text-white hover:bg-[#333333]' : ''}
                        onClick={() => setTheme('system')}
                      >
                        System
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-800 rounded border dark:border-gray-700">
                    <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Notifications</label>
                    <div className="flex items-center gap-2 text-sm">
                      <input id="emailNotifs" type="checkbox" className="border" defaultChecked />
                      <label htmlFor="emailNotifs" className="text-gray-700 dark:text-gray-200">Email updates</label>
                    </div>
                    <div className="flex items-center gap-2 text-sm mt-2">
                      <input id="smsNotifs" type="checkbox" className="border" />
                      <label htmlFor="smsNotifs" className="text-gray-700 dark:text-gray-200">SMS alerts</label>
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
