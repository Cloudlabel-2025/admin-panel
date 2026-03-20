import { NextResponse } from "next/server";
import connectMongoose from "../../../../utilis/connectMongoose";
import SMETask from "../../../../../models/SMETask";
import SMESession from "../../../../../models/SMESession";
import jwt from "jsonwebtoken";

function verifyToken(request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "") || 
                request.cookies.get("token")?.value;
  
  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// PUT - Update task
export async function PUT(request, { params }) {
  try {
    await connectMongoose();
    
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params; // Await params for Next.js 15
    const updates = await request.json();

    const task = await SMETask.findById(id);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Security: SME users can only update their own tasks
    const adminRoles = ["super-admin", "Super-admin", "admin", "developer", "Team-Lead", "Team-admin"];
    const isAdmin = adminRoles.includes(user.role);
    
    if (user.role === "SME" && task.employeeId !== user.employeeId) {
      return NextResponse.json({ error: "Unauthorized - Cannot modify other users' tasks" }, { status: 403 });
    }

    // Apply updates
    Object.assign(task, updates);
    
    if (updates.status === 'in-progress' && !task.startTime) {
      task.startTime = new Date();
    }
    if (updates.status === 'completed' && !task.endTime) {
      task.endTime = new Date();
    }

    await task.save();

    // Calculate time spent if task is completed
    if (updates.status === 'completed' && task.startTime && task.endTime) {
      const timeSpent = Math.round((task.endTime - task.startTime) / (1000 * 60)); // in minutes
      task.timeSpent = timeSpent;
      await task.save();
    }

    return NextResponse.json({ 
      message: "Task updated successfully", 
      task 
    });

  } catch (error) {
    console.error("Task update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete task
export async function DELETE(request, { params }) {
  try {
    await connectMongoose();
    
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params; // Await params for Next.js 15

    const task = await SMETask.findById(id);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Security: SME users can only delete their own tasks
    const adminRoles = ["super-admin", "Super-admin", "admin", "developer", "Team-Lead", "Team-admin"];
    const isAdmin = adminRoles.includes(user.role);
    
    if (user.role === "SME" && task.employeeId !== user.employeeId) {
      return NextResponse.json({ error: "Unauthorized - Cannot delete other users' tasks" }, { status: 403 });
    }

    // Remove task from session
    if (task.sessionId) {
      await SMESession.findByIdAndUpdate(
        task.sessionId,
        { $pull: { tasks: task._id } }
      );
    }

    await SMETask.findByIdAndDelete(id);

    return NextResponse.json({ 
      message: "Task deleted successfully" 
    });

  } catch (error) {
    console.error("Task deletion error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}