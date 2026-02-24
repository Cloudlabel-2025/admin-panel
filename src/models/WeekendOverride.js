import mongoose from "mongoose";

const WeekendOverrideSchema = new mongoose.Schema({
  date: { type: Date, required: true, unique: true },
  isWeekend: { type: Boolean, required: true },
  reason: { type: String, default: "" },
  createdBy: { type: String, default: "" },
  type: { type: String, enum: ['override', 'compensation'], default: 'override' },
  compensationDate: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

if (mongoose.models.WeekendOverride) {
  delete mongoose.models.WeekendOverride;
}

export default mongoose.model("WeekendOverride", WeekendOverrideSchema);
