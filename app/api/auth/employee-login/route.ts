import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// Example hardcoded credentials (replace with DB lookup in production)
const EMPLOYEE_USERS = [
  { username: "employee1", password: "password123" },
  { username: "employee2", password: "password456" }
]

  const { username, password } = await req.json()
  const user = EMPLOYEE_USERS.find(u => u.username === username && u.password === password)
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }
  // Set cookie for employee session (expires in 1 day)
  const res = NextResponse.json({ success: true })
  res.headers.append('Set-Cookie', `employee=1; Path=/; Max-Age=86400; HttpOnly`)
  return res
}
