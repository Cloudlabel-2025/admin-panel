import connectMongoose from "@/app/utilis/connectMongoose";
import Inventory from "@/models/Inventory";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectMongoose();
    const { assetId, userId, assignedBy } = await req.json();
    
    const item = await Inventory.findOne({ assetId });
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    
    if (item.status === 'Assigned') {
      return NextResponse.json({ error: "Item already assigned" }, { status: 400 });
    }
    
    item.assignedTo.push({
      userId,
      assetId,
      assignedDate: new Date(),
      assignedBy
    });
    item.availableQuantity = 0;
    item.assignedQuantity = 1;
    item.status = 'Assigned';
    
    await item.save();
    return NextResponse.json(item, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
