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
    const tank = await db.getTankById(id)
    if (!tank) {
      return NextResponse.json({ error: "Tank not found" }, { status: 404 })
    }
    
    const history = await db.getTankHistory(id, 168)
    
    if (history.length < 10) {
      return NextResponse.json({
        predictedDays: null,
        recommendation: "داده کافی برای پیش‌بینی وجود ندارد",
        confidence: "low"
      })
    }
    
    // بقیه کد بدون تغییر...
    const latest = history[history.length - 1].level
    const oldest = history[0].level
    const totalConsumption = oldest - latest
    const totalHours = history.length
    const hourlyConsumption = totalConsumption > 0 ? totalConsumption / totalHours : 0
    const dailyConsumption = hourlyConsumption * 24
    
    let predictedDays = null
    let recommendation = "سطح مخزن ثابت است"
    
    if (dailyConsumption > 0) {
      predictedDays = latest / dailyConsumption
      
      if (predictedDays < 1) {
        recommendation = "سطح مخزن بحرانی است. لطفاً فوراً اقدام کنید."
      } else if (predictedDays < 3) {
        recommendation = "سطح مخزن کم است. برنامه‌ریزی برای پرکردن مخزن انجام دهید."
      } else {
        recommendation = "سطح مخزن در وضعیت مطلوبی قرار دارد."
      }
    }
    
    return NextResponse.json({
      predictedDays: predictedDays ? parseFloat(predictedDays.toFixed(1)) : null,
      dailyConsumption: parseFloat(dailyConsumption.toFixed(2)),
      currentLevel: latest,
      recommendation,
      confidence: history.length > 48 ? "high" : "medium"
    })
    
  } catch (error) {
    console.error("Get tank prediction error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}