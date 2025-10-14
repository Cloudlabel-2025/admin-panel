import mongoose from "mongoose";

const InventorySchema = new mongoose.Schema({
  assetId: { type: String, unique: true },
  itemName: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  category: {
    type: String,
    enum: ["hardware", "software", "cleaning equipments", "furniture"],
    required: true,
  },
  quantity: { type: Number, required: true, default: 0 },
  price: { type: Number, required: true },
  supplier: { type: String },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: {
    type: String,
    enum: ["Available", "Assigned", "Out of Stock"],
    default: "Available",
  },
  createdAt: { type: Date, default: Date.now },
});

// Pre-save hook to auto-generate assetId

InventorySchema.pre("save", async function (next) {
  if (!this.assetId) {
    // Count total documents to generate incremental ID
    const count = await mongoose.models.Inventory.countDocuments();
    const nextNumber = (count + 1).toString().padStart(4, "0"); // e.g. 0001
    this.assetId = `ASSET-${nextNumber}`;
  }
  next();
});

export default mongoose.models.Inventory ||
  mongoose.model("Inventory", InventorySchema);
