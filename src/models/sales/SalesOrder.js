import mongoose from "mongoose";

const SalesOrderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
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
    status: {
      type: String,
      enum: ["Draft", "Confirmed", "Delivered"],
      default: "Draft",
    },
    orderDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.SalesOrder ||
  mongoose.model("SalesOrder", SalesOrderSchema);
