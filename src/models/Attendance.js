import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  employeeName: { type: String, default: "" },
  department: { type: String, default: "" },
  date: { type: Date, required: true },
  status: { type: String, enum: ["Present", "Half Day", "Absent"], required: true },
  totalHours: { type: Number, default: 0 },
  permissionHours: { type: Number, default: 0 },
  loginTime: { type: String, default: "" },
  logoutTime: { type: String, default: "" },
  lunchDuration: { type: Number, default: 0 }, // in minutes
  overtimeHours: { type: Number, default: 0 },
  remarks: { type: String, default: "" },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export default mongoose.models.Attendance || mongoose.model("Attendance", AttendanceSchema);
