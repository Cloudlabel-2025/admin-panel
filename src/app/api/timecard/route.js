import connectMongoose from "@/app/utilis/connectMongoose";
import Timecard from "@/models/Timecard";
import { createEmployeeModel } from "@/models/Employee";
import { NextResponse } from "next/server";
import { requireAuth } from "../../utilis/authMiddleware";
import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
  updatedBy: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now }
});

const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);

const MAX_BREAKS = 1;
const BREAK_DURATION = 30;
const LUNCH_DURATION = 60;
const REQUIRED_WORK_HOURS = 8;
const MANDATORY_TIME = (REQUIRED_WORK_HOURS * 60) + BREAK_DURATION;
const GRACE_TIME = 60;
const LEAVE_THRESHOLD = 4 * 60; // 4 hours
const HALF_DAY_THRESHOLD = 8 * 60; // 8 hours
const PERMISSION_LIMIT = 2 * 60; // 2 hours
const MAX_PERMISSIONS_PER_MONTH = 2;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://admin-panel-umber-zeta.vercel.app';

const timeToMinutes = (time) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const calculateWorkMinutes = (timecard) => {
  if (!timecard.logIn || !timecard.logOut) return 0;

  let total = timeToMinutes(timecard.logOut) - timeToMinutes(timecard.logIn);

  if (timecard.lunchOut && timecard.lunchIn) {
    const lunchDuration = timeToMinutes(timecard.lunchIn) - timeToMinutes(timecard.lunchOut);
    // Only deduct standard lunch time (60 min), excess is unaccounted time
    const deductibleLunch = Math.min(lunchDuration, LUNCH_DURATION);
    total -= deductibleLunch;
  }

  if (timecard.breaks && Array.isArray(timecard.breaks)) {
    timecard.breaks.forEach(b => {
      if (b.breakOut && b.breakIn) {
        const breakDuration = timeToMinutes(b.breakIn) - timeToMinutes(b.breakOut);
        if (breakDuration > 0) {
          total -= breakDuration;
        }
      }
    });
  }

  return Math.max(0, total);
};

const getRequiredLoginTime = async () => {
  try {
    const setting = await Settings.findOne({ key: 'REQUIRED_LOGIN_TIME' });
    return setting?.value || "10:00";
  } catch (err) {
    return "10:00";
  }
};

