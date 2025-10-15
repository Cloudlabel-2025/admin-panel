import connectMongoose from "@/app/utilis/connectMongoose";
import Inventory from "@/models/Inventory";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectMongoose();
    const items = await Inventory.find()
      .populate("assignedTo", " employeeId name email"); 
      return NextResponse.json(items,{status:200});
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectMongoose();
    const body = await req.json();
    
    // Generate assetId if not provided
    if (!body.assetId) {
      const lastItem = await Inventory
        .findOne({ assetId: { $regex: /^ASSET-\d{4}$/ } })
        .sort({ assetId: -1 })
        .select('assetId');
      
      let nextNumber = 1;
      if (lastItem && lastItem.assetId) {
        const lastNumber = parseInt(lastItem.assetId.split('-')[1]);
        nextNumber = lastNumber + 1;
      }
      
      body.assetId = `ASSET-${nextNumber.toString().padStart(4, "0")}`;
    }
    
    const item = await Inventory.create(body);
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    console.error('Inventory creation error:', err);
    return NextResponse.json({ 
      error: "Failed to create item", 
      details: err.message,
      code: err.code 
    }, { status: 500 });
  }
}
