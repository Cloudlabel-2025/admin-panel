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
const GRACE_TIME = 60;

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

const notifyLateLogin = async (employeeId, loginTime, requiredTime, userRole) => {
  try {
    const { createEmployeeModel } = require('@/models/Employee');
    const departments = ['Technical', 'Functional', 'Production', 'OIC', 'Management'];
    
    let recipientRoles = [];
    const roleLower = userRole?.toLowerCase();
    
    if (roleLower === 'intern' || roleLower === 'employee') {
      recipientRoles = ['Team-admin', 'Team-Lead', 'admin', 'super-admin', 'Super-admin', 'developer'];
    } else if (roleLower === 'team-admin') {
      recipientRoles = ['Team-Lead', 'admin', 'super-admin', 'Super-admin', 'developer'];
    } else if (roleLower === 'team-lead') {
      recipientRoles = ['admin', 'super-admin', 'Super-admin', 'developer'];
    } else if (roleLower === 'admin') {
      recipientRoles = ['super-admin', 'Super-admin', 'developer'];
    } else {
      recipientRoles = ['Team-admin', 'Team-Lead', 'admin', 'super-admin', 'Super-admin', 'developer'];
    }
    
    const notifications = [];
    for (const dept of departments) {
      const EmployeeModel = createEmployeeModel(dept);
      const recipients = await EmployeeModel.find({ role: { $in: recipientRoles } });
      
      for (const recipient of recipients) {
        notifications.push({
          employeeId: recipient.employeeId,
          title: 'Late Login Alert',
          message: `${userRole || 'Employee'} ${employeeId} logged in late at ${loginTime}. Required: ${requiredTime}`,
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
    console.error('Notification failed:', err);
  }
};

async function handlePOST(req) {
  try {
    await connectMongoose();
    const data = await req.json();
    
    if (!data.date) data.date = new Date();
    if (!data.logIn) data.logIn = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    
    const requiredLoginTime = await getRequiredLoginTime();
    
    if (timeToMinutes(data.logIn) > timeToMinutes(requiredLoginTime)) {
      await notifyLateLogin(data.employeeId, data.logIn, requiredLoginTime, data.userRole);
      data.lateLogin = true;
      data.lateLoginMinutes = timeToMinutes(data.logIn) - timeToMinutes(requiredLoginTime);
    }
    
    const timecard = await Timecard.create(data);
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

    if (!_id) {
      return NextResponse.json({ error: "Timecard ID required" }, { status: 400 });
    }

    const timecard = await Timecard.findById(_id);
    if (!timecard) {
      return NextResponse.json({ error: "Timecard not found" }, { status: 404 });
    }

    if (updates.lunchOut && timecard.lunchIn) {
      return NextResponse.json({ error: "Lunch already completed" }, { status: 400 });
    }

    if (updates.breaks) {
      if (updates.breaks.length > MAX_BREAKS) {
        return NextResponse.json({ error: `Maximum ${MAX_BREAKS} breaks allowed` }, { status: 400 });
      }
      
      for (const b of updates.breaks) {
        if (b.breakOut && b.breakIn) {
          const duration = timeToMinutes(b.breakIn) - timeToMinutes(b.breakOut);
          if (duration > BREAK_DURATION) {
            return NextResponse.json({ error: `Break cannot exceed ${BREAK_DURATION} minutes` }, { status: 400 });
          }
        }
      }
    }

    if (updates.logOut) {
      if (timecard.lunchOut && !timecard.lunchIn) {
        return NextResponse.json({ error: "Complete lunch before logout" }, { status: 400 });
      }
      
      const incompleteBreaks = timecard.breaks?.filter(b => b.breakOut && !b.breakIn) || [];
      if (incompleteBreaks.length > 0) {
        return NextResponse.json({ error: "Complete all breaks before logout" }, { status: 400 });
      }
      
      const workMin = calculateWorkMinutes({ ...timecard.toObject(), ...updates });
      const requiredMin = (REQUIRED_WORK_HOURS * 60) + LUNCH_DURATION + BREAK_DURATION + GRACE_TIME;
      
      if (workMin < requiredMin) {
        return NextResponse.json({ 
          error: "Insufficient work hours",
          details: `Need ${requiredMin - workMin} more minutes (8h work + 1h lunch + 30min break + 1h grace = 10.5h total)`,
          workMinutes: workMin,
          requiredMinutes: requiredMin
        }, { status: 400 });
      }
    }

    const updated = await Timecard.findByIdAndUpdate(_id, { ...updates, updatedAt: new Date() }, { new: true });

    if (updates.logOut && timecard.employeeId) {
      try {
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

    return NextResponse.json({ timecard: updated });
  } catch (err) {
    console.error("PUT error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export const PUT = requireAuth(handlePUT);
