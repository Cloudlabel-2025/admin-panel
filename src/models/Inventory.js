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

// AssetId is now generated in the API route

export default mongoose.models.Inventory ||
  mongoose.model("Inventory", InventorySchema);
