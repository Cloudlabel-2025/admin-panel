import mongoose from "mongoose";

const SkillSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    skillName: { type: String, required: true },
    category: { type: String, default: "General" },
    description: { type: String, default: "" },
    proficiencyLevels: {
      type: [String],
      default: ["Beginner", "Intermediate", "Advanced", "Expert"],
    },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Skill || mongoose.model("Skill", SkillSchema);
