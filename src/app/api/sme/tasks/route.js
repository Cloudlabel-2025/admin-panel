import { NextResponse } from "next/server";
import connectMongoose from "../../../utilis/connectMongoose";
import SMETask from "../../../../models/SMETask";
import SMESession from "../../../../models/SMESession";
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

// POST - Create new task
export async function POST(request) {
  try {
    await connectMongoose();
    
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, priority, employeeId, date } = await request.json();

    // Use user's employeeId if not provided (for SME users)
    const taskEmployeeId = employeeId || user.employeeId;
    const taskDate = date || new Date().toISOString().split('T')[0];

    if (!title || !taskEmployeeId) {
      return NextResponse.json({ error: "Title and employee ID are required" }, { status: 400 });
    }

    // Find active session for the date
    const session = await SMESession.findOne({ 
      employeeId: taskEmployeeId, 
      date: taskDate,
      status: { $in: ['active', 'break', 'lunch'] }
    });

    const newTask = new SMETask({
      employeeId: taskEmployeeId,
      sessionId: session?._id,
      title,
      description: description || "",
      priority: priority || "medium",
      date: taskDate,
      status: "pending"
    });

    await newTask.save();

    // Add task to session if exists
    if (session) {
      session.tasks.push(newTask._id);
      await session.save();
    }

    return NextResponse.json({ 
      message: "Task created successfully", 
      task: newTask 
    });

  } catch (error) {
    console.error("Task creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET - Get tasks
export async function GET(request) {
  try {
    await connectMongoose();
    
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const date = searchParams.get("date");
    const sessionId = searchParams.get("sessionId");

    let query = {};
    if (employeeId) query.employeeId = employeeId;
    if (date) query.date = date;
    if (sessionId) query.sessionId = sessionId;

    const tasks = await SMETask.find(query)
      .populate('sessionId', 'date loginTime logoutTime status')
      .sort({ createdAt: -1 });

    return NextResponse.json({ tasks });

  } catch (error) {
    console.error("Task fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}