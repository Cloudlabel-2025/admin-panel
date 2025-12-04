import mongoose from "mongoose";

const ExpenseSchema = new mongoose.Schema({
  adminId: { type: String, required: true },
  adminName: { type: String, required: true },
  budgetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Budget', required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, default: Date.now },
  receipt: { type: String }, // File path if uploaded
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Approved' },
}, { timestamps: true });

export default mongoose.models.Expense || mongoose.model("Expense", ExpenseSchema);
