// /api/attendance/route.js
import connectMongoose from "@/app/utilis/connectMongoose";


import Timecard from "@/models/Timecard";
import Attendance from "@/models/Attendance";
import WeekendOverride from "@/models/WeekendOverride";
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

// Helper: check if login is late
async function checkLateLogin(loginTime) {
  if (!loginTime) return { isLate: false, lateBy: 0 };
  
  try {
    const Settings = mongoose.models.Settings || mongoose.model('Settings', new mongoose.Schema({
      key: { type: String, required: true, unique: true },
      value: { type: String, required: true },
      updatedBy: { type: String },
      updatedAt: { type: Date, default: Date.now }
    }));
    
    const setting = await Settings.findOne({ key: 'REQUIRED_LOGIN_TIME' });
    const standardTime = setting?.value || "10:00";
    const gracePeriod = 15;
    
    const [loginH, loginM] = loginTime.split(':').map(Number);
    const [stdH, stdM] = standardTime.split(':').map(Number);
    
    const loginMinutes = loginH * 60 + loginM;
    const standardMinutes = stdH * 60 + stdM + gracePeriod;
    
    const lateBy = loginMinutes - standardMinutes;
    return { isLate: lateBy > 0, lateBy: Math.max(0, lateBy) };
  } catch (err) {
    console.error('Error checking late login:', err);
    return { isLate: false, lateBy: 0 };
  }
}

// Helper: check if date is weekend
async function isWeekend(date) {
  try {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    // Priority 1: Manual override (highest priority)
    const override = await WeekendOverride.findOne({ date: checkDate });
    if (override) return override.isWeekend;
    
    // Priority 2: Automatic weekend detection
    const dayOfWeek = checkDate.getDay();
    
    // Sunday is always weekend
    if (dayOfWeek === 0) return true;
    
    // Saturday: check if 2nd or 4th
    if (dayOfWeek === 6) {
      const weekOfMonth = Math.ceil(checkDate.getDate() / 7);
      return weekOfMonth === 2 || weekOfMonth === 4;
    }
    
    return false;
  } catch (err) {
    console.error('Error checking weekend:', err);
    return date.getDay() === 0;
  }
}

// Helper: check if date is holiday
async function isHoliday(date, department = null) {
  try {
    const Holiday = mongoose.models.Holiday;
    if (!Holiday) return null;
    
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    const holiday = await Holiday.findOne({
      date: checkDate,
      $or: [
        { type: "National" },
        { type: "Regional", region: department },
        { type: "Company" },
        { department: department }
      ]
    });
    
    return holiday;
  } catch (err) {
    console.error('Error checking holiday:', err);
    return null;
  }
}

// Calculate attendance status
function calculateAttendance(totalHours, permissionHours, hasLogout = true) {
  // If no logout time, mark as logout missing
  if (!hasLogout) return "Logout Missing";
  
  const effectiveHours = totalHours + Math.min(permissionHours, 2);
  if (effectiveHours >= 8) return "Present";
  if (effectiveHours >= 4) return "Half Day";
  return "Absent";
}

