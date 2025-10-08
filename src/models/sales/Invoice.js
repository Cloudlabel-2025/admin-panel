import mongoose from "mongoose";
import SalesOrder from "./SalesOrder";

const SalesInvoiceSchema = new mongoose.schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      requried: true,
    },
    SalesOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalesOrder",
      requried: true,
    },
    items: [
      {
        description: { type: String },
        quantity: Number,
        price: Number,
      },
    ],
    totalAmount: Number,
    status: {
      type: String,
      enum: ["Draft", "Sent", "Paid", "Overdue"],
      default: "Draft",
    },
    invoiceDate: { type: Date, default: Date.now },
    dueDate: Date,
  },
  { timestamps: true }
);

export default mongoose.models.SalesInvoice ||
  mongoose.model("SalesInvoice", SalesInvoiceSchema);
