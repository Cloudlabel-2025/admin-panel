import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["info", "success", "warning", "error"],
    default: "info",
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Force recreate model to apply schema changes
if (mongoose.models.Notification) {
  delete mongoose.models.Notification;
}

export default mongoose.model("Notification", notificationSchema);