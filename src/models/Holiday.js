import mongoose from "mongoose";

const HolidaySchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  type: { type: String, enum: ["National", "Regional", "Optional", "Company"], default: "National" },
  region: { type: String },
  department: { type: String },
  description: { type: String },
  isRecurring: { type: Boolean, default: false },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Holiday || mongoose.model("Holiday", HolidaySchema);