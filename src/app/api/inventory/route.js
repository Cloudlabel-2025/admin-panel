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
    const { itemName, category, quantity, price, supplier } = body;
    
    // Generate category prefix
    const prefix = category.substring(0, 3).toUpperCase();
    
    // Get last asset ID for this category
    const lastItem = await Inventory
      .findOne({ assetId: { $regex: `^${prefix}-\\d{3}$` } })
      .sort({ assetId: -1 })
      .select('assetId');
    
    let startNumber = 1;
    if (lastItem?.assetId) {
      startNumber = parseInt(lastItem.assetId.split('-')[1]) + 1;
    }
    
    // Generate unique asset IDs
    const assetIds = [];
    for (let i = 0; i < quantity; i++) {
      assetIds.push(`${prefix}-${(startNumber + i).toString().padStart(3, '0')}`);
    }
    
    // Create inventory items
    const items = [];
    for (let i = 0; i < quantity; i++) {
      const itemData = {
        assetId: assetIds[i],
        itemName,
        category,
        quantity: 1,
        availableQuantity: 1,
        assignedQuantity: 0,
        price,
        supplier,
        status: 'Available',
        assignedTo: []
      };
      items.push(itemData);
    }
    
    const created = await Inventory.insertMany(items);
    return NextResponse.json({ success: true, count: created.length, items: created }, { status: 201 });
  } catch (err) {
    console.error('Inventory creation error:', err);
    return NextResponse.json({ 
      error: "Failed to create item", 
      details: err.message
    }, { status: 500 });
  }
}
