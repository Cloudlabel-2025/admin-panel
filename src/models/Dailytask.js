import mongoose from "mongoose";
const DailyTaskSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  designation: { type: String, default: "" },

  date: { type: Date, default: Date.now },

  tasks: [
    {
      Serialno: { type: Number }, // Task number (1, 2, 3…)
      details: { type: String, required: true }, // Task description
      startTime: { type: String, default: "" }, // HH:mm AM/PM
      endTime: { type: String, default: "" },
      status: { type: String, enum: ["Completed", "Pending", "In Progress"], default: "In Progress" },
      remarks: { type: String, default: "" },
      link: { type: String, default: "" },
      feedback: { type: String, default: "" },
    },
  ],

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.DailyTask ||
  mongoose.model("DailyTask", DailyTaskSchema);
