import connectMongoose from '@/app/utilis/connectMongoose';
import Timecard from '@/models/Timecard';
import DailyTask from '@/models/Dailytask';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/app/utilis/authMiddleware';

async function handleGET(req) {
  try {
    await connectMongoose();
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID required' }, { status: 400 });
    }

    // Get timecard for the date
    const startOfDay = new Date(date + 'T00:00:00.000Z');
    const endOfDay = new Date(date + 'T23:59:59.999Z');

    const timecard = await Timecard.findOne({
      employeeId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    // Get daily task for the date
    const dailyTask = await DailyTask.findOne({
      employeeId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    // Analysis
    const analysis = {
      date,
      employeeId,
      timecard: timecard ? {
        _id: timecard._id,
        logIn: timecard.logIn,
        logOut: timecard.logOut,
        lunchOut: timecard.lunchOut,
        lunchIn: timecard.lunchIn,
        breaks: timecard.breaks,
        permissionMinutes: timecard.permissionMinutes,
        permissionLocked: timecard.permissionLocked,
        totalHours: timecard.totalHours
      } : null,
      dailyTask: dailyTask ? {
        _id: dailyTask._id,
        totalTasks: dailyTask.tasks.length,
        tasks: dailyTask.tasks.map(t => ({
          Serialno: t.Serialno,
          details: t.details,
          startTime: t.startTime,
          endTime: t.endTime,
          status: t.status,
          isLogout: t.isLogout || false,
          isLunchOut: t.isLunchOut || false,
          isLunchIn: t.isLunchIn || false,
          isBreak: t.isBreak || false,
          isBreakIn: t.isBreakIn || false,
          isPermission: t.isPermission || false,
          detailsLocked: t.detailsLocked || false
        }))
      } : null,
      issues: []
    };

    // Check for issues
    if (!timecard) {
      analysis.issues.push('No timecard found for this date');
    }

    if (!dailyTask) {
      analysis.issues.push('No daily task found for this date');
    }

    if (timecard && dailyTask) {
      // Check if login is reflected
      const loginTask = dailyTask.tasks.find(t => t.details?.includes('Logged in'));
      if (timecard.logIn && !loginTask) {
        analysis.issues.push('Login time in timecard but no login task in daily task');
      }

      // Check if lunch out is reflected
      const lunchOutTask = dailyTask.tasks.find(t => t.isLunchOut || t.details === 'Lunch break');
      if (timecard.lunchOut && !lunchOutTask) {
        analysis.issues.push('Lunch out in timecard but no lunch out task in daily task');
      }

      // Check if lunch in is reflected
      const lunchInTask = dailyTask.tasks.find(t => t.isLunchIn);
      if (timecard.lunchIn && !lunchInTask) {
        analysis.issues.push('Lunch in in timecard but lunch task not completed in daily task');
      }

      // Check if breaks are reflected
      if (timecard.breaks && timecard.breaks.length > 0) {
        const breakTasks = dailyTask.tasks.filter(t => t.isBreak);
        if (breakTasks.length === 0) {
          analysis.issues.push(`${timecard.breaks.length} break(s) in timecard but no break tasks in daily task`);
        } else if (breakTasks.length !== timecard.breaks.length) {
          analysis.issues.push(`Break count mismatch: ${timecard.breaks.length} in timecard, ${breakTasks.length} in daily task`);
        }
      }

      // Check if permission is reflected
      const permissionTask = dailyTask.tasks.find(t => t.isPermission);
      if (timecard.permissionMinutes > 0 && timecard.permissionLocked && !permissionTask) {
        analysis.issues.push('Permission in timecard but no permission task in daily task');
      }

      // Check if logout is reflected
      const logoutTask = dailyTask.tasks.find(t => t.isLogout || t.details?.includes('Logged out'));
      if (timecard.logOut && !logoutTask) {
        analysis.issues.push('Logout time in timecard but no logout task in daily task');
      }
    }

    if (analysis.issues.length === 0) {
      analysis.issues.push('No issues found - data is synchronized');
    }

    return NextResponse.json(analysis, { status: 200 });
  } catch (err) {
    console.error('Debug API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const GET = requireAuth(handleGET);
