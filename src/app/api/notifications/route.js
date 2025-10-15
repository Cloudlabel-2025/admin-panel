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
    
    return Response.json({ notifications });
  } catch (error) {
    console.error('Error in notifications GET:', error);
    return Response.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectMongoose();
    const data = await request.json();
    
    const notification = new Notification(data);
    await notification.save();
    
    return Response.json({ message: "Notification created successfully" });
  } catch (error) {
    return Response.json({ error: "Failed to create notification" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectMongoose();
    const { _id, ...updates } = await request.json();
    
    const notification = await Notification.findByIdAndUpdate(_id, updates, { new: true });
    
    if (!notification) {
      return Response.json({ error: "Notification not found" }, { status: 404 });
    }
    
    return Response.json({ success: true, notification });
  } catch (error) {
    console.error('Error updating notification:', error);
    return Response.json({ error: "Failed to update notification" }, { status: 500 });
  }
}