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
    console.error('GET /api/absence error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectMongoose();
    const data = await req.json();
    
    // RULE 1: Validate that dates are not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(data.startDate);
    startDate.setHours(0, 0, 0, 0);
    
    if (startDate < today) {
      return NextResponse.json({ 
        error: "Cannot apply for leave on past dates. Please select a future date." 
      }, { status: 400 });
    }
    
    // Validate end date is not before start date
    const endDate = new Date(data.endDate);
    endDate.setHours(0, 0, 0, 0);
    
    if (endDate < startDate) {
      return NextResponse.json({ 
        error: "End date cannot be before start date." 
      }, { status: 400 });
    }
    
    // Check for date conflicts with existing leave requests
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
    
    // Add action history for application
    data.actionHistory = [{
      action: "Applied",
      actionBy: data.employeeId,
      actionDate: new Date(),
      remarks: "Leave application submitted"
    }];
    
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
    const { _id, action, approvedBy, cancellationReason, ...updates } = await req.json();
    
    const absence = await Absence.findById(_id);
    if (!absence) {
      return NextResponse.json({ error: "Absence record not found" }, { status: 404 });
    }
    
    const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', new mongoose.Schema({
      employeeId: String,
      employeeName: String,
      department: String,
      date: Date,
      status: String,
      leaveType: String,
      remarks: String,
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }));
    
    if (action === "approve") {
      // RULE 3: Approved leave must reflect in attendance
      updates.status = "Approved";
      updates.approvalDate = new Date();
      updates.approvedBy = approvedBy;
      
      // Add to action history
      absence.actionHistory = absence.actionHistory || [];
      absence.actionHistory.push({
        action: "Approved",
        actionBy: approvedBy,
        actionDate: new Date(),
        remarks: updates.comments || "Leave approved"
      });
      updates.actionHistory = absence.actionHistory;
      
      await updateNotifications(_id, approvedBy);
      
      // Create attendance records for approved leave
      const employeeData = await getEmployeeData(absence.employeeId);
      const startDate = new Date(absence.startDate);
      const endDate = new Date(absence.endDate);
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const currentDate = new Date(d);
        currentDate.setHours(0, 0, 0, 0);
        
        await Attendance.findOneAndUpdate(
          { employeeId: absence.employeeId, date: currentDate },
          {
            employeeId: absence.employeeId,
            employeeName: employeeData?.name || absence.employeeName || absence.employeeId,
            department: employeeData?.department || absence.department || "Unknown",
            date: currentDate,
            status: "Leave",
            leaveType: absence.absenceType || "General",
            remarks: `Leave: ${absence.reason || 'No reason provided'}`,
            absenceId: _id, // Link to absence record
            updatedAt: new Date()
          },
          { upsert: true, new: true }
        );
      }
    } else if (action === "reject") {
      updates.status = "Rejected";
      updates.rejectionDate = new Date();
      updates.rejectedBy = approvedBy;
      
      // Add to action history
      absence.actionHistory = absence.actionHistory || [];
      absence.actionHistory.push({
        action: "Rejected",
        actionBy: approvedBy,
        actionDate: new Date(),
        remarks: updates.comments || "Leave rejected"
      });
      updates.actionHistory = absence.actionHistory;
    } else if (action === "cancel") {
      // REQUIREMENT: Allow cancellation for Pending or Approved status
      if (absence.status !== "Approved" && absence.status !== "Pending") {
        return NextResponse.json({ 
          error: "Only pending or approved leave can be cancelled" 
        }, { status: 400 });
      }
      
      updates.status = "Cancelled";
      updates.cancellationDate = new Date();
      updates.cancelledBy = approvedBy;
      updates.cancellationReason = cancellationReason || "Cancelled by employee";
      
      // Add to action history
      absence.actionHistory = absence.actionHistory || [];
      absence.actionHistory.push({
        action: "Cancelled",
        actionBy: approvedBy,
        actionDate: new Date(),
        remarks: cancellationReason || "Leave cancelled"
      });
      updates.actionHistory = absence.actionHistory;
      
      // Send notification to admins about cancellation
      const Notification = mongoose.models.Notification;
      if (Notification) {
        const employeeData = await getEmployeeData(absence.employeeId);
        const notifications = [];
        
        // Get all admin and super-admin users
        const allDepartmentModels = Object.keys(mongoose.models).filter(name =>
          name.endsWith("_department")
        );
        
        for (const modelName of allDepartmentModels) {
          const Model = mongoose.models[modelName];
          const adminUsers = await Model.find({
            role: { $in: ["admin", "super-admin", "Team-Lead", "Team-admin"] }
          });
          
          for (const user of adminUsers) {
            notifications.push({
              recipientId: user.employeeId,
              recipientEmail: user.email,
              type: "leave_cancelled",
              title: "Leave Cancelled",
              message: `${employeeData?.name || absence.employeeName} has cancelled their leave from ${new Date(absence.startDate).toLocaleDateString()} to ${new Date(absence.endDate).toLocaleDateString()}`,
              relatedId: _id,
              status: "unread"
            });
          }
        }
        
        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
        }
      }
      
      // REQUIREMENT: Remove leave attendance records for cancelled leave
      const startDate = new Date(absence.startDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(absence.endDate);
      endDate.setHours(0, 0, 0, 0);
      
      // Delete leave attendance records linked to this absence
      await Attendance.deleteMany({
        employeeId: absence.employeeId,
        date: { $gte: startDate, $lte: endDate },
        status: "Leave",
        absenceId: _id
      });
      
      // REQUIREMENT: Recalculate attendance based on actual login activity
      // Check if employee has timecard entries for these dates
      const Timecard = mongoose.models.Timecard;
      if (Timecard) {
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const currentDate = new Date(d);
          currentDate.setHours(0, 0, 0, 0);
          
          // Check if employee logged in on this date
          const timecardEntry = await Timecard.findOne({
            employeeId: absence.employeeId,
            date: currentDate
          });
          
          if (timecardEntry && timecardEntry.loginTime) {
            // Employee was present - create/update attendance as Present
            const employeeData = await getEmployeeData(absence.employeeId);
            await Attendance.findOneAndUpdate(
              { employeeId: absence.employeeId, date: currentDate },
              {
                employeeId: absence.employeeId,
                employeeName: employeeData?.name || absence.employeeName || absence.employeeId,
                department: employeeData?.department || absence.department || "Unknown",
                date: currentDate,
                status: "Present",
                remarks: "Recalculated after leave cancellation",
                updatedAt: new Date()
              },
              { upsert: true, new: true }
            );
          }
          // If no timecard entry, leave as Absent (no attendance record)
        }
      }
    }
    
    const updatedAbsence = await Absence.findByIdAndUpdate(_id, updates, { new: true });
    
    return NextResponse.json({ success: true, absence: updatedAbsence });
  } catch (err) {
    console.error('Error in absence PUT:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
