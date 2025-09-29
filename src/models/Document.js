import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    documentNumber: { type: String },
    fileUrl: { type: String, required: true },
    fileType: { type: String, required: true },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: false,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.Document ||
  mongoose.model("Document", DocumentSchema);
