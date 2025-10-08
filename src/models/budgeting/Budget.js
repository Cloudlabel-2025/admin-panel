import mongoose from "mongoose";

const BudgetSchema = new mongoose.Schema(
  {
    project: { type: String, required: true },
    department: { type: String, required: true },
    allocatedAmount: { type: Number, required: true },
    spentAmount: { type: Number, required: true },
    fiscalYear: { type: String },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Budget || mongoose.model("Budget", BudgetSchema);
