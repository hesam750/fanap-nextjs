import { db } from "@/lib/database";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

// app/api/users/[id]/route.ts
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;  // id از params بگیرید
    const updates = await request.json();  // فقط updates از body

    if (!id || !updates) {
      return NextResponse.json({ error: "ID and updates are required" }, { status: 400 });
    }

    console.log("Received update request:", { id, updates });

    // بقیه کد مانند قبل...
    const allowedUpdates = ['name', 'email', 'role', 'isActive', 'password'] as const;
    type AllowedUpdateKey = typeof allowedUpdates[number]
    const filteredUpdates: Partial<Record<AllowedUpdateKey, string | boolean>> = {};
    
    for (const key in updates) {
      if (allowedUpdates.includes(key as AllowedUpdateKey)) {
        filteredUpdates[key as AllowedUpdateKey] = updates[key as AllowedUpdateKey] as string | boolean;
      }
    }

    if (typeof filteredUpdates.password === 'string' && filteredUpdates.password.trim() !== '') {
      console.log("Hashing new password:", filteredUpdates.password);
      filteredUpdates.password = await bcrypt.hash(filteredUpdates.password, 10);
      console.log("Hashed password:", filteredUpdates.password);
    } else {
      console.log("No password change requested");
      delete filteredUpdates.password;
    }

    console.log('Final updates to send to DB:', filteredUpdates);

    const updatedUser = await db.updateUser(id, filteredUpdates);
    
    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
// app/api/users/[id]/route.ts
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    console.log("Deleting user with ID:", id);

    await db.deleteUser(id);

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}