import mongoose from "mongoose";
const DailyTaskSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  designation: { type: String, default: "" },
  date: { type: Date, default: Date.now },

  tasks: [
    {
      Serialno: { type: Number },
      details: { type: String, default: "" },
      startTime: { type: String, default: "" },
      endTime: { type: String, default: "" },
      status: { type: String, enum: ["Completed", "Pending", "In Progress", "On Hold", "Blocked"], default: "In Progress" },
      remarks: { type: String, default: "" },
      link: { type: String, default: "" },
      feedback: { type: String, default: "" },
      isSaved: { type: Boolean, default: false },
      isNewTask: { type: Boolean, default: false },
      isLogout: { type: Boolean, default: false },
      isLunchOut: { type: Boolean, default: false },
      isPermission: { type: Boolean, default: false }
    },
  ],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.DailyTask ||
  mongoose.model("DailyTask", DailyTaskSchema);
