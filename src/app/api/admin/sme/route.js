import { NextResponse } from "next/server";
import connectMongoose from "../../../utilis/connectMongoose";
import SMESession from "../../../../models/SMESession";
import SMETask from "../../../../models/SMETask";
import User from "../../../../models/User";
import jwt from "jsonwebtoken";

// Verify JWT token and check admin permissions
function verifyAdminToken(request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "") || 
                request.cookies.get("token")?.value ||
                request.headers.get("cookie")?.split("token=")[1]?.split(";")[0];
  
  if (!token) {
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const extractedToken = authHeader.substring(7);
      if (extractedToken) {
        try {
          const decoded = jwt.verify(extractedToken, process.env.JWT_SECRET);
          return isAdminRole(decoded.role) ? decoded : null;
        } catch (error) {
          return null;
        }
      }
    }
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return isAdminRole(decoded.role) ? decoded : null;
  } catch (error) {
    return null;
  }
}

function isAdminRole(role) {
  return ["super-admin", "Super-admin", "admin", "developer", "Team-Lead", "Team-admin"].includes(role);
}

// GET - Get all SME data for admin monitoring
export async function GET(request) {
  try {
    await connectMongoose();
    
    const user = verifyAdminToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const employeeId = searchParams.get("employeeId");
    const date = searchParams.get("date");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (type === "sessions") {
      // Get SME sessions with optional filters
      let query = {};
      
      if (employeeId) {
        query.employeeId = employeeId;
      }
      
      if (date) {
        query.date = date;
      } else if (startDate && endDate) {
        query.date = { $gte: startDate, $lte: endDate };
      }

      const sessions = await SMESession.find(query)
        .populate('tasks')
        .sort({ createdAt: -1 })
        .limit(100);

      // Get SME user details
      const employeeIds = [...new Set(sessions.map(s => s.employeeId))];
      const smeUsers = await User.find({ 
        employeeId: { $in: employeeIds }, 
        role: "SME" 
      }).select('employeeId name email');

      const sessionsWithUserInfo = sessions.map(session => ({
        ...session.toObject(),
        userInfo: smeUsers.find(u => u.employeeId === session.employeeId)
      }));

      return NextResponse.json({ sessions: sessionsWithUserInfo });

    } else if (type === "tasks") {
      // Get SME tasks with optional filters
      let query = {};
      
      if (employeeId) {
        query.employeeId = employeeId;
      }
      
      if (date) {
        query.date = date;
      } else if (startDate && endDate) {
        query.date = { $gte: startDate, $lte: endDate };
      }

      const tasks = await SMETask.find(query)
        .populate('sessionId', 'date loginTime logoutTime status')
        .sort({ createdAt: -1 })
        .limit(200);

      // Get SME user details
      const employeeIds = [...new Set(tasks.map(t => t.employeeId))];
      const smeUsers = await User.find({ 
        employeeId: { $in: employeeIds }, 
        role: "SME" 
      }).select('employeeId name email');

      const tasksWithUserInfo = tasks.map(task => ({
        ...task.toObject(),
        userInfo: smeUsers.find(u => u.employeeId === task.employeeId)
      }));

      return NextResponse.json({ tasks: tasksWithUserInfo });

    } else if (type === "smes") {
      // Get all SME users
      const smeUsers = await User.find({ role: "SME" })
        .select('employeeId name email createdAt')
        .sort({ createdAt: -1 });

      // Get session statistics for each SME
      const smeStats = await Promise.all(
        smeUsers.map(async (sme) => {
          const totalSessions = await SMESession.countDocuments({ employeeId: sme.employeeId });
          const completedSessions = await SMESession.countDocuments({ 
            employeeId: sme.employeeId, 
            status: 'completed' 
          });
          const totalTasks = await SMETask.countDocuments({ employeeId: sme.employeeId });
          
          // Get total working hours
          const sessions = await SMESession.find({ 
            employeeId: sme.employeeId, 
            status: 'completed' 
          }).select('netWorkingTime');
          
          const totalWorkingMinutes = sessions.reduce((sum, s) => sum + (s.netWorkingTime || 0), 0);
          
          return {
            ...sme.toObject(),
            stats: {
              totalSessions,
              completedSessions,
              totalTasks,
              totalWorkingHours: Math.round(totalWorkingMinutes / 60 * 100) / 100
            }
          };
        })
      );

      return NextResponse.json({ smes: smeStats });

    } else if (type === "analytics") {
      const today = new Date().toISOString().split('T')[0];
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const [totalSMEs, activeSessions, todaySessions, weekSessions, monthSessions, totalTasks, completedTasks] =
        await Promise.all([
          User.countDocuments({ role: "SME" }),
          SMESession.countDocuments({ status: { $in: ['active', 'break', 'lunch'] } }),
          SMESession.countDocuments({ date: today }),
          SMESession.countDocuments({ date: { $gte: lastWeek } }),
          SMESession.countDocuments({ date: { $gte: lastMonth } }),
          SMETask.countDocuments({}),
          SMETask.countDocuments({ status: 'completed' }),
        ]);

      const completedSessions = await SMESession.find({ status: 'completed' }).select('netWorkingTime');
      const totalWorkingMinutes = completedSessions.reduce((sum, s) => sum + (s.netWorkingTime || 0), 0);

      return NextResponse.json({
        analytics: {
          totalSMEs, activeSessions, todaySessions, weekSessions, monthSessions, totalTasks, completedTasks,
          totalWorkingHours: Math.round(totalWorkingMinutes / 60 * 100) / 100,
          averageSessionsPerSME: totalSMEs > 0 ? Math.round(monthSessions / totalSMEs * 100) / 100 : 0,
          taskCompletionRate: totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0,
        },
      });

    } else if (type === "report") {
      if (!startDate || !endDate)
        return NextResponse.json({ error: "startDate and endDate are required" }, { status: 400 });

      const sessionQuery = { date: { $gte: startDate, $lte: endDate } };
      if (employeeId) sessionQuery.employeeId = employeeId;
      const taskQuery = { date: { $gte: startDate, $lte: endDate } };
      if (employeeId) taskQuery.employeeId = employeeId;

      const [reportSessions, reportTasks] = await Promise.all([
        SMESession.find(sessionQuery).sort({ date: 1, loginTime: 1 }),
        SMETask.find(taskQuery).sort({ date: 1, createdAt: 1 }),
      ]);

      const empIds = [...new Set([...reportSessions.map(s => s.employeeId), ...reportTasks.map(t => t.employeeId)])];
      const smeUsers = await User.find({ employeeId: { $in: empIds } }).select("employeeId name email");
      const userMap = Object.fromEntries(smeUsers.map(u => [u.employeeId, { name: u.name, email: u.email }]));

      const grandTotalNet   = reportSessions.reduce((s, x) => s + (x.netWorkingTime || 0), 0);
      const grandTotalDur   = reportSessions.reduce((s, x) => s + (x.totalDuration  || 0), 0);
      const grandTotalBreak = reportSessions.reduce((s, x) => s + (x.totalBreakTime || 0) + (x.totalLunchTime || 0), 0);

      return NextResponse.json({
        startDate, endDate,
        employeeId: employeeId || "all",
        userMap,
        sessions: reportSessions.map(s => ({ ...s.toObject(), userInfo: userMap[s.employeeId] })),
        tasks:    reportTasks.map(t => ({ ...t.toObject(), userInfo: userMap[t.employeeId] })),
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
    console.error("Admin SME GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}