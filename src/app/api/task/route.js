import connectMongoose from "../../utilis/connectMongoose";
import Task from "../../../models/Task";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

// Helper function to find employee across all department collections
async function findEmployeeByIdAndDepartment(employeeId, department) {
  try {
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => mongoose.connection.once('connected', resolve));
    }
    const db = mongoose.connection.db;
    const collectionName = `${department.toLowerCase()}_department`;
    const collection = db.collection(collectionName);
    const employee = await collection.findOne({ employeeId });
    console.log(`Found employee in ${collectionName}:`, employee);
    return employee;
  } catch (error) {
    console.error('Error finding employee:', error);
    return null;
  }
}

// GET: fetch tasks
export async function GET(req) {
  try {
    await connectMongoose();
    
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => mongoose.connection.once('connected', resolve));
    }
    
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const admin = searchParams.get("admin");

    let query = {};
    if (employeeId && !admin) {
      query.employeeId = employeeId;
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 });
    return NextResponse.json(tasks, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

// POST: create tasks from Excel upload with validation
export async function POST(req) {
  try {
    await connectMongoose();
    const { tasks } = await req.json();

    if (!tasks || !Array.isArray(tasks)) {
      return NextResponse.json({ error: "Invalid tasks data" }, { status: 400 });
    }

    const result = {
      totalRows: tasks.length,
      insertedCount: 0,
      skippedCount: 0,
      duplicatesCount: 0,
      failedRows: []
    };

    for (let i = 0; i < tasks.length; i++) {
      const row = tasks[i];
      const rowNumber = i + 1;

      try {
        // Validate required fields
        if (!row.employeeId || !row.department || !row.client || !row.taskName) {
          result.failedRows.push({
            rowNumber,
            reason: "Missing required fields: employeeId, department, client, or taskName",
            data: row
          });
          result.skippedCount++;
          continue;
        }

        // Find employee in department collection
        const employee = await findEmployeeByIdAndDepartment(row.employeeId, row.department);
        if (!employee) {
          result.failedRows.push({
            rowNumber,
            reason: `Employee with ID ${row.employeeId} not found in ${row.department} department`,
            data: row
          });
          result.skippedCount++;
          continue;
        }

        // Parse dates
        const parseDate = (dateValue) => {
          if (!dateValue) return null;
          const date = new Date(dateValue);
          return isNaN(date.getTime()) ? null : date;
        };

        const startDate = parseDate(row.startDate);
        
        // Check for duplicates
        const existingTask = await Task.findOne({
          employeeId: row.employeeId,
          taskName: row.taskName,
          startDate: startDate
        });

        if (existingTask) {
          result.duplicatesCount++;
          continue;
        }

        // Clean status
        const cleanStatus = (status) => {
          if (!status) return "Yet to start";
          const cleaned = status.toString().trim().toLowerCase();
          if (cleaned.includes('progress')) return "In progress";
          if (cleaned.includes('review')) return "In-review";
          if (cleaned.includes('completed')) return "completed";
          if (cleaned.includes('hold')) return "On hold";
          if (cleaned.includes('yet') || cleaned.includes('start')) return "Yet to start";
          return "Yet to start";
        };

        // Create task using DB employee data
        const taskData = {
          employeeId: row.employeeId,
          department: employee.department,
          name: `${employee.firstName} ${employee.lastName}`,
          client: row.client,
          module: row.module || "",
          topic: row.topic || "",
          taskName: row.taskName,
          startDate: startDate,
          expectedendDate: parseDate(row.expectedendDate),
          actualendDate: parseDate(row.actualendDate),
          assignedBy: row.assignedBy || "Admin",
          reviewedBy: row.reviewedBy || "",
          status: cleanStatus(row.status),
          remarks: row.remarks || ""
        };

        console.log("Creating task for employee:", row.employeeId, "Task:", taskData);
        const createdTask = await Task.create(taskData);
        console.log("Task created successfully:", createdTask._id);
        result.insertedCount++;

        // Send notification
        try {
          await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              notifications: [{
                employeeId: row.employeeId,
                title: 'New Task Assigned',
                message: `You have been assigned a new task: ${row.taskName}`,
                type: 'info',
                isRead: false
              }]
            })
          });
        } catch (notifError) {
          console.log('Notification failed for task:', row.taskName);
        }

      } catch (error) {
        result.failedRows.push({
          rowNumber,
          reason: error.message,
          data: row
        });
        result.skippedCount++;
      }
    }

    return NextResponse.json({
      ...result,
      message: `Upload completed: ${result.insertedCount} inserted, ${result.skippedCount} skipped, ${result.duplicatesCount} duplicates`,
      failedRows: result.failedRows
    }, { status: 200 });
  } catch (err) {
    console.error('Task creation error:', err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

// PUT: update task
export async function PUT(req) {
  try {
    await connectMongoose();
    const { _id, ...updates } = await req.json();
    
    if (!_id) {
      return NextResponse.json({ error: "Task ID required" }, { status: 400 });
    }

    const task = await Task.findByIdAndUpdate(_id, updates, { new: true });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to update" }, { status: 500 });
  }
}