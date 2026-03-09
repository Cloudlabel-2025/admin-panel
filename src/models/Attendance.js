import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  employeeName: { type: String, default: "" },
  department: { type: String, default: "" },
  date: { type: Date, required: true },
  status: { type: String, enum: ["Present", "Half Day", "Absent", "Logout Missing", "In Office", "Leave", "Weekend", "Holiday"], required: true },
  leaveType: { type: String, default: "" },
  totalHours: { type: Number, default: 0 },
  permissionHours: { type: Number, default: 0 },
  loginTime: { type: String, default: "" },
  logoutTime: { type: String, default: "" },
  lunchDuration: { type: Number, default: 0 }, // in minutes
  overtimeHours: { type: Number, default: 0 },
  isLateLogin: { type: Boolean, default: false },
  lateByMinutes: { type: Number, default: 0 },
  remarks: { type: String, default: "" },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

AttendanceSchema.pre("save", function (next) {
  if (this.date) {
    this.date.setUTCHours(0, 0, 0, 0);
  }
  this.updatedAt = new Date();
  next();
});

AttendanceSchema.pre(["findOneAndUpdate", "updateOne"], function (next) {
  const update = this.getUpdate();
  if (update.date) {
    const d = new Date(update.date);
    d.setUTCHours(0, 0, 0, 0);
    update.date = d;
  }
  update.updatedAt = new Date();
  next();
});

export default mongoose.models.Attendance || mongoose.model("Attendance", AttendanceSchema);
