import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema({
  projectName: { type: String, required: true },
  projectCode: { type: String, required: true },
  description: { type: String, default: "" },
  startDate: { type: Date },
  endDate: { type: Date },
  status: {
    type: String,
    enum: ["Planned", "Ongoing", "Completed"],
    default: "Planned",
  },
  assignedBy: {
    type: String,
    required: true,
  },
  assignedTo: {
    type: String,
    required: true,
  },
  assignmentStatus: {
    type: String,
    enum: ["Pending", "Accepted", "Declined"],
    default: "Pending"
  },
  responseReason: { type: String, default: "" },
  respondedAt: { type: Date },
  createdAt:{type:Date, default: Date.now},
  updateAt:{type:Date, default: Date.now}
}, 
{ timestamps: true }
);

// Delete existing model to force recreation with new schema
if (mongoose.models.Project) {
  delete mongoose.models.Project;
}

export default mongoose.model("Project", ProjectSchema);

  