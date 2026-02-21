import mongoose from "mongoose";

const RegularizationSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  department: { type: String, required: true },
  attendanceId: { type: mongoose.Schema.Types.ObjectId, ref: "Attendance", required: true },
  date: { type: Date, required: true },
  
  currentStatus: { type: String, required: true },
  requestedStatus: { type: String, required: true },
  
  currentLoginTime: { type: String },
  requestedLoginTime: { type: String },
  currentLogoutTime: { type: String },
  requestedLogoutTime: { type: String },
  
  reason: { type: String, required: true },
  documentUrl: { type: String },
  
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
  approvedBy: { type: String },
  approvalDate: { type: Date },
  approverRemarks: { type: String },
  
  auditTrail: [{
    action: String,
    performedBy: String,
    timestamp: { type: Date, default: Date.now },
    changes: Object
  }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Regularization || mongoose.model("Regularization", RegularizationSchema);
