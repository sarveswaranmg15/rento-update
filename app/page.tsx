"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Car, Lock, Users, Play } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function SignInPage() {
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
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, subdomain: process.env.NEXT_PUBLIC_TENANT || undefined })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Sign in failed")
      // Store token and user context in sessionStorage
      try {
        if (data.token) sessionStorage.setItem('token', data.token)
        if (data.user) sessionStorage.setItem('user', JSON.stringify(data.user))
      } catch (storageErr) {
        // ignore storage errors (e.g., private mode) and continue
        console.error('sessionStorage error', storageErr)
      }
      router.push("/dashboard")
    } catch (e: any) {
      setError(e.message || "Sign in failed")
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="min-h-screen warm-gradient flex">
      {/* Left side - Features */}
      <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-center">
        <div className="max-w-md">
          <div className="mb-8">
            <Image src="/rento-logo-gold.png" alt="Rento Logo" width={120} height={120} className="object-contain" />
          </div>

          <p className="text-lg text-[#333333] mb-12 leading-relaxed">
            The future of corporate transportation. Smart, secure, and seamlessly integrated for modern businesses.
          </p>

          <div className="grid grid-cols-2 gap-6">
            <Card className="feature-card shadow-sm">
              <CardContent className="p-6">
                <Car className="w-8 h-8 text-[#333333] mb-3" />
                <h3 className="font-semibold text-[#171717] mb-2">Smart Booking</h3>
                <p className="text-sm text-[#333333]">AI-powered ride matching</p>
              </CardContent>
            </Card>

            <Card className="feature-card shadow-sm">
              <CardContent className="p-6">
                <Lock className="w-8 h-8 text-[#333333] mb-3" />
                <h3 className="font-semibold text-[#171717] mb-2">Secure & Safe</h3>
                <p className="text-sm text-[#333333]">End-to-end Encryption</p>
              </CardContent>
            </Card>

            <Card className="feature-card shadow-sm">
              <CardContent className="p-6">
                <Users className="w-8 h-8 text-[#333333] mb-3" />
                <h3 className="font-semibold text-[#171717] mb-2">Multi Tenant</h3>
                <p className="text-sm text-[#333333]">Enterprise Ready Platform</p>
              </CardContent>
            </Card>

            <Card className="feature-card shadow-sm">
              <CardContent className="p-6">
                <Play className="w-8 h-8 text-[#333333] mb-3" />
                <h3 className="font-semibold text-[#171717] mb-2">Real Time</h3>
                <p className="text-sm text-[#333333]">Live Tracking & Updates</p>
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
            <CardTitle className="text-2xl font-semibold text-[#171717]">Welcome Back</CardTitle>
            <CardDescription className="text-[#333333]">Sign in to access your dashboard</CardDescription>
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
                Don't have an account?{" "}
                <Link href="/signup" className="text-[#ff7207] hover:underline font-medium">
                  Create Account
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
