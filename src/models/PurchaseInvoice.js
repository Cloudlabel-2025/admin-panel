import mongoose from "mongoose";

const PurchaseInvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  poNumber: { type: String },
  vendorName: { type: String, required: true },
  vendorEmail: { type: String },
  invoiceDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
  totalAmount: { type: Number },
  paidAmount: { type: Number, default: 0 },
  status: { type: String, enum: ["Pending", "Paid", "Overdue", "Cancelled"], default: "Pending" },
  description: { type: String },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileSize: { type: Number },
  uploadedBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.PurchaseInvoice || mongoose.model("PurchaseInvoice", PurchaseInvoiceSchema);