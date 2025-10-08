import mongoose from "mongoose";

const SalesInvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    salesOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "SalesOrder" },
    customerName: { type: String, required: true },
    invoiceDate: { type: Date, default: Date.now },
    dueDate: { type: Date },
    status: {
      type: String,
      enum: ["Draft", "Sent", "Paid", "Overdue"],
      default: "Draft",
    },
    items: [
      {
        description: { type: String, required: true },
        quantity: { type: Number, required: true },
        total: { type: Number, required: true },
      },
    ],
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Partial", "Paid"],
      default: "Unpaid",
    },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.SalesInvoice ||
  mongoose.model("SalesInvoice", SalesInvoiceSchema);
