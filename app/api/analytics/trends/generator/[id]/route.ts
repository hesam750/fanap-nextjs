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
    
    const history = await db.getGeneratorHistory(id, period)
    
    if (history.length < 2) {
      return NextResponse.json({
        trend: "stable",
        changeRate: 0,
        message: "داده کافی برای تحلیل روند وجود ندارد"
      })
    }
    
    // بقیه کد بدون تغییر...
    const latest = history[history.length - 1].level
    const previous = history[0].level
    const changeRate = previous > 0 ? ((latest - previous) / previous) * 100 : 0
    
    let trend: "up" | "down" | "stable" = "stable"
    if (changeRate > 5) trend = "up"
    else if (changeRate < -5) trend = "down"
    
    return NextResponse.json({
      trend,
      changeRate: parseFloat(changeRate.toFixed(2)),
      currentLevel: latest,
      previousLevel: previous,
      dataPoints: history.length
    })
    
  } catch (error) {
    console.error("Get generator trends error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}