import connectMongoose from "../../../utilis/connectMongoose";


import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectMongoose();
    
    const mongoose = await import('mongoose');
    const db = mongoose.default.connection.db;
    
    const employees = await db.collection('terminated_employees').find({}).toArray();
    
    return NextResponse.json({ employees });
  } catch (error) {
    console.error("Error fetching terminated employees:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
