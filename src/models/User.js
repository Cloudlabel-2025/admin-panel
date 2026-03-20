import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  role: { type: String, default: "Employee" },
  status: { type: String, enum: ["active", "pending"], default: "active" },
  isTerminated: { type: Boolean, default: false },
  resetOTP: { type: String },
  resetOTPExpiry: { type: Date },
}, { strict: false });

export default mongoose.models.User || mongoose.model("User", UserSchema);
