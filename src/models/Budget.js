import mongoose from "mongoose";

const BudgetSchema = new mongoose.Schema({
  adminId: { type: String, required: true },
  adminName: { type: String, required: true },
  adminEmail: { type: String, required: true },
  allocatedAmount: { type: Number, required: true, default: 0 },
  spentAmount: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  allocatedBy: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  month: { type: String, required: true }, // Format: YYYY-MM
}, { timestamps: true });

export default mongoose.models.Budget || mongoose.model("Budget", BudgetSchema);
