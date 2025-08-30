// app/api/weekly-tasks/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params
    const updates = await request.json()

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }
    
    // اعتبارسنجی dayOfWeek اگر وجود دارد
    if (updates.dayOfWeek !== undefined && (updates.dayOfWeek < 0 || updates.dayOfWeek > 6)) {
      return NextResponse.json(
        { error: 'dayOfWeek must be between 0 and 6' },
        { status: 400 }
      )
    }
    
    const task = await db.updateWeeklyTask(taskId, updates)
    
    return NextResponse.json({ task })
  } catch (error) {
    console.error('Failed to update weekly task:', error)
    return NextResponse.json(
      { error: 'Failed to update weekly task' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params
    
    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }
    
    await db.deleteWeeklyTask(taskId)
    
    return NextResponse.json({ 
      message: 'Weekly task deleted successfully'
    })
  } catch (error) {
    console.error('Failed to delete weekly task:', error)
    return NextResponse.json(
      { error: 'Failed to delete weekly task' },
      { status: 500 }
    )
  }
}