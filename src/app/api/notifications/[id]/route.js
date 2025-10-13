import connectMongoose from "../../../utilis/connectMongoose";
import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  title: String,
  message: String,
  recipient: String,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);

export async function PATCH(request, { params }) {
  try {
    await connectMongoose();
    const { id } = await params;
    const data = await request.json();
    
    await Notification.findByIdAndUpdate(id, data);
    return Response.json({ message: "Notification updated successfully" });
  } catch (error) {
    return Response.json({ error: "Failed to update notification" }, { status: 500 });
  }
}