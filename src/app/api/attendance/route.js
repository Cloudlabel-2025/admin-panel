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
function calculateAttendance(totalHours, permissionHours) {
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
      const status = calculateAttendance(totalHours, permissionHours);
      const employeeData = await getEmployeeData(tc.employeeId);
      
      // Store/update in attendance database
      await Attendance.findOneAndUpdate(
        { employeeId: tc.employeeId, date: tc.date },
        {
          employeeId: tc.employeeId,
          date: tc.date,
          status,
          totalHours,
          permissionHours
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
        status,
      });
    }

    return NextResponse.json(attendanceData, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

// POST: generate attendance for given date range or all records
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
      const status = calculateAttendance(totalHours, permissionHours);
      const employeeData = await getEmployeeData(tc.employeeId);
      
      // Store in attendance database
      await Attendance.findOneAndUpdate(
        { employeeId: tc.employeeId, date: tc.date },
        {
          employeeId: tc.employeeId,
          date: tc.date,
          status,
          totalHours,
          permissionHours
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
        status,
      });
    }

    return NextResponse.json(attendanceData, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed to generate attendance" }, { status: 500 });
  }
}
