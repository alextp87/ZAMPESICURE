import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Get IP from headers (works with Vercel and most proxies)
  const forwardedFor = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  
  let ip = forwardedFor?.split(",")[0].trim() || realIp || "Unknown"
  
  // Handle localhost/development
  if (ip === "::1" || ip === "127.0.0.1") {
    ip = "127.0.0.1 (localhost)"
  }
  
  return NextResponse.json({ ip })
}
