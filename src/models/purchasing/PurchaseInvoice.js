import mongoose from "mongoose";

const PurchaseInvoiceSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    purchaseOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseOrder",
      required: true,
    },
    items: [
      {
        description: String,
        quantity: Number,
        price: Number,
      },
    ],
    totalAmount: Number,
    status: { type: String, enum: ["Draft", "Sent", "Paid"], default: "Draft" },
    invoiceDate: { type: Date, default: Date.now },
    dueDate: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.PurchaseInvoice ||
  mongoose.model("PurchaseInvoice", PurchaseInvoiceSchema);