// Calculate status based on login/logout
function getAttendanceStatus(loginTime, logoutTime, totalHours, permissionHours, date) {
  // If logged in but not logged out
  if (loginTime && (!logoutTime || logoutTime.trim() === "")) {
    // Check if date is today or future = In Office
    const recordDate = new Date(date);
    recordDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (recordDate >= today) {
      return "In Office";
    }
    
    // Past date without logout = Logout Missing
    return "Logout Missing";
  }
  
  // If logged out, calculate based on hours
  if (logoutTime && logoutTime.trim() !== "") {
    return calculateAttendance(totalHours, permissionHours, true);
  }
  
  // No login = Absent
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
    
    // Always check for missing timecards and generate attendance
    const timecards = await Timecard.find(query).sort({ date: -1 });
    
    for (const tc of timecards) {
      const existing = await Attendance.findOne({ employeeId: tc.employeeId, date: tc.date });
      
      if (!existing) {
        const employeeData = await getEmployeeData(tc.employeeId);
        const holiday = await isHoliday(new Date(tc.date), employeeData.department);
        const isWeekendDay = await isWeekend(new Date(tc.date));
        
        // Priority: Holiday > Weekend (but if weekend is overridden as working day and has login, treat as normal)
        if (holiday) {
          await Attendance.create({
            employeeId: tc.employeeId,
            employeeName: employeeData.name,
            department: employeeData.department,
            date: tc.date,
            status: "Holiday",
            remarks: `Holiday: ${holiday.name} (${holiday.type})`
          });
        } else if (isWeekendDay && !tc.logIn) {
          // Weekend without login = Weekend status
          await Attendance.create({
            employeeId: tc.employeeId,
            employeeName: employeeData.name,
            department: employeeData.department,
            date: tc.date,
            status: "Weekend",
            remarks: "Weekend"
          });
        } else {
          const totalHours = timeToHours(tc.totalHours || "00:00");
          const permissionHours = Math.min(timeToHours(tc.permission || "00:00"), 2);
          const status = getAttendanceStatus(tc.logIn, tc.logOut, totalHours, permissionHours, tc.date);
          const lateCheck = await checkLateLogin(tc.logIn);
          
          await Attendance.create({
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
            isLateLogin: lateCheck.isLate,
            lateByMinutes: lateCheck.lateBy,
            remarks: tc.reason || ""
          });
        }
      }
    }
    
    // Fetch all records including newly created
    attendanceRecords = await Attendance.find(query).sort({ date: -1 });
    
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
        isLateLogin: record.isLateLogin || false,
        lateByMinutes: record.lateByMinutes || 0,
        remarks: record.remarks || ""
      });
    }

    return NextResponse.json(attendanceData, { status: 200 });
  } catch (err) {
    console.error('GET /api/attendance error:', err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

// POST: generate attendance or manual entry
export async function POST(req) {
  try {
    await connectMongoose();
    
    // Check if this is an automated cron job
    const { searchParams } = new URL(req.url);
    const isAutomated = searchParams.get("automated") === "true";
    const cronKey = searchParams.get("key");
    
    // Handle automated daily generation
    if (isAutomated) {
      if (cronKey !== process.env.CRON_SECRET_KEY && cronKey !== "manual-trigger") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);
      
      const timecards = await Timecard.find({
        date: { $gte: yesterday, $lte: endOfYesterday }
      });
      
      let processed = 0, updated = 0, errors = 0;
      
      for (const tc of timecards) {
        try {
          const employeeData = await getEmployeeData(tc.employeeId);
          const holiday = await isHoliday(new Date(tc.date), employeeData.department);
          const isWeekendDay = await isWeekend(new Date(tc.date));
          
          // Priority: Holiday > Weekend (but if weekend is overridden as working day and has login, treat as normal)
          if (holiday) {
            await Attendance.findOneAndUpdate(
              { employeeId: tc.employeeId, date: tc.date },
              {
                employeeId: tc.employeeId,
                employeeName: employeeData.name,
                department: employeeData.department,
                date: tc.date,
                status: "Holiday",
                remarks: `Holiday: ${holiday.name} (${holiday.type})`,
                updatedAt: new Date()
              },
              { upsert: true, new: true }
            );
          } else if (isWeekendDay && !tc.logIn) {
            // Weekend without login = Weekend status
            await Attendance.findOneAndUpdate(
              { employeeId: tc.employeeId, date: tc.date },
              {
                employeeId: tc.employeeId,
                employeeName: employeeData.name,
                department: employeeData.department,
                date: tc.date,
                status: "Weekend",
                remarks: "Weekend",
                updatedAt: new Date()
              },
              { upsert: true, new: true }
            );
          } else {
            const totalHours = timeToHours(tc.totalHours || "00:00");
            const permissionHours = Math.min(timeToHours(tc.permission || "00:00"), 2);
            const status = getAttendanceStatus(tc.logIn, tc.logOut, totalHours, permissionHours, tc.date);
            const overtimeHours = Math.max(0, totalHours - 8);
            
            const lateCheck = await checkLateLogin(tc.logIn);
            
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
                overtimeHours,
                isLateLogin: lateCheck.isLate,
                lateByMinutes: lateCheck.lateBy,
                remarks: tc.reason || "",
                updatedAt: new Date()
              },
              { upsert: true, new: true }
            );
          }
          
          existing ? updated++ : processed++;
        } catch (err) {
          console.error(`Error processing ${tc.employeeId}:`, err);
          errors++;
        }
      }
      
      return NextResponse.json({
        success: true,
        message: "Automated attendance generation completed",
        stats: { totalTimecards: timecards.length, newRecords: processed, updatedRecords: updated, errors },
        processedDate: yesterday.toISOString().split('T')[0]
      });
    }
    
    // Manual generation
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
      const status = getAttendanceStatus(tc.logIn, tc.logOut, totalHours, permissionHours, tc.date);
      const employeeData = await getEmployeeData(tc.employeeId);
      
      // Calculate lunch duration and overtime
      const lunchDuration = tc.lunchOut && tc.lunchIn ? 
        Math.abs(new Date(`1970-01-01T${tc.lunchIn}:00`) - new Date(`1970-01-01T${tc.lunchOut}:00`)) / (1000 * 60) : 0;
      const overtimeHours = Math.max(0, totalHours - 8);
      
      const lateCheck = await checkLateLogin(tc.logIn);
      
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
          isLateLogin: lateCheck.isLate,
          lateByMinutes: lateCheck.lateBy,
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
    const { _id, action, approvedBy, approverRemarks, ...updates } = body;
    
    // Handle regularization requests
    if (action === "regularize") {
      const Regularization = mongoose.models.Regularization || mongoose.model('Regularization', new mongoose.Schema({
        employeeId: String,
        employeeName: String,
        department: String,
        attendanceId: mongoose.Schema.Types.ObjectId,
        date: Date,
        currentStatus: String,
        requestedStatus: String,
        currentLoginTime: String,
        requestedLoginTime: String,
        currentLogoutTime: String,
        requestedLogoutTime: String,
        reason: String,
        documentUrl: String,
        status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
        approvedBy: String,
        approvalDate: Date,
        approverRemarks: String,
        auditTrail: [{ action: String, performedBy: String, timestamp: Date, changes: Object }],
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
      }));
      
      const attendance = await Attendance.findById(body.attendanceId);
      if (!attendance) {
        return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
      }
      
      const regularization = await Regularization.create({
        employeeId: body.employeeId,
        employeeName: body.employeeName,
        department: body.department,
        attendanceId: body.attendanceId,
        date: attendance.date,
        currentStatus: attendance.status,
        requestedStatus: body.requestedStatus,
        currentLoginTime: attendance.loginTime,
        requestedLoginTime: body.requestedLoginTime,
        currentLogoutTime: attendance.logoutTime,
        requestedLogoutTime: body.requestedLogoutTime,
        reason: body.reason,
        documentUrl: body.documentUrl,
        auditTrail: [{
          action: "Request Created",
          performedBy: body.employeeId,
          timestamp: new Date(),
          changes: { status: "Pending" }
        }]
      });
      
      return NextResponse.json({ success: true, regularization });
    }
    
    // Handle regularization approval/rejection
    if (action === "approve-regularization" || action === "reject-regularization") {
      const Regularization = mongoose.models.Regularization;
      if (!Regularization) {
        return NextResponse.json({ error: "Regularization model not found" }, { status: 500 });
      }
      
      const regularization = await Regularization.findById(_id);
      if (!regularization) {
        return NextResponse.json({ error: "Regularization request not found" }, { status: 404 });
      }
      
      if (action === "approve-regularization") {
        const attendance = await Attendance.findById(regularization.attendanceId);
        if (!attendance) {
          return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
        }
        
        const oldData = {
          status: attendance.status,
          loginTime: attendance.loginTime,
          logoutTime: attendance.logoutTime
        };
        
        attendance.status = regularization.requestedStatus;
        if (regularization.requestedLoginTime) attendance.loginTime = regularization.requestedLoginTime;
        if (regularization.requestedLogoutTime) attendance.logoutTime = regularization.requestedLogoutTime;
        attendance.remarks = `Regularized: ${regularization.reason}`;
        attendance.updatedAt = new Date();
        await attendance.save();
        
        regularization.status = "Approved";
        regularization.approvedBy = approvedBy;
        regularization.approvalDate = new Date();
        regularization.approverRemarks = approverRemarks;
        regularization.auditTrail.push({
          action: "Approved",
          performedBy: approvedBy,
          timestamp: new Date(),
          changes: { from: oldData, to: {
            status: regularization.requestedStatus,
            loginTime: regularization.requestedLoginTime,
            logoutTime: regularization.requestedLogoutTime
          }}
        });
      } else {
        regularization.status = "Rejected";
        regularization.approvedBy = approvedBy;
        regularization.approvalDate = new Date();
        regularization.approverRemarks = approverRemarks;
        regularization.auditTrail.push({
          action: "Rejected",
          performedBy: approvedBy,
          timestamp: new Date(),
          changes: { reason: approverRemarks }
        });
      }
      
      await regularization.save();
      return NextResponse.json({ success: true, regularization });
    }
    
    // Regular attendance update
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
