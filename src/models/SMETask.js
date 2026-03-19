import mongoose from "mongoose";

const SMETaskSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, index: true },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'SMESession', required: false },
  title: { type: String, required: true },
  description: { type: String },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    default: 'medium' 
  },
  status: { 
    type: String, 
    enum: ['pending', 'in-progress', 'completed'], 
    default: 'pending' 
  },
  timeSpent: { type: Number, default: 0 }, // in minutes
  startTime: { type: Date },
  endTime: { type: Date },
  date: { type: String, required: true }, // YYYY-MM-DD format
}, { timestamps: true });

// Compound index for efficient queries
SMETaskSchema.index({ employeeId: 1, date: 1 });
SMETaskSchema.index({ sessionId: 1 });

export default mongoose.models.SMETask || mongoose.model("SMETask", SMETaskSchema);