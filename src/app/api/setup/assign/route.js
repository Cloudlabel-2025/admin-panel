import connectMongoose from "@/app/utilis/connectMongoose";
import Setup, { SetupAssignment } from "@/models/Setup";
import Inventory from "@/models/Inventory";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectMongoose();
    const { setupId, userId, assignedBy } = await req.json();
    
    const setup = await Setup.findOne({ setupId });
    if (!setup) {
      return NextResponse.json({ error: "Setup not found" }, { status: 404 });
    }
    
    const assignedItems = [];
    
    // Randomly pick ONE available item from each category
    for (const category of setup.categories) {
      const availableItems = await Inventory.find({ 
        category, 
        status: 'Available' 
      });
      
      if (availableItems.length === 0) {
        return NextResponse.json({ 
          error: `No ${category} items available` 
        }, { status: 400 });
      }
      
      // Pick random item
      const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
      
      await Inventory.findByIdAndUpdate(randomItem._id, {
        $push: { assignedTo: { userId, assetId: randomItem.assetId, assignedDate: new Date(), assignedBy } },
        status: 'Assigned',
        availableQuantity: 0,
        assignedQuantity: 1
      });
      
      assignedItems.push({ assetId: randomItem.assetId });
    }
    
    // Create assignment record
    await SetupAssignment.create({
      setupId: setup.setupId,
      setupName: setup.setupName,
      assignedItems,
      assignedTo: { userId, assignedDate: new Date(), assignedBy }
    });
    
    return NextResponse.json({ success: true, assignedItems }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
