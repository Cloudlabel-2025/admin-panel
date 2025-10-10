import mongoose from "mongoose";

const PerformanceSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewPeriod: { type: String, required: true },
    reviewer: { type: String },
    goals: [{ type: String }],
    achievements: [{ type: String }],
    ratings: {
      communication: { type: Number, min: 1, max: 5 },
      teamwork: { type: Number, min: 1, max: 5 },
      problemsolving: { type: Number, min: 1, max: 5 },
      leadership: { type: Number, min: 1, max: 5 },
    },
    overall: { type: Number, min: 1, max: 5 },
    comments: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.Performance ||
  mongoose.model("Performance", PerformanceSchema);
