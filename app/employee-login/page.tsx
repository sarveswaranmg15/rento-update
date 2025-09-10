"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function EmployeeLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/employee-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || "Login failed")
      // Set cookie and redirect
      window.location.href = "/book-ride"
    } catch (e: any) {
      setError(e.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form className="bg-white p-8 rounded-lg shadow w-96" onSubmit={handleLogin}>
        <h2 className="text-2xl font-bold mb-6 text-center">Employee Login</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Username</label>
          <Input value={username} onChange={e => setUsername(e.target.value)} required autoFocus />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Password</label>
          <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        {error && <div className="text-red-600 text-sm mb-4">{error}</div>}
        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Logging in…" : "Login"}</Button>
      </form>
    </div>
  )
}
