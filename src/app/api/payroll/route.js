import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import Payroll from "../../../models/Payroll";
import connectMongoose from "@/app/utilis/connectMongoose";
import mongoose from "mongoose";

const SalaryHikeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  department: { type: String, required: true },
  previousSalary: { type: Number, required: true },
  newSalary: { type: Number, required: true },
  effectiveDate: { type: Date, required: true },
  reason: { type: String, required: true },
  processedBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const SalaryHike = mongoose.models.SalaryHike || mongoose.model('SalaryHike', SalaryHikeSchema);

// Helper to get current salary for employee
async function getCurrentSalary(employeeId, payPeriod) {
  try {
    const [year, month] = payPeriod.split('-');
    const payPeriodDate = new Date(year, month - 1, 1);
    
    const latestHike = await SalaryHike.findOne({
      employeeId,
      effectiveDate: { $lte: payPeriodDate }
    }).sort({ effectiveDate: -1 });
    
    if (latestHike) {
      return latestHike.newSalary;
    }
    
    const departmentModels = Object.keys(mongoose.models).filter(name =>
      name.endsWith("_department")
    );
    
    for (const modelName of departmentModels) {
      const Model = mongoose.models[modelName];
      const employee = await Model.findOne({ employeeId });
      if (employee) {
        return employee.payroll?.salary || 0;
      }
    }
  } catch (error) {
    console.error('Error getting current salary:', error);
  }
  return 0;
}

// Helper to get employee data
async function getEmployeeData(employeeId) {
  try {
    const departmentModels = Object.keys(mongoose.models).filter(name =>
      name.endsWith("_department")
    );
    
    for (const modelName of departmentModels) {
      const Model = mongoose.models[modelName];
      const employee = await Model.findOne({ employeeId });
      if (employee) {
        return {
          name: `${employee.firstName} ${employee.lastName}`,
          department: modelName.replace("_department", ""),
          designation: employee.designation || "Employee",
          grossSalary: employee.payroll?.salary || 0,
          email: employee.email
        };
      }
    }
  } catch (error) {
    console.error('Error fetching employee:', error);
  }
  return null;
}

// Helper to get attendance data from attendance records
async function getAttendanceData(employeeId, payPeriod) {
  try {
    const Attendance = mongoose.models.Attendance;
    if (!Attendance) return { workingDays: 26, presentDays: 0, overtimeHours: 0 };
    
    const [year, month] = payPeriod.split('-');
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const attendanceRecords = await Attendance.find({
      employeeId,
      date: { $gte: startDate, $lte: endDate }
    });
    
    let presentDays = 0;
    let halfDays = 0;
    let absentDays = 0;
    let overtimeHours = 0;
    
    attendanceRecords.forEach(record => {
      if (record.status === 'Present') presentDays++;
      else if (record.status === 'Half Day') halfDays++;
      else if (record.status === 'Absent') absentDays++;
      
      if (record.overtimeHours) overtimeHours += record.overtimeHours;
    });
    
    return {
      workingDays: endDate.getDate(),
      presentDays,
      halfDays,
      absentDays,
      overtimeHours: Math.round(overtimeHours * 100) / 100
    };
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return { workingDays: 26, presentDays: 0, halfDays: 0, absentDays: 0, overtimeHours: 0 };
  }
}

function calculateHours(timecard) {
  if (!timecard.logIn || !timecard.logOut) return 0;
  
  const timeToMinutes = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };
  
  let loginMinutes = timeToMinutes(timecard.logIn);
  let logoutMinutes = timeToMinutes(timecard.logOut);
  
  if (logoutMinutes < loginMinutes) logoutMinutes += 24 * 60;
  
  let totalMinutes = logoutMinutes - loginMinutes;
  
  // Deduct lunch and breaks
  if (timecard.lunchOut && timecard.lunchIn) {
    const lunchMinutes = timeToMinutes(timecard.lunchIn) - timeToMinutes(timecard.lunchOut);
    totalMinutes -= lunchMinutes;
  }
  
  if (timecard.breakTime) totalMinutes -= timecard.breakTime;
  if (timecard.permission) totalMinutes -= (timecard.permission * 60);
  
  return Math.max(0, totalMinutes / 60);
}

