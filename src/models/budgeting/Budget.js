import mongoose from "mongoose";

const BudgetSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    allocatedAmout: { type: Number, required: true },
    spentAmount: { type: Number, required: true },
    period: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Budget || mongoose.model("Budget", BudgetSchema);
