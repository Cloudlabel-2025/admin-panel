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

const timeToMinutes = (time) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const calculateWorkMinutes = (timecard) => {
  if (!timecard.logIn || !timecard.logOut) return 0;
  
  let total = timeToMinutes(timecard.logOut) - timeToMinutes(timecard.logIn);
  
  if (timecard.lunchOut && timecard.lunchIn) {
    total -= (timeToMinutes(timecard.lunchIn) - timeToMinutes(timecard.lunchOut));
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
    
    // Always notify ADMIN001
    notifications.push({
      employeeId: 'ADMIN001',
      title: `${type} Extension Alert`,
      message: `${employeeName} (${employeeId}) extended ${type.toLowerCase()} by ${extensionMinutes} minutes`,
      type: 'warning',
      isRead: false
    });
    
    for (const dept of departments) {
      const EmployeeModel = createEmployeeModel(dept);
      const recipients = await EmployeeModel.find({ role: { $in: recipientRoles } });
      
      for (const recipient of recipients) {
        notifications.push({
          employeeId: recipient.employeeId,
          title: `${type} Extension Alert`,
          message: `${employeeName} (${employeeId}) extended ${type.toLowerCase()} by ${extensionMinutes} minutes`,
          type: 'warning',
          isRead: false
        });
      }
    }
    
    if (notifications.length > 0) {
      await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/notifications`, {
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
    
    // Always notify ADMIN001 (super admin)
    notifications.push({
      employeeId: 'ADMIN001',
      title: 'Late Login Alert',
      message: `${employeeName} (${employeeId}) logged in late at ${loginTime}. Required: ${requiredTime}`,
      type: 'warning',
      isRead: false
    });
    
    for (const dept of departments) {
      const EmployeeModel = createEmployeeModel(dept);
      const recipients = await EmployeeModel.find({ role: { $in: recipientRoles } });
      console.log(`Backend: Found ${recipients.length} recipients in ${dept}:`, recipients.map(r => `${r.employeeId}(${r.role})`));
      
      for (const recipient of recipients) {
        notifications.push({
          employeeId: recipient.employeeId,
          title: 'Late Login Alert',
          message: `${employeeName} (${employeeId}) logged in late at ${loginTime}. Required: ${requiredTime}`,
          type: 'warning',
          isRead: false
        });
      }
    }
    
    console.log('Backend: Total notifications to send:', notifications.length);
    
    if (notifications.length > 0) {
      const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/notifications`, {
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
    // Use client-provided login time instead of server time
    if (!data.logIn) {
      data.logIn = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }
    
    const requiredLoginTime = await getRequiredLoginTime();
    
    if (timeToMinutes(data.logIn) > timeToMinutes(requiredLoginTime)) {
      await notifyLateLogin(data.employeeId, data.logIn, requiredLoginTime, data.userRole);
      data.lateLogin = true;
      data.lateLoginMinutes = timeToMinutes(data.logIn) - timeToMinutes(requiredLoginTime);
    }
    
    const timecard = await Timecard.create(data);
    
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
        
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/daily-task`, {
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
      const start = new Date(dateParam);
      const end = new Date(dateParam);
      end.setHours(23, 59, 59);
      query.date = { $gte: start, $lte: end };
    }
    
    const timecards = await Timecard.find(query).sort({ date: -1 });
    
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

    if (updates.lunchIn && timecard.lunchOut) {
      const lunchDuration = timeToMinutes(updates.lunchIn) - timeToMinutes(timecard.lunchOut);
      if (lunchDuration > LUNCH_DURATION) {
        const extension = lunchDuration - LUNCH_DURATION;
        await notifyExtension(timecard.employeeId, 'Lunch', extension, timecard.userRole);
      }
    }

    if (updates.breaks) {
      console.log('Backend: Received breaks update:', JSON.stringify(updates.breaks));
      if (updates.breaks.length > MAX_BREAKS) {
        return NextResponse.json({ error: `Maximum ${MAX_BREAKS} breaks allowed` }, { status: 400 });
      }
      
      const lastBreak = updates.breaks[updates.breaks.length - 1];
      console.log('Backend: Last break:', JSON.stringify(lastBreak));
      if (lastBreak?.breakOut && lastBreak?.breakIn) {
        const duration = timeToMinutes(lastBreak.breakIn) - timeToMinutes(lastBreak.breakOut);
        console.log('Backend: Break duration:', duration, 'minutes');
        if (duration > BREAK_DURATION) {
          const extension = duration - BREAK_DURATION;
          console.log('Backend: Break extension detected:', extension, 'minutes');
          await notifyExtension(timecard.employeeId, 'Break', extension, timecard.userRole);
        }
      }
      timecard.breaks = updates.breaks;
      console.log('Backend: Set timecard.breaks to:', JSON.stringify(timecard.breaks));
    }

    if (updates.permissionMinutes !== undefined) {
      console.log('Backend: Permission update - Minutes:', updates.permissionMinutes, 'Reason:', updates.permissionReason);
      if (timecard.permissionLocked) {
        return NextResponse.json({ error: "Permission already locked, cannot update" }, { status: 400 });
      }
      if (updates.permissionMinutes < 30) {
        return NextResponse.json({ error: "Permission must be at least 30 minutes" }, { status: 400 });
      }
      timecard.permissionMinutes = updates.permissionMinutes;
      if (updates.permissionReason !== undefined) {
        timecard.permissionReason = updates.permissionReason;
      }
      if (updates.permissionLocked !== undefined) {
        timecard.permissionLocked = updates.permissionLocked;
      }
      if (updates.permissionMinutes > PERMISSION_LIMIT) {
        console.log('Backend: Permission exceeds limit, notifying admins');
        await notifyExtension(timecard.employeeId, 'Permission', updates.permissionMinutes - PERMISSION_LIMIT, timecard.userRole);
      }
    }

    if (updates.logOut) {
      const totalTime = timeToMinutes(updates.logOut) - timeToMinutes(timecard.logIn);
      const lunchTime = (timecard.lunchOut && timecard.lunchIn) 
        ? timeToMinutes(timecard.lunchIn) - timeToMinutes(timecard.lunchOut) 
        : 0;
      const workTime = totalTime - lunchTime;
      const permissionTime = updates.permissionMinutes !== undefined ? updates.permissionMinutes : (timecard.permissionMinutes || 0);
      
      let attendanceStatus = 'Present';
      let statusReason = '';
      
      if (workTime < LEAVE_THRESHOLD) {
        attendanceStatus = 'Leave';
        statusReason = `Work time ${Math.floor(workTime / 60)}h ${workTime % 60}m < 4 hours`;
      } else if (workTime < HALF_DAY_THRESHOLD) {
        attendanceStatus = 'Half Day';
        statusReason = `Work time ${Math.floor(workTime / 60)}h ${workTime % 60}m < 8 hours`;
      } else if (permissionTime > PERMISSION_LIMIT) {
        attendanceStatus = 'Half Day';
        statusReason = `Permission ${permissionTime} min > 2 hours`;
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
        await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/daily-task`, {
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
        
        await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/daily-task`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'complete_on_logout',
            employeeId: timecard.employeeId,
            logoutTime: updates.logOut
          })
        });
        
        await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/attendance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeId: timecard.employeeId })
        });
      } catch (err) {
        console.error('Failed to complete daily tasks on logout:', err);
      }
    }

    return NextResponse.json({ timecard: timecard.toObject(), message: 'Updated successfully' });
  } catch (err) {
    console.error("PUT error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export const PUT = requireAuth(handlePUT);
