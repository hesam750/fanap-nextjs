// app/reports/components/ReportsPanel.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Download, Calendar, TrendingUp, TrendingDown, RefreshCw, AlertTriangle, BarChart3 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import type { Tank, Generator, Alert, HistoryRecord } from "@/lib/types"

interface ReportsPanelProps {
  tanks: Tank[]
  generators: Generator[]
  alerts: Alert[]
}

interface TrendData {
  trend: "up" | "down" | "stable"
  changeRate: number
  currentLevel: number
  previousLevel: number
  dataPoints: number
  error?: string
}

interface PredictionData {
  predictedDays?: number
  predictedHours?: number
  recommendation: string
  confidence: "low" | "medium" | "high"
  error?: string
}

interface BulkAnalyticsResponse {
  trends: Record<string, any>
  predictions: Record<string, any>
  timestamp: string
}

// کامپوننت اسکلت برای loading state
export function ReportSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// تابع getTrendIcon برای نمایش آیکون ترند
const getTrendIcon = (trend?: TrendData) => {
  if (!trend) return <RefreshCw className="h-4 w-4 text-gray-400" />

  switch (trend.trend) {
    case "up":
      return <TrendingUp className="h-4 w-4 text-green-500" />
    case "down":
      return <TrendingDown className="h-4 w-4 text-red-500" />
    default:
      return <div className="h-4 w-4 bg-gray-400 rounded-full" />
  }
}

