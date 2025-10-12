import mongoose from "mongoose";

const PettyCashSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["in", "out"], required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    description: { type: String },
    handledBy: { type: String, required: true },
    approvedBy: { type: String },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.PettyCash || mongoose.model("PettyCash", PettyCashSchema);