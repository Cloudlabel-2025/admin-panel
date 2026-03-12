import connectMongoose from "../../utilis/connectMongoose";
import DailyTask from "../../../models/Dailytask";
import { NextResponse } from "next/server";
import { getDateRangeForMonth } from "@/app/utilis/employeeUtils";
import mongoose from "mongoose";
import { requireAuth } from "../../utilis/authMiddleware";

// GET: fetch daily tasks or monthly report
async function handleGET(req) {
  try {
    await connectMongoose();
    const { searchParams } = new URL(req.url);
    const currentUser = req.user;

    const employeeId = searchParams.get("employeeId");
    const dateParam = searchParams.get("date");
    const month = parseInt(searchParams.get("month"));
    const year = parseInt(searchParams.get("year"));
    const admin = searchParams.get("admin"); // Admin monitoring

    // Admin monitoring - get all employees' tasks for today
    if (admin === "true") {
      const today = dateParam || new Date().toISOString().split("T")[0];
      const start = new Date(today + 'T00:00:00.000Z');
      const end = new Date(today + 'T23:59:59.999Z');
      
      const userRole = currentUser.role;
      const userDepartment = currentUser.department;

      let query = { date: { $gte: start, $lte: end } };

      // Determine target department for filtering
      const targetDepartment = (userRole === "Team-Lead" || userRole === "Team-admin") ? userDepartment : searchParams.get("department");

      if (targetDepartment) {
        try {
          const collections = Object.keys(mongoose.connection.collections).filter(name =>
            name.endsWith('_department')
          );

          let employeeIds = [];
          for (const collName of collections) {
            const collection = mongoose.connection.collections[collName];
            
            // Filter by department
            const empFilter = { department: targetDepartment };
            
            // For Team-admin, exclude Team-Leads
            if (userRole === "Team-admin") {
              empFilter.role = { $ne: "Team-Lead" };
            }
            
            const employees = await collection.find(empFilter).toArray();
            employeeIds.push(...employees.map(emp => emp.employeeId));
          }

          if (employeeIds.length > 0) {
            query.employeeId = { $in: employeeIds };
          } else {
            // No matching employees found for this role/department
            query.employeeId = "NONE"; 
          }
        } catch (err) {
          console.error('Error filtering by department:', err);
        }
      }

      const page = parseInt(searchParams.get("page")) || 1;
      const limit = parseInt(searchParams.get("limit")) || 10;
      const skip = (page - 1) * limit;

      const totalTasks = await DailyTask.countDocuments(query);
      const tasks = await DailyTask.find(query)
        .sort({ employeeId: 1, date: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // Add employee names to tasks if missing using direct database query
      const tasksWithNames = await Promise.all(
        tasks.map(async (task) => {
          if (!task.employeeName && task.employeeId) {
            try {
              const mongoose = await import('mongoose');
              const collections = Object.keys(mongoose.default.connection.collections).filter(name =>
                name.endsWith('_department')
              );

              let employee = null;
              for (const collName of collections) {
                const collection = mongoose.default.connection.collections[collName];
                const emp = await collection.findOne({ employeeId: task.employeeId });
                if (emp) {
                  employee = emp;
                  break;
                }
              }

              return {
                ...task,
                employeeName: employee ? `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'Unknown' : 'Unknown',
                designation: employee ? employee.designation || task.designation || 'N/A' : task.designation || 'N/A'
              };
            } catch (err) {
              console.error(`Error fetching employee ${task.employeeId}:`, err);
            }
          }
          return {
            ...task,
            employeeName: task.employeeName || 'Unknown',
            designation: task.designation || 'N/A'
          };
        })
      );

      return NextResponse.json({
        tasks: tasksWithNames,
        pagination: {
          totalTasks,
          totalPages: Math.ceil(totalTasks / limit),
          currentPage: page,
          limit
        }
      }, { status: 200 });
    }

    // Monthly report
    if (month && year) {
      // Fetch dynamic month start day from settings
      const Settings = mongoose.models.Settings || mongoose.model('Settings', new mongoose.Schema({ key: String, value: String }));
      const msdSetting = await Settings.findOne({ key: 'MONTH_START_DAY' });
      const monthStartDay = parseInt(msdSetting?.value || "26");

      const range = getDateRangeForMonth(year, month, monthStartDay);
      const start = range.startDate;
      const end = range.endDate;
      let query = { date: { $gte: start, $lte: end } };
      if (employeeId) query.employeeId = employeeId;

      const tasks = await DailyTask.find(query).sort({ date: 1 });
      return NextResponse.json(tasks, { status: 200 });
    }

    // Daily fetch for specific employee
    let query = {};
    if (employeeId) query.employeeId = employeeId;
    if (dateParam) {
      const start = new Date(dateParam + 'T00:00:00.000Z');
      const end = new Date(dateParam + 'T23:59:59.999Z');
      query.date = { $gte: start, $lte: end };
    } else if (employeeId && !month && !year) {
      // Get today's tasks only for employee
      const today = new Date().toISOString().split('T')[0];
      const start = new Date(today + 'T00:00:00.000Z');
      const end = new Date(today + 'T23:59:59.999Z');
      query.date = { $gte: start, $lte: end };
    }
    const tasks = await DailyTask.find(query).sort({ date: -1 }).limit(1);
    return NextResponse.json(tasks, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

export const GET = requireAuth(handleGET);

// POST: create or update DailyTask (upsert)
async function handlePOST(req) {
  try {
    await connectMongoose();
    const data = await req.json();

    if (!data.employeeId) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
    }

    // Validate task names (except for system entries)
    if (data.tasks && !data.isLogout && !data.isLunchOut && !data.isLunchIn && !data.isPermission && !data.isBreak) {
      const invalidTasks = data.tasks.filter(t => {
        if (t.isLogout || t.isLunchOut || t.isPermission || t.isBreak || t.details === 'Lunch break') return false;
        if (t.detailsLocked) return false; // Skip validation for already-saved tasks
        if (!t.details || t.details.trim() === '') return true;
        const alphabetCount = (t.details.match(/[a-zA-Z]/g) || []).length;
        if (alphabetCount < 19) return true;
        return false;
      });
      if (invalidTasks.length > 0) {
        return NextResponse.json({
          error: "All tasks must have at least 19 alphabetic characters. Lunch break and system entries are exempt."
        }, { status: 400 });
      }
    }

    // Handle lunch, break, and logout entries
    if (data.isLogout || data.isLunchOut || data.isLunchIn || data.isPermission || data.isBreak) {
      console.log('=== LUNCH/BREAK/LOGOUT/PERMISSION ENTRY ===');
      console.log('isLogout:', data.isLogout);
      console.log('isLunchOut:', data.isLunchOut);
      console.log('isLunchIn:', data.isLunchIn);
      console.log('isPermission:', data.isPermission);
      console.log('isBreak:', data.isBreak);
      console.log('Task:', data.task);

      const taskDate = data.date ? new Date(data.date) : new Date();
      const startOfDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
      const endOfDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate(), 23, 59, 59);

      const dailyTask = await DailyTask.findOne({
        employeeId: data.employeeId,
        date: { $gte: startOfDay, $lte: endOfDay }
      });

      if (dailyTask) {
        // If lunch in or break in, update the existing entry
        if (data.isLunchIn || data.isBreakIn) {
          console.log(`Processing ${data.isLunchIn ? 'lunch' : 'break'} in...`);
          console.log('Total tasks:', dailyTask.tasks.length);

          const entryToUpdate = dailyTask.tasks.slice().reverse().find(t =>
            (data.isLunchIn ? (t.isLunchOut || t.details === 'Lunch break') : (t.isBreak && !t.isLunchOut)) && !t.endTime
          );

          console.log('Found entry to update:', entryToUpdate ? 'YES' : 'NO');
          if (entryToUpdate) {
            console.log('Updating entry with end time');
            const inTime = data.task.match(/\d{2}:\d{2}/)?.[0] || '';
            entryToUpdate.endTime = inTime;
            entryToUpdate.status = 'Completed';
            if (data.isLunchIn) entryToUpdate.isLunchIn = true;
            if (data.isBreakIn) entryToUpdate.isBreakIn = true;

            // Add new task with in time as start time
            const maxSerial = dailyTask.tasks.length > 0
              ? Math.max(...dailyTask.tasks.map(t => t.Serialno || 0))
              : 0;

            if (inTime !== entryToUpdate.startTime) {
              dailyTask.tasks.push({
                Serialno: maxSerial + 1,
                details: '',
                status: 'In Progress',
                startTime: inTime,
                endTime: '',
                detailsLocked: false
              });
            }

            dailyTask.updatedAt = new Date();
            await dailyTask.save();
            return NextResponse.json({ message: "Entry updated and new task added", dailyTask }, { status: 200 });
          }

          console.log('No matching entry found to update');
          return NextResponse.json({ error: "No matching open entry found" }, { status: 404 });
        }

        // Add new entry only for lunch out or logout or permission
        console.log('Adding new entry for lunch out or logout or permission');

        const timeFromTask = data.task.match(/\d{2}:\d{2}/)?.[0] || '';

        // ATOMIC: Close previous open task if it exists
        if (dailyTask.tasks.length > 0 && timeFromTask) {
          const lastTask = dailyTask.tasks[dailyTask.tasks.length - 1];
          if (!lastTask.endTime || lastTask.endTime === '') {
            console.log('Closing previous open task:', lastTask.Serialno);
            lastTask.endTime = timeFromTask;
            lastTask.status = 'Completed';
            lastTask.detailsLocked = true;
          }
        }

        const maxSerial = dailyTask.tasks.length > 0
          ? Math.max(...dailyTask.tasks.map(t => t.Serialno || 0))
          : 0;

        // For permission, calculate duration display
        let taskDetails = data.task;
        if (data.isPermission) {
          const hours = Math.floor(data.permissionMinutes / 60);
          const mins = data.permissionMinutes % 60;
          taskDetails = `Permission: ${hours}h ${mins}m`;
        } else if (data.isLunchOut && !data.isBreak) {
          taskDetails = 'Lunch break';
        } else if (data.isBreak) {
          taskDetails = data.task || 'In Break';
        }

        dailyTask.tasks.push({
          Serialno: maxSerial + 1,
          details: taskDetails,
          status: data.status || ((data.isLunchOut || data.isBreak) ? 'In Progress' : 'Completed'),
          startTime: timeFromTask,
          endTime: '',
          detailsLocked: true,
          isLogout: data.isLogout || false,
          isLunchOut: data.isLunchOut || false,
          isPermission: data.isPermission || false,
          isBreak: data.isBreak || false
        });
        dailyTask.updatedAt = new Date();
        await dailyTask.save();
        console.log('New entry added successfully and previous task closed if open');
        return NextResponse.json({ message: "Entry added", dailyTask }, { status: 200 });
      }

      return NextResponse.json({ error: "No daily task found" }, { status: 404 });
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    // Find existing task for today or create new one
    const existingTask = await DailyTask.findOneAndUpdate(
      {
        employeeId: data.employeeId,
        date: { $gte: startOfDay, $lte: endOfDay }
      },
      {
        $set: {
          employeeName: data.employeeName,
          designation: data.designation,
          tasks: data.tasks.map(t => ({
            ...t,
            detailsLocked: t.details && t.details.trim() !== '' ? true : t.detailsLocked
          })),
          updatedAt: new Date()
        },
        $setOnInsert: {
          date: startOfDay,
          createdAt: new Date()
        }
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ message: "Daily Task saved", dailyTask: existingTask }, { status: 200 });
  } catch (err) {
    console.error('POST daily-task error:', err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

// PUT: update existing DailyTask or handle logout completion
async function handlePUT(req) {
  try {
    await connectMongoose();
    const body = await req.json();

    // Handle timeline updates for current task end time
    if (body.action === 'update_current_task_end') {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      const dailyTask = await DailyTask.findOne({
        employeeId: body.employeeId,
        date: { $gte: startOfDay, $lte: endOfDay }
      });

      if (dailyTask && dailyTask.tasks.length > 0) {
        // Find the last task without an end time
        const lastTask = dailyTask.tasks.slice().reverse().find(t => !t.endTime || t.endTime === '');
        if (lastTask && lastTask.startTime !== body.endTime) {
          lastTask.endTime = body.endTime;
          lastTask.status = 'Completed';
          await dailyTask.save();
          return NextResponse.json({ message: 'Current task end time updated', dailyTask });
        }
      }

      return NextResponse.json({ message: 'No current task to update' });
    }

    // Handle adding new task after break
    if (body.action === 'add_task_after_break') {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      const dailyTask = await DailyTask.findOne({
        employeeId: body.employeeId,
        date: { $gte: startOfDay, $lte: endOfDay }
      });

      if (dailyTask) {
        const maxSerial = dailyTask.tasks.length > 0
          ? Math.max(...dailyTask.tasks.map(t => t.Serialno || 0))
          : 0;

        dailyTask.tasks.push({
          Serialno: maxSerial + 1,
          details: '',
          status: 'In Progress',
          startTime: body.startTime,
          endTime: '',
          detailsLocked: false
        });

        await dailyTask.save();
        return NextResponse.json({ message: 'Task added after break', dailyTask });
      }

      return NextResponse.json({ message: 'No daily task found' });
    }

    // Handle first entry update on login
    if (body.action === 'update_first_entry') {
      console.log('=== DAILY TASK API: Received update_first_entry action ===');
      console.log('Body:', JSON.stringify(body));

      const taskDate = body.date ? new Date(body.date) : new Date();
      const startOfDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
      const endOfDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate(), 23, 59, 59);

      console.log('Searching for task between:', startOfDay, 'and', endOfDay);

      let dailyTask = await DailyTask.findOne({
        employeeId: body.employeeId,
        date: { $gte: startOfDay, $lte: endOfDay }
      });

      console.log('Found daily task:', dailyTask ? 'YES' : 'NO');

      // Create daily task if it doesn't exist
      if (!dailyTask) {
        console.log('Creating new daily task with login entry');
        dailyTask = await DailyTask.create({
          employeeId: body.employeeId,
          employeeName: body.employeeName,
          date: taskDate,
          tasks: [{
            Serialno: 1,
            details: body.task,
            status: 'In Progress',
            startTime: body.task.match(/\d{2}:\d{2}/)?.[0] || '',
            endTime: '',
            detailsLocked: false
          }]
        });
        console.log('Created new daily task:', dailyTask);
        return NextResponse.json({ message: 'Daily task created with login entry', dailyTask });
      }

      if (!dailyTask.tasks) dailyTask.tasks = [];

      if (dailyTask.tasks.length > 0) {
        console.log('First task before update:', dailyTask.tasks[0]);
        dailyTask.tasks[0].details = body.task;
        dailyTask.tasks[0].status = body.status || dailyTask.tasks[0].status || 'In Progress';
        dailyTask.tasks[0].startTime = body.task.match(/\d{2}:\d{2}/)?.[0] || dailyTask.tasks[0].startTime;
        dailyTask.updatedAt = new Date();
        await dailyTask.save();
        console.log('First task after update:', dailyTask.tasks[0]);
        return NextResponse.json({ message: 'First entry updated', dailyTask });
      }

      console.log('No tasks, creating first entry');
      dailyTask.tasks.push({
        Serialno: 1,
        details: body.task,
        status: 'In Progress',
        startTime: body.task.match(/\d{2}:\d{2}/)?.[0] || '',
        endTime: '',
        detailsLocked: false
      });
      await dailyTask.save();
      return NextResponse.json({ message: 'First entry created', dailyTask });
    }

    // Handle logout completion
    if (body.action === 'complete_on_logout') {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      const dailyTask = await DailyTask.findOneAndUpdate(
        {
          employeeId: body.employeeId,
          date: { $gte: startOfDay, $lte: endOfDay }
        },
        {
          $set: {
            'tasks.$[].detailsLocked': true,
            'tasks.$[elem].endTime': body.logoutTime
          }
        },
        {
          arrayFilters: [{ 'elem.endTime': { $in: ['', null] } }],
          new: true
        }
      );

      return NextResponse.json({ message: 'Tasks completed on logout', dailyTask });
    }

    // Regular update
    const { _id, ...updates } = body;
    if (!_id) {
      return NextResponse.json({ error: "Task ID is required for update" }, { status: 400 });
    }

    const dailyTask = await DailyTask.findByIdAndUpdate(_id, { ...updates, updatedAt: new Date() }, { new: true });
    if (!dailyTask) {
      return NextResponse.json({ error: "Daily Task not found" }, { status: 404 });
    }

    return NextResponse.json({ dailyTask });
  } catch (err) {
    console.error('PUT daily-task error:', err);
    return NextResponse.json({ error: err.message || "Failed to update" }, { status: 500 });
  }
}

export const POST = requireAuth(handlePOST);
export const PUT = requireAuth(handlePUT);
