

import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { validateAuth } from "@/lib/auth-middleware"


export async function POST(request: NextRequest) {
  const user = await validateAuth(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const taskData = await request.json()
    console.log("Received task data:", taskData)

  
    if (!taskData.title || !taskData.assignedTo || !taskData.assignedBy) {
      return NextResponse.json({ 
        error: "Title, assignedTo, and assignedBy are required" 
      }, { status: 400 })
    }

    const newTask = await db.createTask({
      ...taskData,
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null, 
      status: taskData.status || "pending",
      priority: taskData.priority || "medium",
    })

    return NextResponse.json({ task: newTask }, { status: 201 })
    
  } catch (error) {
    console.error("Create task error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error 
    }, { status: 500 })
  }
}


export async function GET(request: NextRequest) {
  try {
    const tasks = await db.getTasks()
    return NextResponse.json({ tasks }, { status: 200 })
  } catch (error) {
    console.error("Get tasks error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
