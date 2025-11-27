import mongoose from "mongoose";

const InventorySchema = new mongoose.Schema({
  assetId: { type: String, unique: true },
  itemName: { type: String, required: true },
  category: {
    type: String,
    enum: ["Laptop", "Desktop", "Monitor", "Keyboard", "Mouse", "Headset", "Webcam", "Printer", "Scanner", "Router", "Switch", "Server", "UPS", "Projector", "Chair", "Desk", "Cabinet", "Software License", "Mobile Device", "Tablet", "Other"],
    required: true,
  },
  quantity: { type: Number, required: true, default: 1 },
  availableQuantity: { type: Number, required: true, default: 1 },
  assignedQuantity: { type: Number, default: 0 },
  price: { type: Number, required: true },
  supplier: { type: String },
  assignedTo: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    assetId: { type: String },
    assignedDate: { type: Date, default: Date.now },
    assignedBy: { type: String }
  }],
  status: {
    type: String,
    enum: ["Available", "Assigned", "Out of Stock"],
    default: "Available",
  },
  createdAt: { type: Date, default: Date.now },
});

if (mongoose.models.Inventory) {
  delete mongoose.models.Inventory;
}

export default mongoose.model("Inventory", InventorySchema);
