// /api/attendance/route.js
import connectMongoose from "@/app/utilis/connectMongoose";
import Timecard from "@/models/Timecard";
import Attendance from "@/models/Attendance";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

// Helper: convert "HH:mm" to decimal hours
function timeToHours(timeStr) {
  if (!timeStr) return 0;
  if (typeof timeStr === 'number') return timeStr;
  if (!timeStr.includes(':')) return parseFloat(timeStr) || 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h + m / 60;
}

// Calculate attendance status
function calculateAttendance(totalHours, permissionHours, hasLogout = true) {
  // If no logout time, employee is still in office
  if (!hasLogout) return "In Office";
  
  const effectiveHours = totalHours + Math.min(permissionHours, 2);
  if (effectiveHours >= 8) return "Present";
  if (effectiveHours >= 4) return "Half Day";
  return "Absent";
}

// Get employee data from all department collections
async function getEmployeeData(employeeId) {
  const collections = Object.keys(mongoose.connection.collections);
  const departmentCollections = collections.filter(name => name.endsWith('_department'));
  
  for (const collectionName of departmentCollections) {
    const collection = mongoose.connection.collections[collectionName];
    const employee = await collection.findOne({ employeeId });
    if (employee) {
      return {
        name: `${employee.firstName} ${employee.lastName}`,
        email: employee.email || 'N/A'
      };
    }
  }
  return { name: "Unknown", email: "N/A" };
}

// GET: fetch existing attendance (optional date range)
export async function GET(req) {
  try {
    await connectMongoose();
    const { searchParams } = new URL(req.url);

    const employeeId = searchParams.get("employeeId");
    const isAdmin = searchParams.get("admin") === "true";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let query = {};
    if (employeeId && !isAdmin) {
      query.employeeId = employeeId;
    }

    // Handle date filtering
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    // Generate attendance from timecard data
    const timecards = await Timecard.find(query).sort({ date: -1 });
    const attendanceData = [];
    
    for (const tc of timecards) {
      const totalHours = timeToHours(tc.totalHours || "00:00");
      const permissionHours = Math.min(timeToHours(tc.permission || "00:00"), 2);
      const hasLogout = tc.logOut && tc.logOut.trim() !== "";
      const status = calculateAttendance(totalHours, permissionHours, hasLogout);
      const employeeData = await getEmployeeData(tc.employeeId);
      
      // Store/update in attendance database
      await Attendance.findOneAndUpdate(
        { employeeId: tc.employeeId, date: tc.date },
        {
          employeeId: tc.employeeId,
          date: tc.date,
          status,
          totalHours,
          permissionHours,
          loginTime: tc.logIn || "",
          logoutTime: tc.logOut || ""
        },
        { upsert: true, new: true }
      );
      
      attendanceData.push({
        date: tc.date,
        employeeId: tc.employeeId,
        employeeName: employeeData.name,
        employeeEmail: employeeData.email,
        totalHours,
        permissionHours,
        loginTime: tc.logIn || "",
        logoutTime: tc.logOut || "",
        status,
      });
    }

    return NextResponse.json(attendanceData, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

// POST: generate attendance or manual entry
export async function POST(req) {
  try {
    await connectMongoose();
    const body = await req.json();
    const { startDate, endDate, employeeId } = body;



    let query = {};
    if (employeeId) query.employeeId = employeeId;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const timecards = await Timecard.find(query).sort({ date: -1 });
    const attendanceData = [];
    
    for (const tc of timecards) {
      const totalHours = timeToHours(tc.totalHours || "00:00");
      const permissionHours = Math.min(timeToHours(tc.permission || "00:00"), 2);
      const hasLogout = tc.logOut && tc.logOut.trim() !== "";
      const status = calculateAttendance(totalHours, permissionHours, hasLogout);
      const employeeData = await getEmployeeData(tc.employeeId);
      
      // Calculate lunch duration and overtime
      const lunchDuration = tc.lunchOut && tc.lunchIn ? 
        Math.abs(new Date(`1970-01-01T${tc.lunchIn}:00`) - new Date(`1970-01-01T${tc.lunchOut}:00`)) / (1000 * 60) : 0;
      const overtimeHours = Math.max(0, totalHours - 8);
      
      await Attendance.findOneAndUpdate(
        { employeeId: tc.employeeId, date: tc.date },
        {
          employeeId: tc.employeeId,
          employeeName: employeeData.name,
          department: employeeData.department || "-",
          date: tc.date,
          status,
          totalHours,
          permissionHours,
          loginTime: tc.logIn || "",
          logoutTime: tc.logOut || "",
          lunchDuration,
          overtimeHours,
          remarks: tc.reason || "",

          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );
      
      attendanceData.push({
        date: tc.date,
        employeeId: tc.employeeId,
        employeeName: employeeData.name,
        department: employeeData.department || "-",
        totalHours,
        permissionHours,
        loginTime: tc.logIn || "",
        logoutTime: tc.logOut || "",
        lunchDuration,
        overtimeHours,
        status,

        remarks: tc.reason || ""
      });
    }

    return NextResponse.json(attendanceData, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed to process attendance" }, { status: 500 });
  }
}

// PUT: Update attendance record
export async function PUT(req) {
  try {
    await connectMongoose();
    const body = await req.json();
    const { _id, ...updates } = body;
    
    updates.updatedAt = new Date();
    
    const attendance = await Attendance.findByIdAndUpdate(_id, updates, { new: true });
    
    if (!attendance) {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, attendance });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
