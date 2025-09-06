"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Lock } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function SuperAdminSignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit() {
    setError(null)
    if (!email || !password) {
      setError("Email and password are required")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/superadmin/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Sign in failed")
      try {
        if (data.token) sessionStorage.setItem('token', data.token)
        if (data.user) sessionStorage.setItem('user', JSON.stringify(data.user))
      } catch (storageErr) {
        console.error('sessionStorage error', storageErr)
      }
      router.push("/admin-panel")
    } catch (e: any) {
      setError(e.message || "Sign in failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen warm-gradient flex">
      {/* Left side - Brand */}
      <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-center">
        <div className="max-w-md">
          <div className="mb-8">
            <Image src="/rento-logo-gold.png" alt="Rento Logo" width={120} height={120} className="object-contain" />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <Card className="feature-card shadow-sm">
              <CardContent className="p-6">
                <Shield className="w-8 h-8 text-[#333333] mb-3" />
                <h3 className="font-semibold text-[#171717] mb-2">Super Admin</h3>
                <p className="text-sm text-[#333333]">Platform-level access</p>
              </CardContent>
            </Card>
            <Card className="feature-card shadow-sm">
              <CardContent className="p-6">
                <Lock className="w-8 h-8 text-[#333333] mb-3" />
                <h3 className="font-semibold text-[#171717] mb-2">Secure</h3>
                <p className="text-sm text-[#333333]">Public schema auth</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Right side - Sign In Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <Card className="w-full max-w-md form-card shadow-lg">
          <CardHeader className="text-center">
            <div className="lg:hidden mb-4">
              <div className="flex justify-center">
                <Image src="/rento-logo-gold.png" alt="Rento Logo" width={60} height={60} className="object-contain" />
              </div>
            </div>
            <CardTitle className="text-2xl font-semibold text-[#171717]">Super Admin Login</CardTitle>
            <CardDescription className="text-[#333333]">Manage tenants and platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-[#171717]">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="bg-white/80 border-[#d8d8d8] rounded-xl h-12 text-[#171717] placeholder:text-[#666666]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-[#171717]">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                className="bg-white/80 border-[#d8d8d8] rounded-xl h-12 text-[#171717] placeholder:text-[#666666]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button disabled={loading} onClick={onSubmit} className="w-full bg-[#ffc641] hover:bg-[#ffb91a] text-[#171717] font-semibold rounded-xl h-12 shadow-md">
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
            <div className="text-center">
              <p className="text-sm text-[#333333]">
                Need tenant login?{" "}
                <Link href="/" className="text-[#ff7207] hover:underline font-medium">
                  Go to user login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
