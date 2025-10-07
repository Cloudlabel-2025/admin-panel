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
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required:true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required:true,
  },
  createdAt:{type:Date, default: Date.now},
  updateAt:{type:Date, default: Date.now}
}, 
{ timestamps: true }
);

export default mongoose.models.Project ||
  mongoose.model("Project", ProjectSchema);

  