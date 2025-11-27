import connectMongoose from "@/app/utilis/connectMongoose";
import Inventory from "@/models/Inventory";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectMongoose();
    const { assetId } = await req.json();
    
    const item = await Inventory.findOne({ assetId });
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    
    item.assignedTo = [];
    item.availableQuantity = 1;
    item.assignedQuantity = 0;
    item.status = 'Available';
    
    await item.save();
    return NextResponse.json(item, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
