import mongoose from "mongoose";

const PurchaseOrderSchema = new mongoose.Schema({
  poNumber: { type: String, required: true, unique: true },
  vendorName: { type: String, required: true },
  vendorEmail: { type: String },
  vendorPhone: { type: String },
  orderDate: { type: Date, default: Date.now },
  deliveryDate: { type: Date },
  totalAmount: { type: Number },
  status: { type: String, enum: ["Pending", "Approved", "Delivered", "Cancelled"], default: "Pending" },
  description: { type: String },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileSize: { type: Number },
  uploadedBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.PurchaseOrder || mongoose.model("PurchaseOrder", PurchaseOrderSchema);