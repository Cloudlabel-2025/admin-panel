import Timecard from '@/models/Timecard';
import { calculateWorkMinutes, isLateLogin, calculateExtensionMinutes, timeToMinutes } from '@/app/utilis/timeUtils';
import { getRequiredLoginTime } from '@/app/utilis/settingsUtils';
import { notifyLateLogin, notifyExtension } from './notificationService';
import { createAttendanceOnLogin, updateAttendanceOnLogout } from './attendanceService';
import { updateFirstTaskEntry, addLunchOutTask, addLunchInTask, addBreakOutTask, addBreakInTask, addPermissionTask, addLogoutTask, completeTasksOnLogout } from '@/app/utilis/dailyTaskUtils';
import { calculateAttendanceStatus } from '@/app/utilis/employeeUtils';
import { TIME_CONSTANTS } from '@/app/utilis/constants';

/**
 * Handle login operation
 */
export const handleLogin = async (employeeId, date, logIn, userRole) => {
  try {
    // Check for existing timecard with login
    const dateStr = new Date(date).toISOString().split('T')[0];
    const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
    const endOfDay = new Date(dateStr + 'T23:59:59.999Z');

    const existingTimecard = await Timecard.findOne({
      employeeId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    // If timecard exists with login, reject
    if (existingTimecard && existingTimecard.logIn && logIn) {
      console.log(`[CRITICAL] DUPLICATE LOGIN BLOCKED: ${employeeId} at ${logIn}`);
      return {
        success: false,
        error: 'Already logged in today. Cannot login again.',
        timecard: existingTimecard,
        blocked: true,
        status: 400
      };
    }

    // If timecard exists but no login, update it
    if (existingTimecard && !existingTimecard.logIn && logIn) {
      existingTimecard.logIn = logIn;
      existingTimecard.userRole = userRole;

      const requiredLoginTime = await getRequiredLoginTime();
      if (isLateLogin(logIn, requiredLoginTime)) {
        const lateMinutes = timeToMinutes(logIn) - timeToMinutes(requiredLoginTime);
        await notifyLateLogin(employeeId, existingTimecard.employeeName || employeeId, logIn, requiredLoginTime, userRole);
        existingTimecard.lateLogin = true;
        existingTimecard.lateLoginMinutes = lateMinutes;
      }

      await existingTimecard.save();
      await updateFirstTaskEntry(employeeId, existingTimecard.employeeName || employeeId, date, logIn);

      return { success: true, timecard: existingTimecard, message: 'Logged in successfully' };
    }

    // Create new timecard
    const requiredLoginTime = await getRequiredLoginTime();
    const newTimecard = {
      employeeId,
      date,
      logIn,
      userRole
    };

    if (isLateLogin(logIn, requiredLoginTime)) {
      const lateMinutes = timeToMinutes(logIn) - timeToMinutes(requiredLoginTime);
      await notifyLateLogin(employeeId, employeeId, logIn, requiredLoginTime, userRole);
      newTimecard.lateLogin = true;
      newTimecard.lateLoginMinutes = lateMinutes;
    }

    const timecard = await Timecard.create(newTimecard);

    // Create attendance record
    await createAttendanceOnLogin(employeeId, date, logIn, newTimecard.lateLogin, newTimecard.lateLoginMinutes);

    // Update daily task
    await updateFirstTaskEntry(employeeId, employeeId, date, logIn);

    return { success: true, timecard, message: 'Timecard created' };
  } catch (err) {
    console.error('Login error:', err);
    return { success: false, error: err.message, status: 500 };
  }
};

/**
 * Handle permission update
 */
export const handlePermissionUpdate = async (timecardId, permissionMinutes, permissionReason, permissionLocked) => {
  try {
    const timecard = await Timecard.findById(timecardId);
    if (!timecard) {
      return { success: false, error: 'Timecard not found', status: 404 };
    }

    // Validate permission
    if (timecard.permissionLocked && permissionMinutes > 0) {
      return { success: false, error: 'Permission already locked, cannot update', status: 400 };
    }

    if (permissionMinutes > 0 && permissionMinutes < 30) {
      return { success: false, error: 'Permission must be at least 30 minutes', status: 400 };
    }

    // Check monthly permission limit
    if (permissionMinutes > 0 && !timecard.permissionLocked) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const monthlyPermissions = await Timecard.countDocuments({
        employeeId: timecard.employeeId,
        date: { $gte: startOfMonth, $lte: endOfMonth },
        permissionLocked: true,
        _id: { $ne: timecardId }
      });

      if (monthlyPermissions >= TIME_CONSTANTS.MAX_PERMISSIONS_PER_MONTH) {
        return {
          success: false,
          error: `Permission limit reached. You can only take permission ${TIME_CONSTANTS.MAX_PERMISSIONS_PER_MONTH} times per month.`,
          details: `You have already used ${monthlyPermissions} permissions this month.`,
          status: 400
        };
      }
    }

    // Handle permission removal
    if (permissionMinutes === 0) {
      timecard.permissionMinutes = 0;
      timecard.permissionReason = '';
      timecard.permissionLocked = false;
    } else {
      // Handle permission addition/update
      timecard.permissionMinutes = permissionMinutes;
      if (permissionReason !== undefined) {
        timecard.permissionReason = permissionReason;
      }
      if (permissionLocked !== undefined) {
        timecard.permissionLocked = permissionLocked;

        // Add permission entry to daily task when locked
        if (permissionLocked) {
          await addPermissionTask(timecard.employeeId, timecard.employeeName || timecard.employeeId, timecard.date, permissionMinutes);
        }
      }

      // Notify if permission exceeds limit
      if (permissionMinutes > TIME_CONSTANTS.PERMISSION_LIMIT) {
        const extension = permissionMinutes - TIME_CONSTANTS.PERMISSION_LIMIT;
        await notifyExtension(timecard.employeeId, timecard.employeeName || timecard.employeeId, 'Permission', extension, timecard.userRole);
      }
    }

    timecard.markModified('permissionMinutes');
    timecard.markModified('permissionReason');
    timecard.markModified('permissionLocked');
    await timecard.save();

    return { success: true, timecard };
  } catch (err) {
    console.error('Permission update error:', err);
    return { success: false, error: err.message, status: 500 };
  }
};

/**
 * Handle break update
 */
export const handleBreakUpdate = async (timecardId, breaks) => {
  try {
    const timecard = await Timecard.findById(timecardId);
    if (!timecard) {
      return { success: false, error: 'Timecard not found', status: 404 };
    }

    if (breaks.length > TIME_CONSTANTS.MAX_BREAKS) {
      return { success: false, error: `Maximum ${TIME_CONSTANTS.MAX_BREAKS} breaks allowed`, status: 400 };
    }

    const lastBreak = breaks[breaks.length - 1];

    // If break out (new break started)
    if (lastBreak?.breakOut && !lastBreak?.breakIn) {
      await addBreakOutTask(timecard.employeeId, timecard.employeeName || timecard.employeeId, timecard.date, lastBreak.breakOut);
    }

    // If break in (break completed)
    if (lastBreak?.breakOut && lastBreak?.breakIn) {
      const extension = calculateExtensionMinutes(lastBreak.breakOut, lastBreak.breakIn, TIME_CONSTANTS.BREAK_DURATION);
      if (extension > 0) {
        await notifyExtension(timecard.employeeId, timecard.employeeName || timecard.employeeId, 'Break', extension, timecard.userRole);
      }
      await addBreakInTask(timecard.employeeId, timecard.employeeName || timecard.employeeId, timecard.date, lastBreak.breakIn);
    }

    timecard.breaks = breaks;
    timecard.markModified('breaks');
    await timecard.save();

    return { success: true, timecard };
  } catch (err) {
    console.error('Break update error:', err);
    return { success: false, error: err.message, status: 500 };
  }
};

/**
 * Handle lunch update
 */
export const handleLunchUpdate = async (timecardId, lunchOut, lunchIn) => {
  try {
    const timecard = await Timecard.findById(timecardId);
    if (!timecard) {
      return { success: false, error: 'Timecard not found', status: 404 };
    }

    if (lunchOut && timecard.lunchIn) {
      return { success: false, error: 'Lunch already completed', status: 400 };
    }

    if (lunchOut && !timecard.lunchOut) {
      await addLunchOutTask(timecard.employeeId, timecard.employeeName || timecard.employeeId, timecard.date, lunchOut);
      timecard.lunchOut = lunchOut;
    }

    if (lunchIn && timecard.lunchOut) {
      const extension = calculateExtensionMinutes(timecard.lunchOut, lunchIn, TIME_CONSTANTS.LUNCH_DURATION);
      if (extension > 0) {
        await notifyExtension(timecard.employeeId, timecard.employeeName || timecard.employeeId, 'Lunch', extension, timecard.userRole);
      }
      await addLunchInTask(timecard.employeeId, timecard.date, lunchIn);
      timecard.lunchIn = lunchIn;
    }

    await timecard.save();
    return { success: true, timecard };
  } catch (err) {
    console.error('Lunch update error:', err);
    return { success: false, error: err.message, status: 500 };
  }
};

/**
 * Handle logout operation
 */
export const handleLogout = async (timecardId, logOut, autoLogoutReason, manualLogoutReason) => {
  try {
    const timecard = await Timecard.findById(timecardId);
    if (!timecard) {
      return { success: false, error: 'Timecard not found', status: 404 };
    }

    const workTime = calculateWorkMinutes({ ...timecard.toObject(), logOut });
    const permissionTime = timecard.permissionMinutes || 0;

    const attendanceStatus = calculateAttendanceStatus(workTime, permissionTime, true);

    let statusReason = '';
    if (attendanceStatus === 'Absent') {
      const effectiveMinutes = workTime + Math.min(permissionTime, 120);
      statusReason = `Effective work time ${Math.floor(effectiveMinutes / 60)}h ${effectiveMinutes % 60}m < 4 hours`;
    } else if (attendanceStatus === 'Half Day') {
      const effectiveMinutes = workTime + Math.min(permissionTime, 120);
      statusReason = `Effective work time ${Math.floor(effectiveMinutes / 60)}h ${effectiveMinutes % 60}m < 8 hours`;
    }

    timecard.logOut = logOut;
    timecard.attendanceStatus = attendanceStatus;
    timecard.statusReason = statusReason;
    timecard.workMinutes = workTime;
    if (autoLogoutReason) timecard.autoLogoutReason = autoLogoutReason;
    if (manualLogoutReason) timecard.manualLogoutReason = manualLogoutReason;

    timecard.markModified('autoLogoutReason');
    timecard.markModified('manualLogoutReason');
    await timecard.save();

    // Update attendance and daily tasks
    await updateAttendanceOnLogout(timecard, logOut, attendanceStatus, manualLogoutReason, autoLogoutReason);
    await addLogoutTask(timecard.employeeId, timecard.employeeName || timecard.employeeId, timecard.date, logOut);
    await completeTasksOnLogout(timecard.employeeId, logOut);

    return { success: true, timecard };
  } catch (err) {
    console.error('Logout error:', err);
    return { success: false, error: err.message, status: 500 };
  }
};
