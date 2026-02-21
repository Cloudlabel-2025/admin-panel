import mongoose from "mongoose";

const WeekendOverrideSchema = new mongoose.Schema({
  date: { type: Date, required: true, unique: true },
  isWeekend: { type: Boolean, required: true },
  reason: { type: String, default: "" },
  createdBy: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.WeekendOverride || mongoose.model("WeekendOverride", WeekendOverrideSchema);