const notifyExtension = async (employeeId, type, extensionMinutes, userRole) => {
  try {
    const { createEmployeeModel } = require('@/models/Employee');
    const departments = ['Technical', 'Functional', 'Production', 'OIC', 'Management'];

    // Get employee name
    let employeeName = employeeId;
    for (const dept of departments) {
      const EmployeeModel = createEmployeeModel(dept);
      const emp = await EmployeeModel.findOne({ employeeId });
      if (emp) {
        employeeName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || employeeId;
        break;
      }
    }

    let recipientRoles = [];
    const roleLower = userRole?.toLowerCase();

    if (roleLower === 'intern' || roleLower === 'employee') {
      recipientRoles = ['Team-admin', 'Team-Lead', 'Admin', 'admin', 'Super-admin', 'super-admin', 'SUPER_ADMIN', 'Developer', 'developer'];
    } else if (roleLower === 'team-admin') {
      recipientRoles = ['Team-Lead', 'Admin', 'admin', 'Super-admin', 'super-admin', 'SUPER_ADMIN', 'Developer', 'developer'];
    } else if (roleLower === 'team-lead') {
      recipientRoles = ['Admin', 'admin', 'Super-admin', 'super-admin', 'SUPER_ADMIN', 'Developer', 'developer'];
    } else if (roleLower === 'admin') {
      recipientRoles = ['Super-admin', 'super-admin', 'SUPER_ADMIN', 'Developer', 'developer'];
    }

    const notifications = [];
    const notifiedIds = new Set();

    // Always notify ADMIN001
    notifications.push({
      employeeId: 'ADMIN001',
      title: `${type} Extension Alert`,
      message: `${employeeName} (${employeeId}) extended ${type.toLowerCase()} by ${extensionMinutes} minutes`,
      type: 'warning',
      isRead: false
    });
    notifiedIds.add('ADMIN001');

    for (const dept of departments) {
      const EmployeeModel = createEmployeeModel(dept);
      const recipients = await EmployeeModel.find({ role: { $in: recipientRoles } });

      for (const recipient of recipients) {
        if (!notifiedIds.has(recipient.employeeId)) {
          notifications.push({
            employeeId: recipient.employeeId,
            title: `${type} Extension Alert`,
            message: `${employeeName} (${employeeId}) extended ${type.toLowerCase()} by ${extensionMinutes} minutes`,
            type: 'warning',
            isRead: false
          });
          notifiedIds.add(recipient.employeeId);
        }
      }
    }

    if (notifications.length > 0) {
      await fetch(`${BASE_URL}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications })
      });
    }
  } catch (err) {
    console.error('Extension notification failed:', err);
  }
};

const notifyLateLogin = async (employeeId, loginTime, requiredTime, userRole) => {
  try {
    console.log('Backend: Sending late login notification for', employeeId, 'at', loginTime, 'with role:', userRole);
    const { createEmployeeModel } = require('@/models/Employee');
    const departments = ['Technical', 'Functional', 'Production', 'OIC', 'Management'];

    // Get employee name
    let employeeName = employeeId;
    for (const dept of departments) {
      const EmployeeModel = createEmployeeModel(dept);
      const emp = await EmployeeModel.findOne({ employeeId });
      if (emp) {
        employeeName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || employeeId;
        break;
      }
    }

    let recipientRoles = [];
    const roleLower = userRole?.toLowerCase();

    if (roleLower === 'intern' || roleLower === 'employee') {
      recipientRoles = ['Team-admin', 'Team-Lead', 'Admin', 'admin', 'Super-admin', 'super-admin', 'SUPER_ADMIN', 'Developer', 'developer'];
    } else if (roleLower === 'team-admin') {
      recipientRoles = ['Team-Lead', 'Admin', 'admin', 'Super-admin', 'super-admin', 'SUPER_ADMIN', 'Developer', 'developer'];
    } else if (roleLower === 'team-lead') {
      recipientRoles = ['Admin', 'admin', 'Super-admin', 'super-admin', 'SUPER_ADMIN', 'Developer', 'developer'];
    } else if (roleLower === 'admin') {
      recipientRoles = ['Super-admin', 'super-admin', 'SUPER_ADMIN', 'Developer', 'developer'];
    } else {
      recipientRoles = ['Team-admin', 'Team-Lead', 'Admin', 'admin', 'Super-admin', 'super-admin', 'SUPER_ADMIN', 'Developer', 'developer'];
    }

    console.log('Backend: Looking for recipients with roles:', recipientRoles);

    const notifications = [];
    const notifiedIds = new Set();

    // Always notify ADMIN001 (super admin)
    notifications.push({
      employeeId: 'ADMIN001',
      title: 'Late Login Alert',
      message: `${employeeName} (${employeeId}) logged in late at ${loginTime}. Required: ${requiredTime}`,
      type: 'warning',
      isRead: false
    });
    notifiedIds.add('ADMIN001');

    for (const dept of departments) {
      const EmployeeModel = createEmployeeModel(dept);
      const recipients = await EmployeeModel.find({ role: { $in: recipientRoles } });
      console.log(`Backend: Found ${recipients.length} recipients in ${dept}:`, recipients.map(r => `${r.employeeId}(${r.role})`));

      for (const recipient of recipients) {
        if (!notifiedIds.has(recipient.employeeId)) {
          notifications.push({
            employeeId: recipient.employeeId,
            title: 'Late Login Alert',
            message: `${employeeName} (${employeeId}) logged in late at ${loginTime}. Required: ${requiredTime}`,
            type: 'warning',
            isRead: false
          });
          notifiedIds.add(recipient.employeeId);
        }
      }
    }

    console.log('Backend: Total notifications to send:', notifications.length);
    console.log('Backend: Notification recipients:', notifications.map(n => n.employeeId));
    console.log('Backend: Unique recipients:', [...notifiedIds]);

    if (notifications.length > 0) {
      const response = await fetch(`${BASE_URL}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications })
      });
      console.log('Backend: Notification API response status:', response.status);
      const result = await response.json();
      console.log('Backend: Notification API result:', result);
    }
  } catch (err) {
    console.error('Notification failed:', err);
  }
};

