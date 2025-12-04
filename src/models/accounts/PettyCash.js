import mongoose from "mongoose";

const PettyCashSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["in", "out"], required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    description: { type: String },
    handledBy: { type: String, required: true },
    handledByName: { type: String },
    approvedBy: { type: String },
    date: { type: Date, default: Date.now },
    month: { type: String }, // Format: YYYY-MM
    allocatedAmount: { type: Number, default: 0 }, // For budget allocation
    currentBalance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.PettyCash || mongoose.model("PettyCash", PettyCashSchema);