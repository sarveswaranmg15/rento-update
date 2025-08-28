import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"

export default function SignUpPage() {
  return (
    <div className="min-h-screen warm-gradient flex items-center justify-center p-8">
      <Card className="w-full max-w-md form-card shadow-lg">
        <CardHeader className="text-center">
          <div className="mb-4">
            <Image
              src="/rento-logo-gold.png"
              alt="Rento Logo"
              width={80}
              height={80}
              className="object-contain mx-auto"
            />
          </div>
          <CardTitle className="text-xl text-[#171717]">What's Your email?</CardTitle>
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
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium text-[#171717]">
              Username
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="Choose a username"
              className="bg-white/80 border-[#d8d8d8] rounded-xl h-12 text-[#171717] placeholder:text-[#666666]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-[#171717]">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              className="bg-white/80 border-[#d8d8d8] rounded-xl h-12 text-[#171717] placeholder:text-[#666666]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-[#171717]">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              className="bg-white/80 border-[#d8d8d8] rounded-xl h-12 text-[#171717] placeholder:text-[#666666]"
            />
          </div>
          <Button className="w-full bg-[#ffc641] hover:bg-[#ffb91a] text-[#171717] font-semibold rounded-xl h-12 shadow-md">
            Sign Up
          </Button>
          <div className="text-center">
            <p className="text-sm text-[#333333]">
              Already have an account?{" "}
              <Link href="/" className="text-[#ff7207] hover:underline font-medium">
                Sign In
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
