import mongoose from "mongoose";

const absenceSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  employeeName: { type: String, default: "" },
  department: { type: String, default: "" },
  absenceType: { 
    type: String, 
    enum: ["Sick Leave", "Casual Leave", "Emergency Leave", "Personal Leave", "Medical Leave", "Maternity Leave", "Paternity Leave"],
    required: true 
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalDays: { type: Number, default: 0 },
  reason: { type: String, required: true },
  status: { 
    type: String, 
    enum: ["Pending", "Approved", "Rejected", "Cancelled"],
    default: "Pending" 
  },
  approvedBy: { type: String, default: "" },
  approvalDate: { type: Date },
  rejectedBy: { type: String, default: "" },
  rejectionDate: { type: Date },
  cancelledBy: { type: String, default: "" },
  cancellationDate: { type: Date },
  cancellationReason: { type: String, default: "" },
  comments: { type: String, default: "" },
  isLOP: { type: Boolean, default: false }, // Loss of Pay
  actionHistory: [{
    action: { type: String, enum: ["Applied", "Approved", "Rejected", "Cancelled"] },
    actionBy: { type: String },
    actionDate: { type: Date, default: Date.now },
    remarks: { type: String, default: "" }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Calculate total days before saving
absenceSchema.pre("save", function (next) {
  if (this.startDate && this.endDate) {
    const diffTime = Math.abs(this.endDate - this.startDate);
    this.totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Absence || mongoose.model("Absence", absenceSchema);