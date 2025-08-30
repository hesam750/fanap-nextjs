import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { validateAuth } from "@/lib/auth-middleware"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await validateAuth(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const period = parseInt(searchParams.get("period") || "24")
    
    const trends = await db.calculateTankTrends(id, period)
    return NextResponse.json(trends)
    
  } catch (error) {
    console.error("Get tank trends error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}