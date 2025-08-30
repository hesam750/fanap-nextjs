import { type NextRequest, NextResponse } from "next/server"
import { validateAuth } from "@/lib/auth-middleware"
import { getReport, deleteReport } from "@/lib/report-store"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await validateAuth(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = params

    const report = getReport(id)
    if (!report) {
      return NextResponse.json({ error: "Report not found or expired" }, { status: 404 })
    }

    // Optional: حذف پس از دانلود یک‌باره
    // deleteReport(id)

    return new NextResponse(report.content, {
      status: 200,
      headers: {
        "Content-Type": report.contentType,
        "Content-Disposition": `attachment; filename="${report.filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Error downloading report:", error)
    return NextResponse.json(
      { error: "خطا در دانلود گزارش" },
      { status: 500 }
    )
  }
}