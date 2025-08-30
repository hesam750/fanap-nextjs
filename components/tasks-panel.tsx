  "use client"

  import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
  import { Button } from "@/components/ui/button"
  import { Badge } from "@/components/ui/badge"
  import { Checkbox } from "@/components/ui/checkbox"
  import { ClipboardList, Clock, CheckCircle, AlertCircle } from "lucide-react"
  import type { Task } from "@/lib/types"
  import { AuthService } from "@/lib/auth"

  interface TasksPanelProps {
    tasks: Task[]
    onCompleteTask?: (taskId: string) => void
    onUpdateChecklist?: (taskId: string, checklistItemId: string, completed: boolean) => void
  }

  export function TasksPanel({ tasks, onCompleteTask, onUpdateChecklist }: TasksPanelProps) {
    const auth = AuthService.getInstance()
    const currentUser = auth.getCurrentUser()
    const canComplete = auth.hasPermission("complete-task")

    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case "critical":
          return "destructive"
        case "high":
          return "destructive"
        case "medium":
          return "secondary"
        case "low":
          return "outline"
        default:
          return "outline"
      }
    }

    const getPriorityText = (priority: string) => {
      switch (priority) {
        case "critical":
          return "بحرانی"
        case "high":
          return "بالا"
        case "medium":
          return "متوسط"
        case "low":
          return "پایین"
        default:
          return priority
      }
    }

    const getStatusColor = (status: string) => {
      switch (status) {
        case "completed":
          return "default"
        case "in-progress":
          return "secondary"
        case "pending":
          return "outline"
        default:
          return "outline"
      }
    }

    const getStatusText = (status: string) => {
      switch (status) {
        case "completed":
          return "تکمیل شده"
        case "in-progress":
          return "در حال انجام"
        case "pending":
          return "در انتظار"
        default:
          return status
      }
    }

    const getStatusIcon = (status: string) => {
      switch (status) {
        case "completed":
          return <CheckCircle className="h-4 w-4" />
        case "in-progress":
          return <Clock className="h-4 w-4" />
        case "pending":
          return <AlertCircle className="h-4 w-4" />
        default:
          return null
      }
    }

    // Filter tasks for current user if they're an operator
    const userTasks =
      currentUser?.role === "operator" ? tasks.filter((task) => task.assignedTo === currentUser.id) : tasks

    const pendingTasks = userTasks.filter((task) => task.status !== "completed")
    const completedTasks = userTasks.filter((task) => task.status === "completed")

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            وظایف
            {pendingTasks.length > 0 && <Badge variant="secondary">{pendingTasks.length}</Badge>}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {pendingTasks.length === 0 && completedTasks.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <ClipboardList className="h-12 w-12 mx-auto mb-2" />
              <p>هیچ وظیفه‌ای وجود ندارد</p>
            </div>
          ) : (
            <>
              {pendingTasks.map((task) => (
                <div key={task.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium">{task.title}</h4>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    </div>

                    <div className="flex flex-col gap-2 items-end">
                      <Badge variant={getPriorityColor(task.priority)}>{getPriorityText(task.priority)}</Badge>
                      <Badge variant={getStatusColor(task.status)} className="flex items-center gap-1">
                        {getStatusIcon(task.status)}
                        {getStatusText(task.status)}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <div>مهلت: {task.dueDate ? new Date(task.dueDate).toLocaleDateString("fa-IR") : "ندارد"}</div>
                    <div>ایجاد شده: {task.createdAt ? new Date(task.createdAt).toLocaleDateString("fa-IR") : "ندارد"}</div>
                  </div>
                  {task.assignedTo && (
                    <div className="text-xs text-muted-foreground">
                      <span>محول شده به: </span>
                      <span className="font-medium">{task.assignedTo}</span>
                    </div>
                  )}


                  {task.checklist && task.checklist.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">چک‌لیست:</h5>
                      {task.checklist.map((item, index) => (
                        <div key={item.id || `${task.id}-${index}`} className="flex items-center gap-2">
                          <Checkbox
                            id={item.id}
                            checked={item.completed}
                            onCheckedChange={(checked) => onUpdateChecklist?.(task.id, item.id, checked as boolean)}
                            disabled={!canComplete || task.assignedTo !== currentUser?.id}
                          />
                          <label
                            htmlFor={item.id}
                            className={`text-sm ${item.completed ? "line-through text-muted-foreground" : ""}`}
                          >
                            {item.text}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}


                  {canComplete && task.assignedTo === currentUser?.id && task.status !== "completed" && (
                    <Button
                      size="sm"
                      onClick={() => onCompleteTask?.(task.id)}
                      disabled={task.checklist?.some((item) => !item.completed)}
                    >
                      تکمیل وظیفه
                    </Button>
                  )}
                </div>
              ))}

              {completedTasks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">وظایف تکمیل شده</h4>
                  {completedTasks.slice(0, 3).map((task) => (
                    <div key={task.id} className="p-3 border rounded-lg opacity-60">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-sm">{task.title}</h5>
                          <p className="text-xs text-muted-foreground">

                            تکمیل شده: {task.completedAt ? new Date(task.completedAt).toLocaleDateString("fa-IR") : "نامشخص"}
                          </p>
                        </div>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    )
  }
