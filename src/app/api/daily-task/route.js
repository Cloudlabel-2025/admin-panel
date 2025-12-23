import connectMongoose from "../../utilis/connectMongoose";


import DailyTask from "../../../models/Dailytask";
import { NextResponse } from "next/server";

// GET: fetch daily tasks or monthly report
export async function GET(req) {
  try {
    await connectMongoose();
    const { searchParams } = new URL(req.url);

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
      const department = searchParams.get("department");
      
      let query = { date: { $gte: start, $lte: end } };
      
      // If department filter is provided, filter by department
      if (department) {
        try {
          const mongoose = await import('mongoose');
          const collections = Object.keys(mongoose.default.connection.collections).filter(name => 
            name.endsWith('_department')
          );
          
          let employeeIds = [];
          for (const collName of collections) {
            const collection = mongoose.default.connection.collections[collName];
            const employees = await collection.find({ department }).toArray();
            employeeIds.push(...employees.map(emp => emp.employeeId));
          }
          
          if (employeeIds.length > 0) {
            query.employeeId = { $in: employeeIds };
          }
        } catch (err) {
          console.error('Error filtering by department:', err);
        }
      }
      
      const tasks = await DailyTask.find(query).sort({ employeeId: 1, date: -1 }).lean();
      
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
      
      return NextResponse.json(tasksWithNames, { status: 200 });
    }

    // Monthly report
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      let query = { date: { $gte: start, $lte: end } };
      if (employeeId) query.employeeId = employeeId;

      const tasks = await DailyTask.find(query).sort({ date: 1 });
      return NextResponse.json(tasks, { status: 200 });
    }

    // Daily fetch for specific employee
    let query = {};
    if (employeeId) query.employeeId = employeeId;
    if (dateParam) {
      const start = new Date(dateParam);
      const end = new Date(dateParam);
      end.setHours(23, 59, 59);
      query.date = { $gte: start, $lte: end };
    }
    const tasks = await DailyTask.find(query).sort({ date: -1 });
    return NextResponse.json(tasks, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

// POST: create or update DailyTask (upsert)
export async function POST(req) {
  try {
    await connectMongoose();
    const data = await req.json();
    
    if (!data.employeeId) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
    }
    
    // Handle lunch and logout entries
    if (data.isLogout || data.isLunchOut || data.isLunchIn) {
      console.log('=== LUNCH/LOGOUT ENTRY ===');
      console.log('isLogout:', data.isLogout);
      console.log('isLunchOut:', data.isLunchOut);
      console.log('isLunchIn:', data.isLunchIn);
      console.log('Task:', data.task);
      
      const taskDate = data.date ? new Date(data.date) : new Date();
      const startOfDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
      const endOfDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate(), 23, 59, 59);
      
      const dailyTask = await DailyTask.findOne({
        employeeId: data.employeeId,
        date: { $gte: startOfDay, $lte: endOfDay }
      });
      
      if (dailyTask) {
        // If lunch in, only update the existing lunch out entry
        if (data.isLunchIn) {
          console.log('Processing lunch in...');
          console.log('Total tasks:', dailyTask.tasks.length);
          const lunchOutEntry = dailyTask.tasks.slice().reverse().find(t => 
            (t.isLunchOut || t.details === 'Lunch break') && !t.endTime
          );
          console.log('Found lunch out entry:', lunchOutEntry ? 'YES' : 'NO');
          if (lunchOutEntry) {
            console.log('Updating lunch out entry with end time');
            const lunchInTime = data.task.match(/\d{2}:\d{2}/)?.[0] || '';
            lunchOutEntry.endTime = lunchInTime;
            lunchOutEntry.status = 'Completed';
            
            // Add new task with lunch in time as start time
            const maxSerial = dailyTask.tasks.length > 0 
              ? Math.max(...dailyTask.tasks.map(t => t.Serialno || 0))
              : 0;
            
            dailyTask.tasks.push({
              Serialno: maxSerial + 1,
              details: '',
              status: 'In Progress',
              startTime: lunchInTime,
              endTime: '',
              isSaved: false
            });
            
            dailyTask.updatedAt = new Date();
            await dailyTask.save();
            console.log('Lunch entry updated and new task added');
            return NextResponse.json({ message: "Lunch entry updated", dailyTask }, { status: 200 });
          }
          console.log('No lunch out entry found to update');
          return NextResponse.json({ error: "No lunch out entry found" }, { status: 404 });
        }
        
        // Add new entry only for lunch out or logout
        console.log('Adding new entry for lunch out or logout');
        const maxSerial = dailyTask.tasks.length > 0 
          ? Math.max(...dailyTask.tasks.map(t => t.Serialno || 0))
          : 0;
        
        dailyTask.tasks.push({
          Serialno: maxSerial + 1,
          details: data.isLunchOut ? 'Lunch break' : data.task,
          status: data.isLunchOut ? 'In Progress' : data.status,
          startTime: data.task.match(/\d{2}:\d{2}/)?.[0] || '',
          endTime: '',
          isSaved: true,
          isLogout: data.isLogout || false,
          isLunchOut: data.isLunchOut || false
        });
        dailyTask.updatedAt = new Date();
        await dailyTask.save();
        console.log('New entry added successfully');
        return NextResponse.json({ message: "Entry added", dailyTask }, { status: 200 });
      }
      
      return NextResponse.json({ error: "No daily task found" }, { status: 404 });
    }
    
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
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
          tasks: data.tasks,
          updatedAt: new Date()
        },
        $setOnInsert: {
          date: today,
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
export async function PUT(req) {
  try {
    await connectMongoose();
    const body = await req.json();
    
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
            status: 'Completed',
            startTime: body.task.match(/\d{2}:\d{2}/)?.[0] || '',
            endTime: '',
            isSaved: false
          }]
        });
        console.log('Created new daily task:', dailyTask);
        return NextResponse.json({ message: 'Daily task created with login entry', dailyTask });
      }
      
      if (!dailyTask.tasks) dailyTask.tasks = [];
      
      if (dailyTask.tasks.length > 0) {
        console.log('First task before update:', dailyTask.tasks[0]);
        dailyTask.tasks[0].details = body.task;
        dailyTask.tasks[0].status = 'Completed';
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
        status: 'Completed',
        startTime: body.task.match(/\d{2}:\d{2}/)?.[0] || '',
        endTime: '',
        isSaved: false
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
            'tasks.$[].isSaved': true,
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
