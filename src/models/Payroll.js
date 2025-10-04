import mongoose from "mongoose";

const PayrollSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    baseSalary: { type: Number, required: true },
    totalDays: { type: Number, default: 30 },
    presentDays: { type: Number, default: 0 },
    halfDays: { type: Number, default: 0 },
    absentDays: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    netSalary: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ✅ Helper function for salary calculation
PayrollSchema.statics.calculatePayroll = function (attendanceRecords, baseSalary) {
  let presentDays = 0, halfDays = 0, absentDays = 0;

  attendanceRecords.forEach((rec) => {
    if (rec.status === "Present") presentDays++;
    else if (rec.status === "Half Day") halfDays++;
    else if (rec.status === "Absent") absentDays++;
  });

  const perDaySalary = baseSalary / 30;
  const netSalary =
    presentDays * perDaySalary + halfDays * (perDaySalary / 2);

  return { presentDays, halfDays, absentDays, netSalary };
};

export default mongoose.models.Payroll || mongoose.model("Payroll", PayrollSchema);