// GET: Fetch payroll records
export async function GET(req) {
  try {
    await connectMongoose();
    const { searchParams } = new URL(req.url);
    
    const employeeId = searchParams.get("employeeId");
    const userRole = searchParams.get("userRole");
    const department = searchParams.get("department");
    const payPeriod = searchParams.get("payPeriod");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    
    let query = {};
    
    // Role-based access control
    if (userRole === "super-admin" || userRole === "admin") {
      // Super admin and admin can see all payrolls
      if (employeeId) query.employeeId = employeeId;
      if (department) query.department = department;
    } else {
      // Others can only see their own approved payrolls
      query.employeeId = employeeId;
      query.status = "Approved";
    }
    
    if (payPeriod) query.payPeriod = payPeriod;
    if (status && (userRole === "super-admin" || userRole === "admin")) query.status = status;
    
    const skip = (page - 1) * limit;
    
    const [payrolls, total] = await Promise.all([
      Payroll.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Payroll.countDocuments(query)
    ]);
    
    return NextResponse.json({
      payrolls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Payroll GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Create/Generate payroll
export async function POST(req) {
  try {
    await connectMongoose();
    const body = await req.json();
    const { employeeId, payPeriod, createdBy, customData, userRole } = body;
    
    // Only super-admin and admin can generate payroll
    if (userRole !== "super-admin" && userRole !== "admin") {
      return NextResponse.json({ error: "Unauthorized to generate payroll" }, { status: 403 });
    }
    
    if (!employeeId || !payPeriod || !createdBy) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Check if payroll already exists - if yes, update it
    const existing = await Payroll.findOne({ employeeId, payPeriod });
    
    // Get employee and attendance data
    const employee = await getEmployeeData(employeeId);
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }
    
    const attendance = await getAttendanceData(employeeId, payPeriod);
    
    // Get current salary (considering hikes)
    const currentSalary = await getCurrentSalary(employeeId, payPeriod);
    const grossSalary = customData?.grossSalary || currentSalary || employee.grossSalary;
    const basicSalary = Math.round(grossSalary * 0.5);
    const hra = Math.round(grossSalary * 0.2);
    const da = Math.round(grossSalary * 0.15);
    const conveyance = Math.round(grossSalary * 0.1);
    const medical = Math.round(grossSalary * 0.05);
    
    // Variable components
    const bonus = customData?.bonus || 0;
    const incentive = customData?.incentive || 0;
    const overtimePay = Math.round((attendance.overtimeHours || 0) * (grossSalary / (attendance.workingDays * 8)) * 1.5);
    
    // Calculate deductions
    const pf = Math.round(basicSalary * 0.12);
    const esi = grossSalary <= 21000 ? Math.round(grossSalary * 0.0075) : 0;
    
    // LOP calculation
    const lopDays = Math.max(0, attendance.workingDays - attendance.presentDays - (attendance.halfDays * 0.5));
    const lopDeduction = Math.round((grossSalary / attendance.workingDays) * lopDays);
    
    const totalEarnings = basicSalary + hra + da + conveyance + medical + bonus + incentive + overtimePay;
    const totalDeductions = pf + esi + lopDeduction + (customData?.loanDeduction || 0) + (customData?.otherDeductions || 0);
    const netPay = totalEarnings - totalDeductions;
    
    const payrollData = {
      employeeId,
      employeeName: employee.name,
      department: employee.department,
      designation: employee.designation,
      payPeriod,
      
      grossSalary,
      basicSalary,
      hra,
      da,
      conveyance,
      medical,
      bonus,
      incentive,
      overtimePay,
      
      workingDays: attendance.workingDays,
      presentDays: attendance.presentDays,
      absentDays: attendance.absentDays,
      halfDays: attendance.halfDays,
      overtimeHours: attendance.overtimeHours,
      
      pf,
      esi,
      lopDeduction,
      loanDeduction: customData?.loanDeduction || 0,
      otherDeductions: customData?.otherDeductions || 0,
      
      totalEarnings,
      totalDeductions,
      netPay,
      
      status: "Approved",
      createdBy,
      updatedAt: new Date()
    };
    
    let payroll;
    if (existing) {
      // Update existing payroll
      payroll = await Payroll.findByIdAndUpdate(existing._id, payrollData, { new: true });
    } else {
      // Create new payroll
      payroll = await Payroll.create(payrollData);
    }
    
    // Create notification for employee
    try {
      const Notification = mongoose.models.Notification;
      if (Notification) {
        await Notification.create({
          employeeId,
          type: 'payroll',
          title: 'New Payroll Available',
          message: `Your payroll for ${payPeriod} has been generated. Net Pay: ₹${payroll.netPay.toLocaleString()}`,
          payrollDetails: {
            payPeriod: payroll.payPeriod,
            netPay: payroll.netPay,
            status: payroll.status
          },
          isRead: false
        });
      }
    } catch (notifError) {
      console.error('Failed to create payroll notification:', notifError);
    }
    
    return NextResponse.json({ success: true, payroll });
  } catch (err) {
    console.error('Payroll POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: Update payroll or process salary hike
export async function PUT(req) {
  try {
    await connectMongoose();
    const body = await req.json();
    
    // Handle salary hike
    if (body.action === 'salary-hike') {
      const { employeeId, newSalary, effectiveDate, reason, processedBy } = body;
      
      if (!employeeId || !newSalary || !effectiveDate || !reason) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }
      
      // Get employee data and update salary
      const departmentModels = Object.keys(mongoose.models).filter(name =>
        name.endsWith("_department")
      );
      
      let employeeData = null;
      for (const modelName of departmentModels) {
        const Model = mongoose.models[modelName];
        const employee = await Model.findOne({ employeeId });
        if (employee) {
          const previousSalary = employee.payroll?.salary || 0;
          await Model.findOneAndUpdate(
            { employeeId },
            { 'payroll.salary': Number(newSalary) },
            { new: true }
          );
          employeeData = {
            name: `${employee.firstName} ${employee.lastName}`,
            department: modelName.replace("_department", ""),
            previousSalary
          };
          break;
        }
      }
      
      if (!employeeData) {
        return NextResponse.json({ error: "Employee not found" }, { status: 404 });
      }
      
      // Create salary hike record
      const salaryHike = await SalaryHike.create({
        employeeId,
        employeeName: employeeData.name,
        department: employeeData.department,
        previousSalary: employeeData.previousSalary,
        newSalary: Number(newSalary),
        effectiveDate: new Date(effectiveDate),
        reason,
        processedBy
      });
      
      return NextResponse.json({ 
        success: true, 
        salaryHike,
        employeeName: employeeData.name
      });
    }
    
    // Handle regular payroll update
    const { _id, ...updates } = body;
    updates.updatedAt = new Date();
    
    const payroll = await Payroll.findByIdAndUpdate(_id, updates, { new: true });
    if (!payroll) {
      return NextResponse.json({ error: "Payroll not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, payroll });
  } catch (err) {
    console.error('Payroll PUT error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}