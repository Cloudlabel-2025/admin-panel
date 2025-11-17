import mongoose from "mongoose";

const SkillSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    skillName: { type: String, required: true },
    category: { type: String, default: "General" },
    description: { type: String, default: "" },
    proficiencyLevels: {
      type: [String],
      default: ["Beginner", "Intermediate", "Advanced", "Expert"],
    },
    proficiencyHistory: [{
      level: String,
      date: { type: Date, default: Date.now }
    }],
    selfEvaluation: {
      rating: { type: Number, min: 1, max: 5 },
      comments: String,
      lastUpdated: Date
    },
    verifiedEvaluation: {
      rating: { type: Number, min: 1, max: 5 },
      feedback: String,
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      verifiedAt: Date
    },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Skill || mongoose.model("Skill", SkillSchema);
