"use client"

import { useState, useEffect } from "react"
import { EnhancedLoginForm } from "@/components/enhanced-login-form"
import { OverviewStats } from "@/components/overview-stats"
import { TankCard } from "@/components/tank-card"
import { TasksPanel } from "@/components/tasks-panel"
import { AnalyticsCharts } from "@/components/analytics-charts"
import { ReportsPanel } from "@/components/report/reports-panel"
import { SuperAdminPanel } from "@/components/super-admin-panel"
import { NotificationCenter } from "@/components/notification-center"
import { AuthService } from "@/lib/auth"
import { apiClient } from "@/lib/api-client"
import type { User, Tank, Generator, Task, Alert, Notification } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { DashboardHeader } from "@/components/ui/dashboard-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GeneratorCard } from "@/components/generators/generator-card"
import { AlertsPanel } from "@/components/alerts-panel"

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [tanks, setTanks] = useState<Tank[]>([])
  const [generators, setGenerators] = useState<Generator[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("dashboard")

  useEffect(() => {
    const auth = AuthService.getInstance()
    const currentUser = auth.getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
      loadData()
    } else {
      setLoading(false)
    }
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      const [tanksResponse, generatorsResponse, tasksResponse, alertsResponse, notificationsResponse] =
        await Promise.all([
          apiClient.getTanks(),
          apiClient.getGenerators(),
          apiClient.getTasks(),
          apiClient.getAlerts(),
          apiClient.getNotifications(),
        ])

      setTanks(tanksResponse.tanks)
      setGenerators(generatorsResponse.generators)
      setTasks(tasksResponse.tasks)
      setAlerts(alertsResponse.alerts)
      setNotifications(notificationsResponse.notifications)
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (loggedInUser: User) => {
    setUser(loggedInUser)
    await loadData()
  }

  const handleLogout = () => {
    setUser(null)
    setActiveTab("dashboard")
    setTanks([])
    setGenerators([])
    setTasks([])
    setAlerts([])
    setNotifications([])
  }

  const handleTankUpdate = async (tankId: string, newLevel: number) => {
    const auth = AuthService.getInstance()
    if (!auth.canUpdateLevels()) {
      return
    }

    try {
      await apiClient.updateTank(tankId, {
        currentLevel: newLevel,
        updatedBy: user?.id || "system",
        recordedBy: user?.id || "system",
      })

      // Reload data to get updated information and any new alerts
      await loadData()
    } catch (error) {
      console.error("Failed to update tank:", error)
    }
  }

  const handleGeneratorUpdate = async (generatorId: string, newLevel: number) => {
    const auth = AuthService.getInstance()
    if (!auth.canUpdateLevels()) {
      return
    }

    try {
      await apiClient.updateGenerator(generatorId, {
        currentLevel: newLevel,
        updatedBy: user?.id || "system",
        recordedBy: user?.id || "system",
      })

      // Reload data to get updated information and any new alerts
      await loadData()
    } catch (error) {
      console.error("Failed to update generator:", error)
    }
  }

  const handleAcknowledgeAlert = async (alertId: string) => {
    const auth = AuthService.getInstance()
    if (!auth.canAcknowledgeAlerts()) {
      return
    }

    try {
      await apiClient.updateAlert(alertId, { acknowledged: true })
      await loadData()
    } catch (error) {
      console.error("Failed to acknowledge alert:", error)
    }
  }

  const handleDismissAlert = async (alertId: string) => {
    const auth = AuthService.getInstance()
    if (!auth.canAcknowledgeAlerts()) {
      return
    }

    try {
      await apiClient.deleteAlert(alertId)
      await loadData()
    } catch (error) {
      console.error("Failed to dismiss alert:", error)
    }
  }

  const handleCompleteTask = async (taskId: string) => {
    try {
      await apiClient.updateTask(taskId, {
        status: "completed" as const,
        completedAt: new Date(),
      })
      await loadData()
    } catch (error) {
      console.error("Failed to complete task:", error)
    }
  }

  const handleUpdateChecklist = async (taskId: string, checklistItemId: string, completed: boolean) => {
    try {
      const task = tasks.find((t) => t.id === taskId)
      if (!task?.checklist) return

      const updatedChecklist = task.checklist.map((item) =>
        item.id === checklistItemId ? { ...item, completed } : item,
      )

      await apiClient.updateTask(taskId, { checklist: updatedChecklist })
      await loadData()
    } catch (error) {
      console.error("Failed to update checklist:", error)
    }
  }

  const handleRefreshData = async () => {
    await loadData()
  }

  if (!user) {
    return <EnhancedLoginForm onLogin={handleLogin} />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg">در حال بارگذاری...</p>
        </div>
      </div>
    )
  }

  const auth = AuthService.getInstance()
  const unacknowledgedAlerts = alerts.filter((alert) => !alert.acknowledged)
  const unreadNotifications = notifications.filter((n) => !n.read)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-900">
      <DashboardHeader
        user={user}
        alertCount={unacknowledgedAlerts.length}
        notificationCount={unreadNotifications.length}
        onLogout={handleLogout}
        onRefresh={handleRefreshData}
      />

      <main className="container mx-auto px-6 py-6 space-y-6">
        {auth.canViewDashboard() && (
          <AnimatePresence mode="wait">
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <OverviewStats tanks={tanks} generators={generators} alerts={alerts} />
            </motion.div>
          </AnimatePresence>
        )}

        <Card className="shadow-sm border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="border-b bg-muted/30 rounded-t-lg">
              <TabsList
                className="grid w-full h-auto p-1 bg-transparent"
                style={{
                  gridTemplateColumns: auth.isSuperAdmin() ? "repeat(6, 1fr)" : "repeat(5, 1fr)",
                }}
              >
                {auth.canViewDashboard() && (
                  <TabsTrigger
                    value="dashboard"
                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
                  >
                    داشبورد
                    <Badge variant="outline" className="mr-2 text-xs">
                      {tanks.length + generators.length}
                    </Badge>
                  </TabsTrigger>
                )}
                {auth.canViewAnalytics() && (
                  <TabsTrigger
                    value="analytics"
                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
                  >
                    تحلیل‌ها
                  </TabsTrigger>
                )}
                {auth.canViewReports() && (
                  <TabsTrigger
                    value="reports"
                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
                  >
                    گزارش‌ها
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="alerts"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
                >
                  هشدارها
                  {unacknowledgedAlerts.length > 0 && (
                    <Badge variant="destructive" className="mr-2 text-xs">
                      {unacknowledgedAlerts.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
                >
                  اطلاع‌رسانی
                  {unreadNotifications.length > 0 && (
                    <Badge variant="secondary" className="mr-2 text-xs">
                      {unreadNotifications.length}
                    </Badge>
                  )}
                </TabsTrigger>
                {auth.isSuperAdmin() && (
                  <TabsTrigger
                    value="admin"
                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
                  >
                    مدیریت
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">
                {auth.canViewDashboard() && (
                  <TabsContent key="tab-dashboard" value="dashboard" className="space-y-6 mt-0">
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                    >
                      <div className="lg:col-span-2 space-y-6">
                        {/* مخزن سوخت */}
                        <section>
                          <div className="flex items-center gap-2 mb-4">
                            <h2 className="text-xl font-semibold">مخازن سوخت</h2>
                            <Badge variant="outline">{tanks.filter((t) => t.type === "fuel").length} مخزن</Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {tanks
                              .filter((tank) => tank.type === "fuel")
                              .map((tank) => (
                                <motion.div
                                  key={`fuel-tank-${tank.id}`}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <TankCard tank={tank} onUpdate={handleTankUpdate} />
                                </motion.div>
                              ))}
                          </div>
                        </section>

                        <Separator />
                        {/* مخزن آب */}
                        <section>
                          <div className="flex items-center gap-2 mb-4">
                            <h2 className="text-xl font-semibold">مخازن آب</h2>
                            <Badge variant="outline">{tanks.filter((t) => t.type === "water").length} مخزن</Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {tanks
                              .filter((tank) => tank.type === "water")
                              .map((tank) => (
                                <motion.div
                                  key={`water-tank-${tank.id}`}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <TankCard tank={tank} onUpdate={handleTankUpdate} />
                                </motion.div>
                              ))}
                          </div>
                        </section>

                        <Separator />
                        {/* ژنراتورها */}
                        <section>
                          <div className="flex items-center gap-2 mb-4">
                            <h2 className="text-xl font-semibold">ژنراتورها</h2>
                            <Badge variant="outline">{generators.length} دستگاه</Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {generators.map((generator) => (
                              <motion.div
                                key={`generator-${generator.id}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <GeneratorCard generator={generator} onUpdate={handleGeneratorUpdate} />
                              </motion.div>
                            ))}
                          </div>
                        </section>
                      </div>

                      <div className="space-y-6">
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.2 }}
                        >
                          <TasksPanel
                            tasks={tasks}
                            onCompleteTask={handleCompleteTask}
                            onUpdateChecklist={handleUpdateChecklist}
                          />
                        </motion.div>
                      </div>
                    </motion.div>
                  </TabsContent>
                )}

                {auth.canViewAnalytics() && (
                  <TabsContent key="tab-analytics" value="analytics" className="space-y-6 mt-0">
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <AnalyticsCharts tanks={tanks} generators={generators} alerts={alerts} />
                    </motion.div>
                  </TabsContent>
                )}

                {auth.canViewReports() && (
                  <TabsContent key="tab-reports" value="reports" className="space-y-6 mt-0">
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ReportsPanel tanks={tanks} generators={generators} alerts={alerts} />
                    </motion.div>
                  </TabsContent>
                )}

                <TabsContent key="tab-alerts" value="alerts" className="space-y-6 mt-0">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                  >
                    <AlertsPanel
                      alerts={alerts}
                      onAcknowledge={handleAcknowledgeAlert}
                      onDismiss={handleDismissAlert}
                    />

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">آمار هشدارها</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className="p-4 border rounded-lg text-center bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20"
                        >
                          <div className="text-2xl font-bold text-destructive">
                            {alerts.filter((a) => a.severity === "critical" && !a.acknowledged).length}
                          </div>
                          <div className="text-sm text-muted-foreground">بحرانی</div>
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className="p-4 border rounded-lg text-center bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20"
                        >
                          <div className="text-2xl font-bold text-yellow-600">
                            {alerts.filter((a) => a.severity === "high" && !a.acknowledged).length}
                          </div>
                          <div className="text-sm text-muted-foreground">بالا</div>
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className="p-4 border rounded-lg text-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
                        >
                          <div className="text-2xl font-bold text-blue-600">
                            {alerts.filter((a) => a.severity === "medium" && !a.acknowledged).length}
                          </div>
                          <div className="text-sm text-muted-foreground">متوسط</div>
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className="p-4 border rounded-lg text-center bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20"
                        >
                          <div className="text-2xl font-bold text-green-600">
                            {alerts.filter((a) => a.acknowledged).length}
                          </div>
                          <div className="text-sm text-muted-foreground">تأیید شده</div>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                </TabsContent>

                {auth.isSuperAdmin() && (
                  <TabsContent key="tab-admin" value="admin" className="space-y-6 mt-0">
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <SuperAdminPanel
                        currentUser={user}
                        tanks={tanks}
                        generators={generators}
                        onRefresh={handleRefreshData}
                      />
                    </motion.div>
                  </TabsContent>
                )}
              </AnimatePresence>
            </div>
          </Tabs>
        </Card>
      </main>
    </div>
  )
}
