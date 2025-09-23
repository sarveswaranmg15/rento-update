import { NextResponse } from "next/server"

// Example hardcoded credentials (replace with DB lookup in production)
const EMPLOYEE_USERS = [
  { username: "employee1", password: "password123" },
  { username: "employee2", password: "password456" },
]

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json()

    const user = EMPLOYEE_USERS.find(
      (u) => u.username === username && u.password === password
    )

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Create the response
    const res = NextResponse.json({ success: true })

    // Attach cookie to response
    res.cookies.set("employee", "1", {
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
      httpOnly: true,
    })

    return res
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
