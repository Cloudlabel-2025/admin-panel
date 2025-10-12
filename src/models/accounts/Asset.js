import mongoose from "mongoose";

const AssetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    location: { type: String, required: true },
    originalValue: { type: Number, required: true },
    purchaseDate: { type: Date, required: true },
    usefulLife: { type: Number, default: 5 },
    salvageValue: { type: Number, default: 0 },
    description: { type: String },
    status: { type: String, enum: ["active", "disposed", "maintenance"], default: "active" },
  },
  { timestamps: true }
);

export default mongoose.models.Asset || mongoose.model("Asset", AssetSchema);