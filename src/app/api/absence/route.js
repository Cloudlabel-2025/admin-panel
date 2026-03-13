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

// Helper to create notifications based on role hierarchy
async function createNotifications(employeeData, absence) {
  try {
    const Notification = mongoose.models.Notification;
    if (!Notification) {
      console.log('Notification model not found');
      return;
    }
    
    const notifications = [];
    const applicantRole = employeeData.role || 'Employee';
    console.log('Creating notifications for:', employeeData.name, 'Role:', applicantRole);
    
    // Get all department models
    const allDepartmentModels = Object.keys(mongoose.models).filter(name =>
      name.endsWith("_department")
    );
    
    // Role-based notification logic
    if (applicantRole === 'admin' || applicantRole === 'admin-management') {
      // admin/admin-management → super-admin only
      for (const modelName of allDepartmentModels) {
        const Model = mongoose.models[modelName];
        const superAdmins = await Model.find({ role: { $in: ["super-admin", "Super-admin"] } });
        
        for (const user of superAdmins) {
          notifications.push({
            recipientId: user.employeeId,
            recipientEmail: user.email,
            type: "leave_request",
            title: "Leave Request from Admin",
            message: `${employeeData.name} (Admin) has requested leave from ${new Date(absence.startDate).toLocaleDateString()} to ${new Date(absence.endDate).toLocaleDateString()}`,
            relatedId: absence._id,
            status: "unread"
          });
        }
      }
    } else if (applicantRole === 'Teamlead' || applicantRole === 'Team-Lead') {
      // Teamlead → super-admin + admin-management
      for (const modelName of allDepartmentModels) {
        const Model = mongoose.models[modelName];
        const approvers = await Model.find({ role: { $in: ["super-admin", "Super-admin", "admin-management"] } });
        
        for (const user of approvers) {
          notifications.push({
            recipientId: user.employeeId,
            recipientEmail: user.email,
            type: "leave_request",
            title: "Leave Request from Team Lead",
            message: `${employeeData.name} (Team Lead) from ${employeeData.department} has requested leave from ${new Date(absence.startDate).toLocaleDateString()} to ${new Date(absence.endDate).toLocaleDateString()}`,
            relatedId: absence._id,
            status: "unread"
          });
        }
      }
    } else if (applicantRole === 'Team-admin' || applicantRole === 'Team Admin') {
      // Team-admin → super-admin + admin-management + Team-lead (notification only)
      for (const modelName of allDepartmentModels) {
        const Model = mongoose.models[modelName];
        const approvers = await Model.find({ role: { $in: ["super-admin", "Super-admin", "admin-management"] } });
        
        for (const user of approvers) {
          notifications.push({
            recipientId: user.employeeId,
            recipientEmail: user.email,
            type: "leave_request",
            title: "Leave Request from Team Admin",
            message: `${employeeData.name} (Team Admin) from ${employeeData.department} has requested leave from ${new Date(absence.startDate).toLocaleDateString()} to ${new Date(absence.endDate).toLocaleDateString()}`,
            relatedId: absence._id,
            status: "unread"
          });
        }
      }
      
      // Notify Team-lead in same department
      const departmentModel = mongoose.models[`${employeeData.department}_department`];
      if (departmentModel) {
        const teamLeads = await departmentModel.find({ role: { $in: ["Teamlead", "Team-Lead"] } });
        for (const user of teamLeads) {
          notifications.push({
            recipientId: user.employeeId,
            recipientEmail: user.email,
            type: "leave_notification",
            title: "Team Admin Leave Request",
            message: `${employeeData.name} (Team Admin) has requested leave from ${new Date(absence.startDate).toLocaleDateString()} to ${new Date(absence.endDate).toLocaleDateString()}`,
            relatedId: absence._id,
            status: "unread"
          });
        }
      }
    } else if (applicantRole === 'Employee' || applicantRole === 'Intern') {
      // Employee/Intern → super-admin + admin-management + Team-admin + Team-lead (notification)
      for (const modelName of allDepartmentModels) {
        const Model = mongoose.models[modelName];
        const approvers = await Model.find({ role: { $in: ["super-admin", "Super-admin", "admin-management"] } });
        
        for (const user of approvers) {
          notifications.push({
            recipientId: user.employeeId,
            recipientEmail: user.email,
            type: "leave_request",
            title: `Leave Request from ${applicantRole}`,
            message: `${employeeData.name} (${applicantRole}) from ${employeeData.department} has requested leave from ${new Date(absence.startDate).toLocaleDateString()} to ${new Date(absence.endDate).toLocaleDateString()}`,
            relatedId: absence._id,
            status: "unread"
          });
        }
      }
      
      // Notify Team-admin and Team-lead in same department
      const departmentModel = mongoose.models[`${employeeData.department}_department`];
      if (departmentModel) {
        const teamManagers = await departmentModel.find({ role: { $in: ["Teamlead", "Team-Lead", "Team-admin", "Team Admin"] } });
        for (const user of teamManagers) {
          notifications.push({
            recipientId: user.employeeId,
            recipientEmail: user.email,
            type: "leave_notification",
            title: `${applicantRole} Leave Request`,
            message: `${employeeData.name} (${applicantRole}) has requested leave from ${new Date(absence.startDate).toLocaleDateString()} to ${new Date(absence.endDate).toLocaleDateString()}`,
            relatedId: absence._id,
            status: "unread"
          });
        }
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
        error: "Cannot apply for leave on past dates. Please select today or a future date." 
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
      const conflictingDates = existingAbsences.map(abs => 
        `${new Date(abs.startDate).toLocaleDateString()} to ${new Date(abs.endDate).toLocaleDateString()}`
      ).join(', ');
      
      return NextResponse.json({ 
        error: `You already have leave request(s) for overlapping dates: ${conflictingDates}. Please check your existing requests.` 
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
        
        // Determine attendance status based on leave type
        let attendanceStatus = "Leave";
        let remarks = `Leave: ${absence.reason || 'No reason provided'}`;
        
        if (absence.isHalfDay) {
          attendanceStatus = "Half Day Leave";
          remarks = `Half Day Leave (${absence.halfDayPeriod === 'first' ? 'Morning' : 'Afternoon'}): ${absence.reason || 'No reason provided'}`;
        }
        
        await Attendance.findOneAndUpdate(
          { employeeId: absence.employeeId, date: currentDate },
          {
            employeeId: absence.employeeId,
            employeeName: employeeData?.name || absence.employeeName || absence.employeeId,
            department: employeeData?.department || absence.department || "Unknown",
            date: currentDate,
            status: attendanceStatus,
            leaveType: absence.absenceType || "General",
            remarks: remarks,
            absenceId: _id, // Link to absence record
            halfDayPeriod: absence.isHalfDay ? absence.halfDayPeriod : undefined,
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
      
      // Delete leave attendance records linked to this absence (both full day and half day)
      await Attendance.deleteMany({
        employeeId: absence.employeeId,
        date: { $gte: startDate, $lte: endDate },
        status: { $in: ["Leave", "Half Day Leave"] },
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
