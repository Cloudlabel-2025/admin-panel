import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
