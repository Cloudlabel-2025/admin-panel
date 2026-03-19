import mongoose from "mongoose";

delete mongoose.connection.models['User'];

const UserSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Not required for pending SME accounts
  role: { type: String, default: "Employee" },
  status: { type: String, enum: ["active", "pending"], default: "active" }, // Account status
  isTerminated: { type: Boolean, default: false },
  resetOTP: { type: String },
  resetOTPExpiry: { type: Date },
}, { strict: false });

if (mongoose.models.User) {
  delete mongoose.models.User;
}

export default mongoose.model("User", UserSchema);
