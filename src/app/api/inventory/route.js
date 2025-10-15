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
    const item = await Inventory.create(body);
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}
