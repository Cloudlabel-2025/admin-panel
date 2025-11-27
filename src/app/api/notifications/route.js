import { NextResponse } from "next/server";


import connectMongoose from "../../utilis/connectMongoose";
import Notification from "../../../models/Notification";

export async function GET(request) {
  try {
    await connectMongoose();
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const status = searchParams.get('status');
    
    console.log('Fetching notifications for employeeId:', employeeId);
    
    let query = {};
    if (employeeId) query.employeeId = employeeId;
    if (status === 'read') query.isRead = true;
    if (status === 'unread') query.isRead = false;
    
    console.log('Notification query:', query);
    
    const notifications = await Notification.find(query).sort({ createdAt: -1 });
    console.log('Found notifications:', notifications.length);
    console.log('Notifications:', notifications);
    
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error in notifications GET:', error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectMongoose();
    const data = await request.json();
    
    // Handle bulk notifications
    if (data.notifications && Array.isArray(data.notifications)) {
      await Notification.insertMany(data.notifications);
      return NextResponse.json({ message: `${data.notifications.length} notifications created successfully` });
    }
    
    // Handle single notification
    const notification = new Notification(data);
    await notification.save();
    
    return NextResponse.json({ message: "Notification created successfully" });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectMongoose();
    const { _id, ...updates } = await request.json();
    
    const notification = await Notification.findByIdAndUpdate(_id, updates, { new: true });
    
    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}
