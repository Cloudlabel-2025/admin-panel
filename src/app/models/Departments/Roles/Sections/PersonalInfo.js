import mongoose from "mongoose";

const personalInfoSchema = new mongoose.Schema({

  firstName: { type: String, required: true },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  }

}, { timestamps: true });

export default mongoose.models.PersonalInfo || mongoose.model("PersonalInfo", personalInfoSchema);