async function handlePOST(req) {
  try {
    await connectMongoose();
    const data = await req.json();

    if (!data.date) data.date = new Date();

    // CRITICAL: Check for existing timecard with login FIRST
    const dateStr = new Date(data.date).toISOString().split('T')[0];
    const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
    const endOfDay = new Date(dateStr + 'T23:59:59.999Z');

    const existingTimecard = await Timecard.findOne({
      employeeId: data.employeeId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    // If timecard exists with login, REJECT immediately
    if (existingTimecard && existingTimecard.logIn && data.logIn) {
      console.log(`[CRITICAL] DUPLICATE LOGIN BLOCKED: ${data.employeeId} at ${data.logIn}`);
      return NextResponse.json({
        error: "Already logged in today. Cannot login again.",
        timecard: existingTimecard,
        blocked: true
      }, { status: 400 });
    }

    // If timecard exists but no login (permission before login), update it
    if (existingTimecard && data.logIn) {
      existingTimecard.logIn = data.logIn;
      existingTimecard.userRole = data.userRole;

      const requiredLoginTime = await getRequiredLoginTime();
      if (timeToMinutes(data.logIn) > timeToMinutes(requiredLoginTime)) {
        await notifyLateLogin(data.employeeId, data.logIn, requiredLoginTime, data.userRole);
        existingTimecard.lateLogin = true;
        existingTimecard.lateLoginMinutes = timeToMinutes(data.logIn) - timeToMinutes(requiredLoginTime);
      }

      await existingTimecard.save();

      // Update first daily task entry
      try {
        const { createEmployeeModel } = require('@/models/Employee');
        const departments = ['Technical', 'Functional', 'Production', 'OIC', 'Management'];
        let employeeName = data.employeeId;

        for (const dept of departments) {
          const EmployeeModel = createEmployeeModel(dept);
          const emp = await EmployeeModel.findOne({ employeeId: data.employeeId });
          if (emp) {
            employeeName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
            break;
          }
        }

        await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/daily-task`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_first_entry',
            employeeId: data.employeeId,
            employeeName: employeeName,
            date: data.date,
            task: `Logged in at ${existingTimecard.logIn}`,
            status: 'In Progress'
          })
        });
      } catch (err) {
        console.error('Failed to update login task:', err);
      }

      return NextResponse.json({ message: "Logged in successfully", timecard: existingTimecard }, { status: 201 });
    }

    // Use client-provided login time instead of server time
    if (!data.logIn && !data.permissionMinutes) {
      data.logIn = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }

    const requiredLoginTime = await getRequiredLoginTime();

    // Handle permission before login
    if (data.permissionMinutes && !data.logIn) {
      console.log('Creating timecard with permission before login:', data.permissionMinutes, 'minutes');
      const timecard = await Timecard.create({
        ...data,
        permissionLocked: data.permissionLocked || false
      });
      return NextResponse.json({ message: "Permission recorded before login", timecard }, { status: 201 });
    }

    if (data.logIn) {
      console.log('Login time:', data.logIn, 'Required:', requiredLoginTime);
      console.log('Login minutes:', timeToMinutes(data.logIn), 'Required minutes:', timeToMinutes(requiredLoginTime));

      if (timeToMinutes(data.logIn) > timeToMinutes(requiredLoginTime)) {
        console.log('Late login detected, notifying admins');
        await notifyLateLogin(data.employeeId, data.logIn, requiredLoginTime, data.userRole);
        data.lateLogin = true;
        data.lateLoginMinutes = timeToMinutes(data.logIn) - timeToMinutes(requiredLoginTime);
      }
    }

    const timecard = await Timecard.create(data);

    // Create attendance record immediately on login
    if (timecard.logIn) {
      try {
        const Attendance = (await import('@/models/Attendance')).default;
        const attendanceDate = new Date(timecard.date);
        attendanceDate.setUTCHours(0, 0, 0, 0);

        const existing = await Attendance.findOne({
          employeeId: data.employeeId,
          date: attendanceDate
        });

        if (!existing) {
          // Fetch actual employee name and department
          let employeeName = data.employeeId;
          let employeeDepartment = 'Unknown';
          const departments = ['Technical', 'Functional', 'Production', 'OIC', 'Management'];
          for (const dept of departments) {
            const EmployeeModel = createEmployeeModel(dept);
            const emp = await EmployeeModel.findOne({ employeeId: data.employeeId });
            if (emp) {
              employeeName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || data.employeeId;
              employeeDepartment = dept;
              break;
            }
          }

          await Attendance.create({
            employeeId: data.employeeId,
            employeeName: employeeName,
            department: employeeDepartment,
            date: attendanceDate,
            status: 'In Office',
            loginTime: timecard.logIn,
            logoutTime: '',
            totalHours: 0,
            permissionHours: 0,
            overtimeHours: 0,
            isLateLogin: data.lateLogin || false,
            lateByMinutes: data.lateLoginMinutes || 0,
            remarks: ''
          });
          console.log('Attendance created for', data.employeeId, 'Name:', employeeName, 'Dept:', employeeDepartment);
        } else {
          // Update existing attendance with proper name/department if missing
          if (!existing.employeeName || existing.employeeName === existing.employeeId || existing.department === 'Unknown') {
            const departments = ['Technical', 'Functional', 'Production', 'OIC', 'Management'];
            for (const dept of departments) {
              const EmployeeModel = createEmployeeModel(dept);
              const emp = await EmployeeModel.findOne({ employeeId: data.employeeId });
              if (emp) {
                existing.employeeName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || data.employeeId;
                existing.department = dept;
                await existing.save();
                break;
              }
            }
          }
          console.log('Attendance already exists for', data.employeeId);
        }
      } catch (err) {
        console.error('Attendance error:', err.message);
      }
    }

    // Update first daily task entry on login
    if (timecard.logIn) {
      try {
        console.log('=== LOGIN: Attempting to update first daily task entry ===');
        console.log('Employee ID:', data.employeeId);
        console.log('Login time:', timecard.logIn);
        console.log('Date:', data.date);

        const { createEmployeeModel } = require('@/models/Employee');
        const departments = ['Technical', 'Functional', 'Production', 'OIC', 'Management'];
        let employeeName = data.employeeId;

        for (const dept of departments) {
          const EmployeeModel = createEmployeeModel(dept);
          const emp = await EmployeeModel.findOne({ employeeId: data.employeeId });
          if (emp) {
            employeeName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
            break;
          }
        }

        console.log('Employee name:', employeeName);

        const updatePayload = {
          action: 'update_first_entry',
          employeeId: data.employeeId,
          employeeName: employeeName,
          date: data.date,
          task: `Logged in at ${timecard.logIn}`,
          status: 'In Progress'
        };

        console.log('Sending PUT request with payload:', JSON.stringify(updatePayload));

        const response = await fetch(`${BASE_URL}/api/daily-task`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload)
        });

        const result = await response.json();
        console.log('Daily task API response status:', response.status);
        console.log('Daily task API response:', JSON.stringify(result));
      } catch (err) {
        console.error('Failed to update login task:', err);
      }
    }

    return NextResponse.json({ message: "Timecard created", timecard }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

export const POST = requireAuth(handlePOST);

export async function GET(req) {
  try {
    await connectMongoose();
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const isAdmin = searchParams.get("admin");
    const dateParam = searchParams.get("date");

    let query = {};
    if (employeeId && !isAdmin) query.employeeId = employeeId;

    if (isAdmin && dateParam) {
      const start = new Date(dateParam + 'T00:00:00.000Z');
      const end = new Date(dateParam + 'T23:59:59.999Z');
      query.date = { $gte: start, $lte: end };
    } else if (employeeId && !isAdmin) {
      // For employee view, get today's timecard only
      const today = new Date().toISOString().split('T')[0];
      const start = new Date(today + 'T00:00:00.000Z');
      const end = new Date(today + 'T23:59:59.999Z');
      query.date = { $gte: start, $lte: end };
    }

    const timecards = await Timecard.find(query).sort({ date: -1 }).limit(isAdmin ? 100 : 1);

    const timecardsWithNames = await Promise.all(
      timecards.map(async (timecard) => {
        try {
          const departments = ['Technical', 'Functional', 'Production', 'OIC', 'Management'];
          let employee = null;

          for (const dept of departments) {
            const EmployeeModel = createEmployeeModel(dept);
            const emp = await EmployeeModel.findOne({ employeeId: timecard.employeeId });
            if (emp) {
              employee = emp;
              break;
            }
          }

          return {
            ...timecard.toObject(),
            employeeName: employee ? `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'Unknown' : 'Unknown'
          };
        } catch (err) {
          return {
            ...timecard.toObject(),
            employeeName: 'Unknown'
          };
        }
      })
    );

    return NextResponse.json(timecardsWithNames, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

async function handlePUT(req) {
  try {
    await connectMongoose();
    const body = await req.json();
    const { _id, ...updates } = body;

    console.log('Backend: Received PUT request with updates:', JSON.stringify(updates));

    if (!_id) {
      return NextResponse.json({ error: "Timecard ID required" }, { status: 400 });
    }

    const timecard = await Timecard.findById(_id);
    if (!timecard) {
      return NextResponse.json({ error: "Timecard not found" }, { status: 404 });
    }

    console.log('Backend: Current timecard before update:', JSON.stringify(timecard));
    console.log('Backend: Applying updates:', JSON.stringify(updates));

    if (updates.lunchOut && timecard.lunchIn) {
      return NextResponse.json({ error: "Lunch already completed" }, { status: 400 });
    }

    if (updates.lunchOut && !timecard.lunchOut) {
      try {
        const { createEmployeeModel } = require('@/models/Employee');
        const departments = ['Technical', 'Functional', 'Production', 'OIC', 'Management'];
        let employeeName = timecard.employeeId;

        for (const dept of departments) {
          const EmployeeModel = createEmployeeModel(dept);
          const emp = await EmployeeModel.findOne({ employeeId: timecard.employeeId });
          if (emp) {
            employeeName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
            break;
          }
        }

        await fetch(`${BASE_URL}/api/daily-task`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId: timecard.employeeId,
            employeeName: employeeName,
            date: timecard.date,
            task: `Lunch break started at ${updates.lunchOut}`,
            status: 'In Progress',
            isLunchOut: true
          })
        });
      } catch (err) {
        console.error('Failed to add lunch out task:', err);
      }
    }

    if (updates.lunchIn && timecard.lunchOut) {
      const lunchDuration = timeToMinutes(updates.lunchIn) - timeToMinutes(timecard.lunchOut);
      if (lunchDuration > LUNCH_DURATION) {
        const extension = lunchDuration - LUNCH_DURATION;
        await notifyExtension(timecard.employeeId, 'Lunch', extension, timecard.userRole);
      }

      try {
        await fetch(`${BASE_URL}/api/daily-task`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId: timecard.employeeId,
            date: timecard.date,
            task: `Lunch break ended at ${updates.lunchIn}`,
            isLunchIn: true
          })
        });
      } catch (err) {
        console.error('Failed to update lunch in task:', err);
      }
    }

    if (updates.breaks) {
      console.log('Backend: Received breaks update:', JSON.stringify(updates.breaks));
      if (updates.breaks.length > MAX_BREAKS) {
        return NextResponse.json({ error: `Maximum ${MAX_BREAKS} breaks allowed` }, { status: 400 });
      }

      const lastBreak = updates.breaks[updates.breaks.length - 1];
      console.log('Backend: Last break:', JSON.stringify(lastBreak));

      // If break out (new break started), notify daily-task
      if (lastBreak?.breakOut && !lastBreak?.breakIn) {
        try {
          const { createEmployeeModel } = require('@/models/Employee');
          const departments = ['Technical', 'Functional', 'Production', 'OIC', 'Management'];
          let employeeName = timecard.employeeId;

          for (const dept of departments) {
            const EmployeeModel = createEmployeeModel(dept);
            const emp = await EmployeeModel.findOne({ employeeId: timecard.employeeId });
            if (emp) {
              employeeName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
              break;
            }
          }

          await fetch(`${BASE_URL}/api/daily-task`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              employeeId: timecard.employeeId,
              employeeName: employeeName,
              date: timecard.date,
              task: `Break started at ${lastBreak.breakOut}`,
              status: 'In Progress',
              isBreak: true,
              isBreakIn: false // Explicitly mark as start of break
            })
          });
        } catch (err) {
          console.error('Failed to update task end time on break out:', err);
        }
      }

      // If break in (break completed), add new task
      if (lastBreak?.breakOut && lastBreak?.breakIn) {
        const duration = timeToMinutes(lastBreak.breakIn) - timeToMinutes(lastBreak.breakOut);
        console.log('Backend: Break duration:', duration, 'minutes');
        if (duration > BREAK_DURATION) {
          const extension = duration - BREAK_DURATION;
          console.log('Backend: Break extension detected:', extension, 'minutes');
          await notifyExtension(timecard.employeeId, 'Break', extension, timecard.userRole);
        }

        // If break in (break completed), signal daily-task API
        try {
          const { createEmployeeModel } = require('@/models/Employee');
          const departments = ['Technical', 'Functional', 'Production', 'OIC', 'Management'];
          let employeeName = timecard.employeeId;

          for (const dept of departments) {
            const EmployeeModel = createEmployeeModel(dept);
            const emp = await EmployeeModel.findOne({ employeeId: timecard.employeeId });
            if (emp) {
              employeeName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
              break;
            }
          }

          // Signal break completion and start new task
          await fetch(`${BASE_URL}/api/daily-task`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              employeeId: timecard.employeeId,
              employeeName: employeeName,
              date: timecard.date,
              task: `Break ended at ${lastBreak.breakIn}`,
              isBreak: true,
              isBreakIn: true
            })
          });
        } catch (err) {
          console.error('Failed to signal break in to daily-task:', err);
        }
      }

      timecard.breaks = updates.breaks;
      console.log('Backend: Set timecard.breaks to:', JSON.stringify(timecard.breaks));
    }

    if (updates.permissionMinutes !== undefined) {
      console.log('Backend: Permission update - Minutes:', updates.permissionMinutes, 'Reason:', updates.permissionReason);
      if (timecard.permissionLocked && updates.permissionMinutes > 0) {
        return NextResponse.json({ error: "Permission already locked, cannot update" }, { status: 400 });
      }
      if (updates.permissionMinutes > 0 && updates.permissionMinutes < 30) {
        return NextResponse.json({ error: "Permission must be at least 30 minutes" }, { status: 400 });
      }

      // Check monthly permission limit
      if (updates.permissionMinutes > 0 && !timecard.permissionLocked) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const monthlyPermissions = await Timecard.countDocuments({
          employeeId: timecard.employeeId,
          date: { $gte: startOfMonth, $lte: endOfMonth },
          permissionLocked: true,
          _id: { $ne: _id }
        });

        console.log('Backend: Monthly permissions used:', monthlyPermissions);

        if (monthlyPermissions >= MAX_PERMISSIONS_PER_MONTH) {
          return NextResponse.json({
            error: `Permission limit reached. You can only take permission ${MAX_PERMISSIONS_PER_MONTH} times per month.`,
            details: `You have already used ${monthlyPermissions} permissions this month.`
          }, { status: 400 });
        }
      }

      // Handle permission removal
      if (updates.permissionMinutes === 0) {
        timecard.permissionMinutes = 0;
        timecard.permissionReason = "";
        timecard.permissionLocked = false;
      } else {
        // Handle permission addition/update
        timecard.permissionMinutes = updates.permissionMinutes;
        if (updates.permissionReason !== undefined) {
          timecard.permissionReason = updates.permissionReason;
        }
        if (updates.permissionLocked !== undefined) {
          timecard.permissionLocked = updates.permissionLocked;

          // Add permission entry to daily task when locked
          if (updates.permissionLocked) {
            try {
              const { createEmployeeModel } = require('@/models/Employee');
              const departments = ['Technical', 'Functional', 'Production', 'OIC', 'Management'];
              let employeeName = timecard.employeeId;

              for (const dept of departments) {
                const EmployeeModel = createEmployeeModel(dept);
                const emp = await EmployeeModel.findOne({ employeeId: timecard.employeeId });
                if (emp) {
                  employeeName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
                  break;
                }
              }

              await fetch(`${BASE_URL}/api/daily-task`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  employeeId: timecard.employeeId,
                  employeeName: employeeName,
                  date: timecard.date,
                  task: `Permission: ${updates.permissionMinutes} minutes`,
                  status: 'Completed',
                  isPermission: true,
                  permissionMinutes: updates.permissionMinutes
                })
              });
            } catch (err) {
              console.error('Failed to add permission task:', err);
            }
          }
        }
        if (updates.permissionMinutes > PERMISSION_LIMIT) {
          console.log('Backend: Permission exceeds limit, notifying admins');
          await notifyExtension(timecard.employeeId, 'Permission', updates.permissionMinutes - PERMISSION_LIMIT, timecard.userRole);
        }
      }
    }

    if (updates.logOut) {
      // Calculate work minutes using the helper function to ensure consistency (handles lunch and breaks)
      const workTime = calculateWorkMinutes({ ...timecard.toObject(), ...updates });
      const permissionTime = updates.permissionMinutes !== undefined ? updates.permissionMinutes : (timecard.permissionMinutes || 0);

      // Status logic: workTime + up to 2 hours of permission
      const effectiveMinutes = workTime + Math.min(permissionTime, 120);

      let attendanceStatus = 'Present';
      let statusReason = '';

      if (effectiveMinutes < LEAVE_THRESHOLD) {
        attendanceStatus = 'Leave';
        statusReason = `Effective work time ${Math.floor(effectiveMinutes / 60)}h ${effectiveMinutes % 60}m < 4 hours`;
      } else if (effectiveMinutes < HALF_DAY_THRESHOLD) {
        attendanceStatus = 'Half Day';
        statusReason = `Effective work time ${Math.floor(effectiveMinutes / 60)}h ${effectiveMinutes % 60}m < 8 hours`;
      }

      timecard.logOut = updates.logOut;
      timecard.attendanceStatus = attendanceStatus;
      timecard.statusReason = statusReason;
      timecard.workMinutes = workTime;

      if (updates.autoLogoutReason) {
        timecard.autoLogoutReason = updates.autoLogoutReason;
        console.log('Backend: Auto-logout reason:', updates.autoLogoutReason);
      }
      if (updates.manualLogoutReason) {
        timecard.manualLogoutReason = updates.manualLogoutReason;
        console.log('Backend: Manual logout reason:', updates.manualLogoutReason);
      }
    }

    if (updates.lunchOut) timecard.lunchOut = updates.lunchOut;
    if (updates.lunchIn) timecard.lunchIn = updates.lunchIn;
    if (updates.logIn) timecard.logIn = updates.logIn;

    timecard.markModified('breaks');
    timecard.markModified('permissionMinutes');
    timecard.markModified('permissionReason');
    timecard.markModified('permissionLocked');
    timecard.markModified('autoLogoutReason');
    timecard.markModified('manualLogoutReason');

    await timecard.save();

    console.log('Backend: Timecard saved successfully.');
    console.log('Backend: Saved breaks:', JSON.stringify(timecard.breaks));
    console.log('Backend: Saved permissionMinutes:', timecard.permissionMinutes);
    console.log('Backend: Saved permissionReason:', timecard.permissionReason);

    if (updates.logOut && timecard.employeeId) {
      try {
        const { createEmployeeModel } = require('@/models/Employee');
        const departments = ['Technical', 'Functional', 'Production', 'OIC', 'Management'];
        let employeeName = timecard.employeeId;

        for (const dept of departments) {
          const EmployeeModel = createEmployeeModel(dept);
          const emp = await EmployeeModel.findOne({ employeeId: timecard.employeeId });
          if (emp) {
            employeeName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
            break;
          }
        }

        // Add logout as last entry
        await fetch(`${BASE_URL}/api/daily-task`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId: timecard.employeeId,
            employeeName: employeeName,
            date: timecard.date,
            task: `Logged out at ${updates.logOut}`,
            status: 'Completed',
            isLogout: true
          })
        });

        await fetch(`${BASE_URL}/api/daily-task`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'complete_on_logout',
            employeeId: timecard.employeeId,
            logoutTime: updates.logOut
          })
        });

        await fetch(`${BASE_URL}/api/attendance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId: timecard.employeeId,
            startDate: timecard.date,
            endDate: timecard.date
          })
        });

        // Update attendance record with logout
        const Attendance = (await import('@/models/Attendance')).default;
        const attendanceDate = new Date(timecard.date);
        attendanceDate.setUTCHours(0, 0, 0, 0);

        // Search for record on the exact normalized date +/- 12 hours to catch local/UTC discrepancies
        const searchStart = new Date(attendanceDate);
        searchStart.setUTCHours(searchStart.getUTCHours() - 12);
        const searchEnd = new Date(attendanceDate);
        searchEnd.setUTCHours(searchEnd.getUTCHours() + 12);

        const totalHours = timecard.workMinutes / 60;

        await Attendance.findOneAndUpdate(
          {
            employeeId: timecard.employeeId,
            date: { $gte: searchStart, $lte: searchEnd }
          },
          {
            status: timecard.attendanceStatus,
            logoutTime: updates.logOut,
            totalHours: totalHours,
            overtimeHours: Math.max(0, totalHours - 8),
            updatedAt: new Date()
          }
        );
      } catch (err) {
        console.error('Failed to update on logout:', err);
      }
    }

    return NextResponse.json({ timecard: timecard.toObject(), message: 'Updated successfully' });
  } catch (err) {
    console.error("PUT error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export const PUT = requireAuth(handlePUT);
