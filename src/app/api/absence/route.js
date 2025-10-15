import { NextResponse } from "next/server";
import Absence from "@/models/Absence";
import connectMongoose from "@/app/utilis/connectMongoose";
import mongoose from "mongoose";

// Helper to get employee data and department
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
          email: employee.email
        };
      }
    }
  } catch (error) {
    console.error('Error fetching employee:', error);
  }
  return null;
}

// Helper to create notifications
async function createNotifications(employeeData, absence) {
  try {
    const Notification = mongoose.models.Notification;
    if (!Notification) {
      console.log('Notification model not found');
      return;
    }
    
    const notifications = [];
    console.log('Creating notifications for department:', employeeData.department);
    
    // Get department team-lead and team-admin
    const departmentModel = mongoose.models[`${employeeData.department}_department`];
    if (departmentModel) {
      const departmentUsers = await departmentModel.find({
        role: { $in: ["Team-Lead", "Team-admin"] }
      });
      console.log('Department users found:', departmentUsers.length);
      
      for (const user of departmentUsers) {
        console.log('Adding department notification for:', user.employeeId, user.email, user.role);
        notifications.push({
          recipientId: user.employeeId,
          recipientEmail: user.email,
          type: "leave_request",
          title: "New Leave Request",
          message: `${employeeData.name} has requested leave from ${absence.startDate} to ${absence.endDate}`,
          relatedId: absence._id,
          status: "unread"
        });
      }
    }
    
    // Get admin and super-admin users
    const allDepartmentModels = Object.keys(mongoose.models).filter(name =>
      name.endsWith("_department")
    );
    
    for (const modelName of allDepartmentModels) {
      const Model = mongoose.models[modelName];
      const adminUsers = await Model.find({
        role: { $in: ["admin", "super-admin"] }
      });
      console.log(`Admin users in ${modelName}:`, adminUsers.length);
      
      for (const user of adminUsers) {
        console.log('Adding admin notification for:', user.employeeId, user.email, user.role);
        notifications.push({
          recipientId: user.employeeId,
          recipientEmail: user.email,
          type: "leave_request",
          title: "New Leave Request",
          message: `${employeeData.name} from ${employeeData.department} has requested leave from ${absence.startDate} to ${absence.endDate}`,
          relatedId: absence._id,
          status: "unread"
        });
      }
    }
    
    console.log('Total notifications to create:', notifications.length);
    
    // Create all notifications
    if (notifications.length > 0) {
      const result = await Notification.insertMany(notifications);
      console.log('Notifications created successfully:', result.length);
    }
  } catch (error) {
    console.error('Error creating notifications:', error);
  }
}

// Helper to update notifications when leave is approved
async function updateNotifications(absenceId, approvedBy) {
  try {
    const Notification = mongoose.models.Notification;
    if (!Notification) return;
    
    // Mark all related notifications as read and add approval info
    await Notification.updateMany(
      { relatedId: absenceId, type: "leave_request" },
      { 
        status: "read",
        message: { $concat: ["$message", ` - Approved by ${approvedBy}`] }
      }
    );
  } catch (error) {
    console.error('Error updating notifications:', error);
  }
}

export async function GET(req) {
  try {
    await connectMongoose();
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");
    
    let query = {};
    if (employeeId) query.employeeId = employeeId;
    if (status) query.status = status;
    
    const absences = await Absence.find(query).sort({ createdAt: -1 });
    return NextResponse.json(absences);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectMongoose();
    const data = await req.json();
    
    // Check for date conflicts
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    
    const existingAbsences = await Absence.find({
      employeeId: data.employeeId,
      status: { $in: ["Pending", "Approved"] },
      $or: [
        {
          startDate: { $lte: endDate },
          endDate: { $gte: startDate }
        }
      ]
    });
    
    if (existingAbsences.length > 0) {
      return NextResponse.json({ 
        error: "You already have a leave request for overlapping dates. Please check your existing requests." 
      }, { status: 400 });
    }
    
    const absence = await Absence.create(data);
    console.log('Absence created:', absence._id);
    
    // Get employee data and create notifications
    const employeeData = await getEmployeeData(data.employeeId);
    console.log('Employee data:', employeeData);
    if (employeeData) {
      await createNotifications(employeeData, absence);
      console.log('Notifications created for absence:', absence._id);
    }
    
    return NextResponse.json({ success: true, absence });
  } catch (err) {
    console.error('Error in absence POST:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await connectMongoose();
    const { _id, action, approvedBy, ...updates } = await req.json();
    
    if (action === "approve") {
      updates.status = "Approved";
      updates.approvalDate = new Date();
      updates.approvedBy = approvedBy;
      
      // Update notifications
      await updateNotifications(_id, approvedBy);
    } else if (action === "reject") {
      updates.status = "Rejected";
      updates.approvalDate = new Date();
      updates.rejectedBy = approvedBy;
    }
    
    const absence = await Absence.findByIdAndUpdate(_id, updates, { new: true });
    
    if (!absence) {
      return NextResponse.json({ error: "Absence record not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, absence });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}