export function ReportsPanel({ tanks, generators, alerts }: ReportsPanelProps) {
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([])
  const [trends, setTrends] = useState<Map<string, TrendData>>(new Map())
  const [predictions, setPredictions] = useState<Map<string, PredictionData>>(new Map())
  const [loading, setLoading] = useState(true)
  const [reportPeriod, setReportPeriod] = useState("24")
  const [lastUpdated, setLastUpdated] = useState<Date>()
  const [currentPage, setCurrentPage] = useState(1)
  const recordsPerPage = 15

  const { toast } = useToast()

  const paginatedRecords = historyRecords.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  )

  // بهینه‌سازی دریافت تاریخچه
  const getHistoricalRecords = async (hours: number): Promise<HistoryRecord[]> => {
    try {
      // دریافت خلاصه تاریخچه به جای تمام رکوردها
      const summary = await apiClient.post<{ records: HistoryRecord[] }>("/api/historical-data/summary", {
        tankIds: tanks.map(t => t.id),
        generatorIds: generators.map(g => g.id),
        hours,
        limit: 100
      })

      return summary.records || []
    } catch (error) {
      console.error("Error fetching historical records:", error)
      toast({
        title: "خطا",
        description: "خطا در دریافت تاریخچه داده‌ها",
        variant: "destructive",
      })
      return []
    }
  }

  // نگاشت داده‌های API به ساختار UI
  const mapTrendResult = (raw: any): TrendData => {
    const mappedTrend = raw?.trend === 'increasing' ? 'up' : raw?.trend === 'decreasing' ? 'down' : 'stable'
    return {
      trend: mappedTrend,
      changeRate: Number(raw?.changeRate ?? 0),
      currentLevel: Number(raw?.currentValue ?? 0),
      previousLevel: 0,
      dataPoints: Number(raw?.dataPoints ?? 0),
      error: raw?.error,
    }
  }

  const mapPredictionResult = (raw: any): PredictionData => {
    const confNum = Number(raw?.confidence ?? 0)
    const confidence: PredictionData["confidence"] = confNum >= 0.75 ? 'high' : confNum >= 0.5 ? 'medium' : 'low'
    const predictedHours = Math.round(Number(raw?.predictedValue ?? 0))
    const recommendation = predictedHours <= 12
      ? 'مصرف بالا، بررسی و تامین به‌موقع توصیه می‌شود'
      : predictedHours <= 24
        ? 'مصرف متوسط، برنامه‌ریزی برای تامین انجام شود'
        : 'مصرف پایدار'
    return {
      predictedHours,
      predictedDays: Math.round(predictedHours / 24),
      recommendation,
      confidence,
      error: raw?.error,
    }
  }

  // تابع بهینه‌شده برای دریافت داده‌ها
  const loadReportData = useCallback(async () => {
    setLoading(true)
    try {
      // دریافت موازی همه داده‌ها
      const [records, bulkData] = await Promise.all([
        getHistoricalRecords(Number.parseInt(reportPeriod)),
        apiClient.post<BulkAnalyticsResponse>("/api/analytics/bulk", {
          tankIds: tanks.map(t => t.id),
          generatorIds: generators.map(g => g.id),
          period: reportPeriod
        })
      ])

      setHistoryRecords(records)

      // تبدیل داده‌های bulk به Map با نگاشت سازگار با UI
      const trendsMap = new Map<string, TrendData>()
      Object.entries(bulkData.trends || {}).forEach(([id, raw]) => {
        trendsMap.set(id, mapTrendResult(raw))
      })

      const predictionsMap = new Map<string, PredictionData>()
      Object.entries(bulkData.predictions || {}).forEach(([id, raw]) => {
        predictionsMap.set(id, mapPredictionResult(raw))
      })

      setTrends(trendsMap)
      setPredictions(predictionsMap)
      setLastUpdated(new Date())

      toast({
        title: "موفقیت",
        description: "داده‌های گزارش با موفقیت بارگذاری شد",
        variant:"success"
      })

    } catch (error) {
      console.error("[ReportsPanel] Error loading report data:", error)
      toast({
        title: "خطا",
        description: "خطا در بارگذاری داده‌های گزارش",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [reportPeriod, tanks, generators, toast])

  useEffect(() => {
    loadReportData()
  }, [loadReportData])

  const handleExportReport = async (type: string) => {
    try {
      const reportData = {
        period: reportPeriod,
        tanks: tanks.map((tank) => ({
          ...tank,
          trend: trends.get(tank.id),
          prediction: predictions.get(tank.id),
        })),
        generators: generators.map((gen) => ({
          ...gen,
          trend: trends.get(gen.id),
          prediction: predictions.get(gen.id),
        })),
        alerts: alerts,
        records: historyRecords.slice(0, 50),
        generatedAt: new Date().toISOString(),
      }

      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: "application/json"
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `report-${type}-${new Date().toLocaleDateString("fa-IR")}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "موفقیت",
        description: `گزارش ${type} با موفقیت صادر شد`,
        variant:"success"
      })

    } catch (error) {
      console.error("[ReportsPanel] Error exporting report:", error)
      toast({
        title: "خطا",
        description: "خطا در صدور گزارش",
        variant: "destructive",
      })
    }
  }

  // تولید گزارش سمت سرور و دانلود
  const handleGenerateServerReport = async () => {
    try {
      const hours = Number.parseInt(reportPeriod)
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - hours * 60 * 60 * 1000)

      const res = await apiClient.post<{ id: string; downloadUrl: string; message: string }>(
        "/api/reports/generate",
        {
          type: "summary",
          entityType: "all",
          timeframe: "custom",
          startDate,
          endDate,
          format: "json",
        }
      )

      // شروع دانلود فایل تولیدشده توسط سرور
      const link = document.createElement('a')
      link.href = res.downloadUrl
      link.download = ''
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({ title: "موفقیت", description: "گزارش سمت سرور تولید و دانلود شد", variant:"success" })
    } catch (error) {
      console.error("[ReportsPanel] Error generating server report:", error)
      toast({ title: "خطا", description: "تولید گزارش سمت سرور ناکام ماند", variant: "destructive" })
    }
  }

  if (loading) {
    return <ReportSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* کنترل‌های گزارش */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              گزارش‌گیری و تحلیل
              {lastUpdated && (
                <span className="text-sm text-muted-foreground">
                  (آخرین بروزرسانی: {lastUpdated.toLocaleTimeString('fa-IR')})
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={reportPeriod} onValueChange={setReportPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">۶ ساعت گذشته</SelectItem>
                  <SelectItem value="12">۱۲ ساعت گذشته</SelectItem>
                  <SelectItem value="24">۲۴ ساعت گذشته</SelectItem>
                  <SelectItem value="168">هفته گذشته</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => loadReportData()}>
                <RefreshCw className="h-4 w-4 mr-2" /> بروزرسانی
              </Button>
              <Button onClick={() => handleExportReport("json")}>
                <Download className="h-4 w-4 mr-2" /> خروجی JSON
              </Button>
              <Button onClick={handleGenerateServerReport} variant="secondary">
                <FileText className="h-4 w-4 mr-2" /> تولید گزارش سمت سرور
              </Button>
            </div>
          </div>
          <CardDescription>
            تحلیل روندها و پیش‌بینی مصرف برای مدیریت بهتر منابع
          </CardDescription>
        </CardHeader>
      </Card>

      {/* آمار کلی */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>مخازن</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{tanks.length}</div>
              <Badge variant="secondary">فعال</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ژنراتورها</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{generators.length}</div>
              <Badge variant="secondary">فعال</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>هشدارها</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{alerts.length}</div>
              <Badge variant="destructive">کل</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* جدول تاریخچه */}
      <Card>
        <CardHeader>
          <CardTitle>تاریخچه داده‌ها</CardTitle>
          <CardDescription>
            جدیدترین ۱۵ رکورد از تاریخچه داده‌ها
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>نوع</TableHead>
                  <TableHead>نام</TableHead>
                  <TableHead>سطح</TableHead>
                  <TableHead>زمان</TableHead>
                  <TableHead>ثبت‌کننده</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRecords.map((record, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {record.tankId ? (
                        <Badge variant="secondary">مخزن</Badge>
                      ) : (
                        <Badge variant="outline">ژنراتور</Badge>
                      )}
                    </TableCell>
                    <TableCell>{record.recordedBy || record.tankId || record.generatorId}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full ${record.level < 20 ? 'bg-red-500' : record.level < 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${record.level}%` }}
                          ></div>
                        </div>
                        <span>{record.level}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(record.timestamp || record.recordedBy || '').toLocaleString('fa-IR')}
                    </TableCell>
                    <TableCell>{record.recordedBy || 'سیستم'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex justify-end items-center gap-2 mt-4">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                قبلی
              </Button>
              <span className="text-sm text-muted-foreground">
                صفحه {currentPage} از {Math.ceil(historyRecords.length / recordsPerPage) || 1}
              </span>
              <Button
                variant="outline"
                disabled={currentPage * recordsPerPage >= historyRecords.length}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                بعدی
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* تحلیل روندها */}
      <Card>
        <CardHeader>
          <CardTitle>تحلیل روندها</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tanks.map((tank) => (
              <div key={tank.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{tank.name}</div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(trends.get(tank.id))}
                    <span className="text-sm text-muted-foreground">
                      {trends.get(tank.id)?.trend || 'نامشخص'}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  تغییرات: {trends.get(tank.id)?.changeRate?.toFixed(2) || 0}%
                </div>
              </div>
            ))}

            {generators.map((gen) => (
              <div key={gen.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{gen.name}</div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(trends.get(gen.id))}
                    <span className="text-sm text-muted-foreground">
                      {trends.get(gen.id)?.trend || 'نامشخص'}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  تغییرات: {trends.get(gen.id)?.changeRate?.toFixed(2) || 0}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* لیست هشدارها */}
      <Card>
        <CardHeader>
          <CardTitle>هشدارهای اخیر</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {alerts.slice(0, 10).map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <div>
                    <div className="font-medium">{alert.type}</div>
                    <div className="text-sm text-muted-foreground">{alert.message}</div>
                  </div>
                </div>
                <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                  {alert.severity}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}