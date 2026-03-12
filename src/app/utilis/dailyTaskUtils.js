import connectMongoose from './connectMongoose';
import DailyTask from '@/models/Dailytask';

/**
 * Direct database operations for daily tasks
 * Used by server-side code (timecard service) to avoid authentication issues
 */
const updateDailyTaskDB = async (employeeId, date, taskData) => {
  try {
    await connectMongoose();
    
    const taskDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
    const endOfDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate(), 23, 59, 59);

    let dailyTask = await DailyTask.findOne({
      employeeId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (!dailyTask) {
      // Create new daily task if doesn't exist
      dailyTask = await DailyTask.create({
        employeeId,
        employeeName: taskData.employeeName || employeeId,
        designation: taskData.designation || '',
        date: startOfDay,
        tasks: []
      });
    }

    return { success: true, dailyTask };
  } catch (err) {
    console.error('Failed to update daily task DB:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Update first daily task entry (login)
 */
export const updateFirstTaskEntry = async (employeeId, employeeName, date, loginTime) => {
  try {
    const result = await updateDailyTaskDB(employeeId, date, { employeeName });
    if (!result.success) return result;

    const { dailyTask } = result;
    const timeFromTask = loginTime;

    if (dailyTask.tasks.length === 0) {
      // Create first task
      dailyTask.tasks.push({
        Serialno: 1,
        details: `Logged in at ${loginTime}`,
        status: 'In Progress',
        startTime: timeFromTask,
        endTime: '',
        detailsLocked: false
      });
    } else {
      // Update first task
      dailyTask.tasks[0].details = `Logged in at ${loginTime}`;
      dailyTask.tasks[0].startTime = timeFromTask;
    }

    dailyTask.updatedAt = new Date();
    await dailyTask.save();
    return { success: true, dailyTask };
  } catch (err) {
    console.error('Failed to update first task entry:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Add lunch out task
 */
export const addLunchOutTask = async (employeeId, employeeName, date, lunchOutTime) => {
  try {
    const result = await updateDailyTaskDB(employeeId, date, { employeeName });
    if (!result.success) return result;

    const { dailyTask } = result;
    const timeFromTask = lunchOutTime;

    // Close previous open task
    if (dailyTask.tasks.length > 0) {
      const lastTask = dailyTask.tasks[dailyTask.tasks.length - 1];
      if (!lastTask.endTime || lastTask.endTime === '') {
        lastTask.endTime = timeFromTask;
        lastTask.status = 'Completed';
        lastTask.detailsLocked = true;
      }
    }

    // Add lunch out entry
    const maxSerial = dailyTask.tasks.length > 0
      ? Math.max(...dailyTask.tasks.map(t => t.Serialno || 0))
      : 0;

    dailyTask.tasks.push({
      Serialno: maxSerial + 1,
      details: 'Lunch break',
      status: 'In Progress',
      startTime: timeFromTask,
      endTime: '',
      detailsLocked: true,
      isLunchOut: true
    });

    dailyTask.updatedAt = new Date();
    await dailyTask.save();
    return { success: true, dailyTask };
  } catch (err) {
    console.error('Failed to add lunch out task:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Add lunch in task
 */
export const addLunchInTask = async (employeeId, date, lunchInTime) => {
  try {
    const result = await updateDailyTaskDB(employeeId, date, {});
    if (!result.success) return result;

    const { dailyTask } = result;
    const timeFromTask = lunchInTime;

    // Find and update lunch entry
    const lunchEntry = dailyTask.tasks.slice().reverse().find(t =>
      (t.isLunchOut || t.details === 'Lunch break') && !t.endTime
    );

    if (lunchEntry) {
      lunchEntry.endTime = timeFromTask;
      lunchEntry.status = 'Completed';
      lunchEntry.isLunchIn = true;

      // Add new task after lunch
      const maxSerial = Math.max(...dailyTask.tasks.map(t => t.Serialno || 0));
      dailyTask.tasks.push({
        Serialno: maxSerial + 1,
        details: '',
        status: 'In Progress',
        startTime: timeFromTask,
        endTime: '',
        detailsLocked: false
      });
    }

    dailyTask.updatedAt = new Date();
    await dailyTask.save();
    return { success: true, dailyTask };
  } catch (err) {
    console.error('Failed to add lunch in task:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Add break out task
 */
export const addBreakOutTask = async (employeeId, employeeName, date, breakOutTime) => {
  try {
    const result = await updateDailyTaskDB(employeeId, date, { employeeName });
    if (!result.success) return result;

    const { dailyTask } = result;
    const timeFromTask = breakOutTime;

    // Close previous open task
    if (dailyTask.tasks.length > 0) {
      const lastTask = dailyTask.tasks[dailyTask.tasks.length - 1];
      if (!lastTask.endTime || lastTask.endTime === '') {
        lastTask.endTime = timeFromTask;
        lastTask.status = 'Completed';
        lastTask.detailsLocked = true;
      }
    }

    // Add break out entry
    const maxSerial = dailyTask.tasks.length > 0
      ? Math.max(...dailyTask.tasks.map(t => t.Serialno || 0))
      : 0;

    dailyTask.tasks.push({
      Serialno: maxSerial + 1,
      details: `Break started at ${breakOutTime}`,
      status: 'In Progress',
      startTime: timeFromTask,
      endTime: '',
      detailsLocked: true,
      isBreak: true,
      isBreakIn: false
    });

    dailyTask.updatedAt = new Date();
    await dailyTask.save();
    return { success: true, dailyTask };
  } catch (err) {
    console.error('Failed to add break out task:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Add break in task
 */
export const addBreakInTask = async (employeeId, employeeName, date, breakInTime) => {
  try {
    const result = await updateDailyTaskDB(employeeId, date, { employeeName });
    if (!result.success) return result;

    const { dailyTask } = result;
    const timeFromTask = breakInTime;

    // Find and update break entry
    const breakEntry = dailyTask.tasks.slice().reverse().find(t =>
      t.isBreak && !t.isLunchOut && !t.endTime
    );

    if (breakEntry) {
      breakEntry.endTime = timeFromTask;
      breakEntry.status = 'Completed';
      breakEntry.isBreakIn = true;

      // Add new task after break
      const maxSerial = Math.max(...dailyTask.tasks.map(t => t.Serialno || 0));
      dailyTask.tasks.push({
        Serialno: maxSerial + 1,
        details: '',
        status: 'In Progress',
        startTime: timeFromTask,
        endTime: '',
        detailsLocked: false
      });
    }

    dailyTask.updatedAt = new Date();
    await dailyTask.save();
    return { success: true, dailyTask };
  } catch (err) {
    console.error('Failed to add break in task:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Add permission task
 */
export const addPermissionTask = async (employeeId, employeeName, date, permissionMinutes) => {
  try {
    const result = await updateDailyTaskDB(employeeId, date, { employeeName });
    if (!result.success) return result;

    const { dailyTask } = result;
    const currentTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    // Close previous open task
    if (dailyTask.tasks.length > 0) {
      const lastTask = dailyTask.tasks[dailyTask.tasks.length - 1];
      if (!lastTask.endTime || lastTask.endTime === '') {
        lastTask.endTime = currentTime;
        lastTask.status = 'Completed';
        lastTask.detailsLocked = true;
      }
    }

    // Add permission entry
    const maxSerial = dailyTask.tasks.length > 0
      ? Math.max(...dailyTask.tasks.map(t => t.Serialno || 0))
      : 0;

    const hours = Math.floor(permissionMinutes / 60);
    const mins = permissionMinutes % 60;

    dailyTask.tasks.push({
      Serialno: maxSerial + 1,
      details: `Permission: ${hours}h ${mins}m`,
      status: 'Completed',
      startTime: currentTime,
      endTime: '',
      detailsLocked: true,
      isPermission: true
    });

    dailyTask.updatedAt = new Date();
    await dailyTask.save();
    return { success: true, dailyTask };
  } catch (err) {
    console.error('Failed to add permission task:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Add logout task
 */
export const addLogoutTask = async (employeeId, employeeName, date, logoutTime) => {
  try {
    const result = await updateDailyTaskDB(employeeId, date, { employeeName });
    if (!result.success) return result;

    const { dailyTask } = result;
    const timeFromTask = logoutTime;

    // Close previous open task
    if (dailyTask.tasks.length > 0) {
      const lastTask = dailyTask.tasks[dailyTask.tasks.length - 1];
      if (!lastTask.endTime || lastTask.endTime === '') {
        lastTask.endTime = timeFromTask;
        lastTask.status = 'Completed';
        lastTask.detailsLocked = true;
      }
    }

    // Add logout entry
    const maxSerial = dailyTask.tasks.length > 0
      ? Math.max(...dailyTask.tasks.map(t => t.Serialno || 0))
      : 0;

    dailyTask.tasks.push({
      Serialno: maxSerial + 1,
      details: `Logged out at ${logoutTime}`,
      status: 'Completed',
      startTime: timeFromTask,
      endTime: '',
      detailsLocked: true,
      isLogout: true
    });

    dailyTask.updatedAt = new Date();
    await dailyTask.save();
    return { success: true, dailyTask };
  } catch (err) {
    console.error('Failed to add logout task:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Complete tasks on logout
 */
export const completeTasksOnLogout = async (employeeId, logoutTime) => {
  try {
    const result = await updateDailyTaskDB(employeeId, new Date(), {});
    if (!result.success) return result;

    const { dailyTask } = result;

    // Lock all tasks and set end time for open tasks
    dailyTask.tasks.forEach(task => {
      task.detailsLocked = true;
      if (!task.endTime || task.endTime === '') {
        task.endTime = logoutTime;
        task.status = 'Completed';
      }
    });

    dailyTask.updatedAt = new Date();
    await dailyTask.save();
    return { success: true, dailyTask };
  } catch (err) {
    console.error('Failed to complete tasks on logout:', err);
    return { success: false, error: err.message };
  }
};
