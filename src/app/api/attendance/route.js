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

// Get employee data using the Employee API approach
async function getEmployeeData(employeeId) {
  try {
    const departmentModels = Object.keys(mongoose.models).filter(name =>
      name.endsWith("_department")
    );
    
    for (const modelName of departmentModels) {
      const Model = mongoose.models[modelName];
      const employee = await Model.findOne({ employeeId });
      if (employee) {
        // Extract department name properly by removing '_department' suffix
        const departmentName = modelName.replace("_department", "").replace(/([A-Z])/g, ' $1').trim();
        return {
          name: `${employee.firstName} ${employee.lastName}`,
          email: employee.email || 'N/A',
          department: departmentName.charAt(0).toUpperCase() + departmentName.slice(1)
        };
      }
    }
  } catch (error) {
    console.error('Error fetching employee data:', error);
  }
  return { name: "Unknown", email: "N/A", department: "Unknown" };
}

// GET: fetch existing attendance (optional date range)
export async function GET(req) {
  try {
    await connectMongoose();
    const { searchParams } = new URL(req.url);

    const employeeId = searchParams.get("employeeId");
    const isAdmin = searchParams.get("admin") === "true";
    const userRole = searchParams.get("userRole");
    const userDepartment = searchParams.get("userDepartment");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const department = searchParams.get("department");

    let query = {};
    if (employeeId && !isAdmin) {
      query.employeeId = employeeId;
    }
    
    // Filter by department for team roles
    let departmentEmployeeIds = [];
    const filterDepartment = department || ((userRole === "Team-Lead" || userRole === "Team-admin") ? userDepartment : null);
    
    if ((isAdmin && department) || (userRole === "Team-Lead" || userRole === "Team-admin")) {
      try {
        const employeeRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/Employee/search?department=${filterDepartment}`);
        if (employeeRes.ok) {
          const employeeData = await employeeRes.json();
          // For team roles, exclude other team-leads from the results
          if (userRole === "Team-Lead" || userRole === "Team-admin") {
            departmentEmployeeIds = employeeData.employees
              .filter(emp => emp.role !== "Team-Lead" || emp.employeeId === employeeId)
              .map(emp => emp.employeeId);
          } else {
            departmentEmployeeIds = employeeData.employees.map(emp => emp.employeeId);
          }
        }
      } catch (err) {
        console.error('Error filtering by department:', err);
      }
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

    // Apply department filtering if needed
    if (departmentEmployeeIds.length > 0) {
      query.employeeId = { $in: departmentEmployeeIds };
    }
    
    // First try to get from attendance records
    let attendanceRecords = await Attendance.find(query).sort({ date: -1 });
    
    // If no attendance records found, generate from timecard data
    if (attendanceRecords.length === 0) {
      const timecards = await Timecard.find(query).sort({ date: -1 });
      
      for (const tc of timecards) {
        const totalHours = timeToHours(tc.totalHours || "00:00");
        const permissionHours = Math.min(timeToHours(tc.permission || "00:00"), 2);
        const hasLogout = tc.logOut && tc.logOut.trim() !== "";
        const status = calculateAttendance(totalHours, permissionHours, hasLogout);
        const employeeData = await getEmployeeData(tc.employeeId);
        
        // Store in attendance database
        await Attendance.findOneAndUpdate(
          { employeeId: tc.employeeId, date: tc.date },
          {
            employeeId: tc.employeeId,
            employeeName: employeeData.name,
            department: employeeData.department,
            date: tc.date,
            status,
            totalHours,
            permissionHours,
            loginTime: tc.logIn || "",
            logoutTime: tc.logOut || "",
            overtimeHours: Math.max(0, totalHours - 8),
            remarks: tc.reason || ""
          },
          { upsert: true, new: true }
        );
      }
      
      // Fetch the newly created records
      attendanceRecords = await Attendance.find(query).sort({ date: -1 });
    }
    
    // Clean up Unknown employee names in database
    const unknownRecords = await Attendance.find({ 
      $or: [
        { employeeName: "Unknown" },
        { employeeName: { $exists: false } },
        { employeeName: "" }
      ]
    });
    
    for (const record of unknownRecords) {
      const employeeData = await getEmployeeData(record.employeeId);
      if (employeeData) {
        await Attendance.findByIdAndUpdate(record._id, {
          employeeName: employeeData.name,
          department: employeeData.department
        });
      }
    }
    
    // Fetch updated records
    attendanceRecords = await Attendance.find(query).sort({ date: -1 });
    
    // Populate employee names for all records
    const attendanceData = [];
    for (const record of attendanceRecords) {
      let employeeName = record.employeeName;
      let department = record.department;
      
      // If still no name, fetch employee data
      if (!employeeName || employeeName === "Unknown") {
        const employeeData = await getEmployeeData(record.employeeId);
        if (employeeData) {
          employeeName = employeeData.name;
          department = employeeData.department;
          
          await Attendance.findByIdAndUpdate(record._id, {
            employeeName: employeeData.name,
            department: employeeData.department
          });
        }
      }
      
      attendanceData.push({
        date: record.date,
        employeeId: record.employeeId,
        employeeName: employeeName || record.employeeId,
        department: department || "Unknown",
        totalHours: record.totalHours || 0,
        permissionHours: record.permissionHours || 0,
        overtimeHours: record.overtimeHours || 0,
        loginTime: record.loginTime || "",
        logoutTime: record.logoutTime || "",
        status: record.status,
        remarks: record.remarks || ""
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
