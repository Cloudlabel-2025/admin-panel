import connectMongoose from "../../../utilis/connectMongoose";


import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  address: String,
  createdAt: { type: Date, default: Date.now }
});

const Customer = mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);

export async function GET() {
  try {
    await connectMongoose();
    const customers = await Customer.find().sort({ createdAt: -1 });
    return Response.json(customers);
  } catch (error) {
    return Response.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectMongoose();
    const data = await request.json();
    const customer = new Customer(data);
    await customer.save();
    return Response.json({ message: "Customer created successfully" });
  } catch (error) {
    return Response.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
