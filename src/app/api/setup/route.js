import connectMongoose from "@/app/utilis/connectMongoose";
import Setup from "@/models/Setup";
import Inventory from "@/models/Inventory";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectMongoose();
    const setups = await Setup.find();
    return NextResponse.json(setups, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectMongoose();
    const { setupName, categories } = await req.json();
    
    const lastSetup = await Setup.findOne().sort({ setupId: -1 }).select('setupId');
    let nextNumber = 1;
    if (lastSetup?.setupId) {
      nextNumber = parseInt(lastSetup.setupId.split('-')[1]) + 1;
    }
    
    const setup = await Setup.create({
      setupId: `SETUP-${nextNumber.toString().padStart(3, '0')}`,
      setupName,
      categories
    });
    
    return NextResponse.json(setup, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
