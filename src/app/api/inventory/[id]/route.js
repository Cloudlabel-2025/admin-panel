import { NextResponse } from "next/server";
import connectMongoose from "@/app/utilis/connectMongoose";
import Inventory from "@/models/Inventory";

export async function GET(req, { params }) {
  try {
    await connectMongoose();
    const { id } = await params;
    const item = await Inventory.findById(id)
      .populate("assignedTo", "employeeId name email");
    if (!item)
      return NextResponse.json({ message: "Item not found" }, { status: 404 });
    return NextResponse.json(item);
  } catch (err) {
    
    return NextResponse.json({ error: "Failed to fetch item" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await connectMongoose();
    const { id } = await params;
    const body = await req.json();
    const item = await Inventory.findByIdAndUpdate(id, body, { new: true });
    if (!item)
      return NextResponse.json({ message: "Item not found" }, { status: 404 });
    return NextResponse.json(item);
  } catch (err) {
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectMongoose();
    const { id } = await params;
    const deleted = await Inventory.findByIdAndDelete(id);
    if (!deleted)
      return NextResponse.json({ message: "Item not found" }, { status: 404 });
    return NextResponse.json({ message: "Item deleted successfully" });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
