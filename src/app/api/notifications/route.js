import connectMongoose from "../../utilis/connectMongoose";
import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  title: String,
  message: String,
  recipient: String,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);

export async function GET(request) {
  try {
    await connectMongoose();
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    
    const notifications = await Notification.find({ recipient: role }).sort({ createdAt: -1 });
    return Response.json(notifications);
  } catch (error) {
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