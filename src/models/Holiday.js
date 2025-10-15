import mongoose from "mongoose";

const HolidaySchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  type: { type: String, enum: ["Public", "Company", "Optional"], default: "Public" },
  description: { type: String },
  isRecurring: { type: Boolean, default: false },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Holiday || mongoose.model("Holiday", HolidaySchema);