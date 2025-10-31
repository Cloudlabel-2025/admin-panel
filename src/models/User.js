import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "Employee" },
  isTerminated: { type: Boolean, default: false },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
