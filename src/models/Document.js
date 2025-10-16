import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    documentNumber: { type: String },
    employeeId: { type: String, required: false },
    employeeName: { type: String, required: false },
    fileUrl: { type: String, required: true },
    fileType: { type: String, required: true },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: false,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true, strict: false }
);

// Delete cached model to force schema update
if (mongoose.models.Document) {
  delete mongoose.models.Document;
}

export default mongoose.model("Document", DocumentSchema);
