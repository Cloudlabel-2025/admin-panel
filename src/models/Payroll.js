import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, index: true },
  employeeName: { type: String, required: true },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  payPeriod: { type: String, required: true }, // "2024-01" format
  
  // Salary Structure
  grossSalary: { type: Number, required: true },
  basicSalary: { type: Number, required: true },
  hra: { type: Number, default: 0 },
  da: { type: Number, default: 0 },
  conveyance: { type: Number, default: 0 },
  medical: { type: Number, default: 0 },
  specialAllowance: { type: Number, default: 0 },
  
  // Variable Components
  bonus: { type: Number, default: 0 },
  incentive: { type: Number, default: 0 },
  overtimePay: { type: Number, default: 0 },
  holidayPay: { type: Number, default: 0 },
  
  // Attendance Data
  workingDays: { type: Number, required: true },
  presentDays: { type: Number, required: true },
  absentDays: { type: Number, default: 0 },
  halfDays: { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },
  
  // Deductions
  pf: { type: Number, default: 0 },
  esi: { type: Number, default: 0 },
  professionalTax: { type: Number, default: 0 },
  incomeTax: { type: Number, default: 0 },
  lopDeduction: { type: Number, default: 0 },
  loanDeduction: { type: Number, default: 0 },
  advanceDeduction: { type: Number, default: 0 },
  otherDeductions: { type: Number, default: 0 },
  
  // Calculated Totals
  totalEarnings: { type: Number, required: true },
  totalDeductions: { type: Number, required: true },
  netPay: { type: Number, required: true },
  
  // Status & Metadata
  status: { type: String, enum: ['Draft', 'Approved', 'Paid'], default: 'Draft' },
  approvedBy: { type: String, default: null },
  approvedAt: { type: Date, default: null },
  paidAt: { type: Date, default: null },
  
  // Audit Trail
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for better performance
payrollSchema.index({ employeeId: 1, payPeriod: 1 }, { unique: true });
payrollSchema.index({ department: 1 });
payrollSchema.index({ status: 1 });
payrollSchema.index({ createdAt: -1 });

export default mongoose.models.Payroll || mongoose.model("Payroll", payrollSchema);