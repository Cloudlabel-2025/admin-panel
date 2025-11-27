import mongoose from "mongoose";

const SetupSchema = new mongoose.Schema({
  setupId: { type: String, unique: true, required: true },
  setupName: { type: String, required: true },
  categories: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

const SetupAssignmentSchema = new mongoose.Schema({
  setupId: { type: String, required: true },
  setupName: { type: String, required: true },
  assignedItems: [{ assetId: { type: String } }],
  assignedTo: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    assignedDate: { type: Date, default: Date.now },
    assignedBy: { type: String }
  }
});

if (mongoose.models.Setup) {
  delete mongoose.models.Setup;
}
if (mongoose.models.SetupAssignment) {
  delete mongoose.models.SetupAssignment;
}

export const Setup = mongoose.model("Setup", SetupSchema);
export const SetupAssignment = mongoose.model("SetupAssignment", SetupAssignmentSchema);
export default Setup;
