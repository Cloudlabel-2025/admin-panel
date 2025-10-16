import mongoose from 'mongoose';

const SalaryHikeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  previousSalary: { type: Number, required: true },
  newSalary: { type: Number, required: true },
  effectiveDate: { type: Date, required: true },
  reason: { type: String, required: true },
  processedBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.SalaryHike || mongoose.model('SalaryHike', SalaryHikeSchema);