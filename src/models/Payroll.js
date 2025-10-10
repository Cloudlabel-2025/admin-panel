import mongoose from "mongoose";
import Attendance from "./Attendance";

const payrollSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  employeeName: { type: String, default: "" },
  department: { type: String, default: "" },
  designation: { type: String, default: "" },
  
  // Salary Components
  grossSalary: { type: Number, default: 0 },
  basicSalary: { type: Number, default: 0 },
  hra: { type: Number, default: 0 },
  da: { type: Number, default: 0 },
  conveyance: { type: Number, default: 0 },
  medical: { type: Number, default: 0 },
  bonus: { type: Number, default: 0 },
  weekendWork: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  
  // Deductions
  pf: { type: Number, default: 0 },
  esi: { type: Number, default: 0 },
  lopAmount: { type: Number, default: 0 },
  lopDays: { type: Number, default: 0 },
  loanDeduction: { type: Number, default: 0 },
  totalDeductions: { type: Number, default: 0 },
  
  // Final Amount
  netPay: { type: Number, default: 0 },
  
  // Attendance Info
  presentDays: { type: Number, default: 0 },
  expectedWorkingDays: { type: Number, default: 26 },
  
  createdAt: { type: Date, default: Date.now },
});



export default mongoose.models.Payroll || mongoose.model("Payroll", payrollSchema);
