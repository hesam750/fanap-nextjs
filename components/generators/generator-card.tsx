"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Zap, AlertTriangle, Play, Square, Wrench } from "lucide-react"
import type { Generator } from "@/lib/types"
import { AuthService } from "@/lib/auth"

interface GeneratorCardProps {
  generator: Generator
  onUpdate?: (generatorId: string, newLevel: number) => void
}

export function GeneratorCard({ generator, onUpdate }: GeneratorCardProps) {
  const auth = AuthService.getInstance()
  const canUpdate = auth.hasPermission("update_levels")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "default"
      case "stopped":
        return "secondary"
      case "maintenance":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "running":
        return "در حال کار"
      case "stopped":
        return "متوقف"
      case "maintenance":
        return "تعمیر"
      default:
        return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <Play className="h-4 w-4" />
      case "stopped":
        return <Square className="h-4 w-4" />
      case "maintenance":
        return <Wrench className="h-4 w-4" />
      default:
        return null
    }
  }

  const liters = Math.round((generator.currentLevel / 100) * generator.capacity)

  const handleQuickUpdate = (increment: number) => {
    if (onUpdate) {
      const newLevel = Math.max(0, Math.min(100, generator.currentLevel + increment))
      onUpdate(generator.id, newLevel)
    }
  }

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            {generator.name}
          </CardTitle>
          <Badge variant={getStatusColor(generator.status)} className="flex items-center gap-1">
            {getStatusIcon(generator.status)}
            {getStatusText(generator.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>سطح سوخت</span>
            <span className="font-medium">{generator.currentLevel}%</span>
          </div>
          <Progress value={generator.currentLevel} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{liters.toLocaleString("fa-IR")} لیتر</span>
            <span>ظرفیت: {generator.capacity.toLocaleString("fa-IR")} لیتر</span>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          <div>آخرین بروزرسانی: {new Date(generator.lastUpdated).toLocaleTimeString("fa-IR")}</div>
        </div>
        {generator.currentLevel < 20 && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>هشدار: سطح سوخت بحرانی!</span>
          </div>
        )}

        {canUpdate && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickUpdate(-10)}
              disabled={generator.currentLevel <= 0}
            >
              -10%
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickUpdate(10)}
              disabled={generator.currentLevel >= 100}
            >
              +10%
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
