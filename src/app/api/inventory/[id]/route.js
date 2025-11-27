import { NextResponse } from "next/server";

import connectMongoose from "@/app/utilis/connectMongoose";
import Inventory from "@/models/Inventory";

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
