import { NextResponse } from "next/server";
import connectMongoose from "../../../utilis/connectMongoose";
import SMESession from "../../../../models/SMESession";
import SMETask from "../../../../models/SMETask";
import jwt from "jsonwebtoken";

// Verify JWT token and extract user info
function verifyToken(request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "") || 
                request.cookies.get("token")?.value ||
                request.headers.get("cookie")?.split("token=")[1]?.split(";")[0];
  
  if (!token) {
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const extractedToken = authHeader.substring(7);
      if (extractedToken) {
        try {
          return jwt.verify(extractedToken, process.env.JWT_SECRET);
        } catch (error) {
          return null;
        }
      }
    }
    return null;
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// GET - Get active session or session history
export async function GET(request) {
  try {
    await connectMongoose();
    
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const date = searchParams.get("date");
    const employeeId = searchParams.get("employeeId") || user.employeeId;

    // Allow admin roles to query other employees
    const adminRoles = ["super-admin", "Super-admin", "admin", "developer", "Team-Lead", "Team-admin"];
    const isAdmin = adminRoles.includes(user.role);
    
    if (!isAdmin && user.role !== "SME" && employeeId !== user.employeeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (type === "active") {
      const activeSession = await SMESession.findOne({
        employeeId,
        status: { $in: ['active', 'break', 'lunch'] }
      }).populate('tasks');
      if (!activeSession) return NextResponse.json({ message: "No active session found", session: null });
      return NextResponse.json({ message: "Active session found", session: activeSession });

    } else if (type === "history") {
      const query = { employeeId };
      if (date) query.date = date;
      const sessions = await SMESession.find(query).populate('tasks').sort({ createdAt: -1 }).limit(50);
      return NextResponse.json({ sessions });

    } else if (type === "report") {
      const startDate = searchParams.get("startDate");
      const endDate   = searchParams.get("endDate");
      if (!startDate || !endDate)
        return NextResponse.json({ error: "startDate and endDate are required" }, { status: 400 });

      const [reportSessions, reportTasks] = await Promise.all([
        SMESession.find({ employeeId, date: { $gte: startDate, $lte: endDate } }).sort({ date: 1, loginTime: 1 }),
        SMETask.find({   employeeId, date: { $gte: startDate, $lte: endDate } }).sort({ date: 1, createdAt: 1 }),
      ]);

      const grandTotalNet   = reportSessions.reduce((s, x) => s + (x.netWorkingTime || 0), 0);
      const grandTotalDur   = reportSessions.reduce((s, x) => s + (x.totalDuration  || 0), 0);
      const grandTotalBreak = reportSessions.reduce((s, x) => s + (x.totalBreakTime || 0) + (x.totalLunchTime || 0), 0);

      return NextResponse.json({
        startDate, endDate, employeeId,
        sessions: reportSessions.map(s => s.toObject()),
        tasks:    reportTasks.map(t => t.toObject()),
        summary: {
          totalSessions: reportSessions.length,
          totalTasks: reportTasks.length,
          completedTasks: reportTasks.filter(t => t.status === "completed").length,
          grandTotalNet, grandTotalDur, grandTotalBreak,
          grandTotalNetHours: +(grandTotalNet / 60).toFixed(2),
        },
      });
    }

    return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
  } catch (error) {
    console.error("Session GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Start new session or manage session state
export async function POST(request) {
  try {
    await connectMongoose();
    
    const user = verifyToken(request);
    if (!user || user.role !== "SME") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action } = await request.json();
    const today = new Date().toISOString().split('T')[0];

    if (action === "start") {
      // Check if there's already an active session
      const existingSession = await SMESession.findOne({
        employeeId: user.employeeId,
        status: { $in: ['active', 'break', 'lunch'] }
      });

      if (existingSession) {
        return NextResponse.json({ session: existingSession });
      }

      // Create new session
      const newSession = new SMESession({
        employeeId: user.employeeId,
        loginTime: new Date(),
        date: today,
        status: 'active'
      });

      await newSession.save();
      return NextResponse.json({ session: newSession });

    } else if (action === "break") {
      // Start break
      const session = await SMESession.findOne({
        employeeId: user.employeeId,
        status: 'active'
      });

      if (!session) {
        return NextResponse.json({ error: "No active session found" }, { status: 400 });
      }

      session.status = 'break';
      session.breaks.push({
        startTime: new Date(),
        type: 'break'
      });

      await session.save();
      return NextResponse.json({ session });

    } else if (action === "lunch") {
      // Start lunch
      const session = await SMESession.findOne({
        employeeId: user.employeeId,
        status: 'active'
      });

      if (!session) {
        return NextResponse.json({ error: "No active session found" }, { status: 400 });
      }

      session.status = 'lunch';
      session.breaks.push({
        startTime: new Date(),
        type: 'lunch'
      });

      await session.save();
      return NextResponse.json({ session });

    } else if (action === "resume") {
      // Resume from break/lunch
      const session = await SMESession.findOne({
        employeeId: user.employeeId,
        status: { $in: ['break', 'lunch'] }
      });

      if (!session) {
        return NextResponse.json({ error: "No break/lunch session found" }, { status: 400 });
      }

      // End the current break/lunch
      const currentBreak = session.breaks[session.breaks.length - 1];
      if (currentBreak && !currentBreak.endTime) {
        currentBreak.endTime = new Date();
        currentBreak.duration = Math.round((currentBreak.endTime - currentBreak.startTime) / (1000 * 60));
        
        if (currentBreak.type === 'break') {
          session.totalBreakTime += currentBreak.duration;
        } else {
          session.totalLunchTime += currentBreak.duration;
        }
      }

      session.status = 'active';
      await session.save();
      return NextResponse.json({ session });

    } else if (action === "end") {
      // End session
      const session = await SMESession.findOne({
        employeeId: user.employeeId,
        status: { $in: ['active', 'break', 'lunch'] }
      });

      if (!session) {
        return NextResponse.json({ error: "No active session found" }, { status: 400 });
      }

      // Check if user has added at least one task (use tasksAdded so deletes don't block logout)
      // Fallback to tasks array length for sessions created before tasksAdded field existed
      // Also allow ending if session is from a previous day (stuck session escape hatch)
      const isStuckFromPreviousDay = session.date < today;
      const addedCount = session.tasksAdded > 0 ? session.tasksAdded : session.tasks?.length || 0;
      if (addedCount === 0 && !isStuckFromPreviousDay) {
        return NextResponse.json({ error: "Cannot logout without adding at least one task" }, { status: 400 });
      }

      // If currently on break/lunch, end it first
      if (session.status === 'break' || session.status === 'lunch') {
        const currentBreak = session.breaks[session.breaks.length - 1];
        if (currentBreak && !currentBreak.endTime) {
          currentBreak.endTime = new Date();
          currentBreak.duration = Math.round((currentBreak.endTime - currentBreak.startTime) / (1000 * 60));
          
          if (currentBreak.type === 'break') {
            session.totalBreakTime += currentBreak.duration;
          } else {
            session.totalLunchTime += currentBreak.duration;
          }
        }
      }

      // Calculate final times
      session.logoutTime = new Date();
      session.totalDuration = Math.round((session.logoutTime - session.loginTime) / (1000 * 60));
      session.netWorkingTime = session.totalDuration - session.totalBreakTime - session.totalLunchTime;
      session.status = 'completed';

      await session.save();
      return NextResponse.json({ session });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Session POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}