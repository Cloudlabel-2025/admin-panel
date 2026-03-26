import mongoose from "mongoose";

const SMESessionSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, index: true },
  loginTime: { type: Date, required: true },
  logoutTime: { type: Date },
  totalDuration: { type: Number }, // in minutes
  totalBreakTime: { type: Number, default: 0 }, // in minutes
  totalLunchTime: { type: Number, default: 0 }, // in minutes
  netWorkingTime: { type: Number }, // in minutes
  status: { 
    type: String, 
    enum: ['active', 'break', 'lunch', 'completed'], 
    default: 'active' 
  },
  breaks: [{
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    duration: { type: Number }, // in minutes
    type: { type: String, enum: ['break', 'lunch'], required: true }
  }],
  tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SMETask' }],
  tasksAdded: { type: Number, default: 0 }, // total tasks ever added, never decremented
  date: { type: String, required: true }, // YYYY-MM-DD format
}, { timestamps: true });

// Compound index for efficient queries
SMESessionSchema.index({ employeeId: 1, date: 1 });

export default mongoose.models.SMESession || mongoose.model("SMESession", SMESessionSchema);