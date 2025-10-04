import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ["Present", "Half Day", "Absent"], required: true },
  totalHours: { type: Number, default: 0 },
  permissionHours: { type: Number, default: 0 },
});

AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export default mongoose.models.Attendance || mongoose.model("Attendance", AttendanceSchema);
