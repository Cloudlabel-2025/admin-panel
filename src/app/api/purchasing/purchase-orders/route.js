import connectMongoose from "../../../utilis/connectMongoose";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function POST(req) {
  try {
    await connectMongoose();
    const body = await req.json();
    
    const db = mongoose.connection.db;
    const result = await db.collection('purchaseorders').insertOne({
      ...body,
      poNumber: body.orderNumber,
      createdAt: new Date()
    });
    
    return NextResponse.json({ _id: result.insertedId, ...body }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectMongoose();
    
    const db = mongoose.connection.db;
    const orders = await db.collection('purchaseorders').find({}).sort({ createdAt: -1 }).toArray();
    
    return NextResponse.json(orders, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
