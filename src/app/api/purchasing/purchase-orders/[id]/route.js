import connectMongoose from "../../../../utilis/connectMongoose";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    await connectMongoose();
    const { id } = await params;
    
    const db = mongoose.connection.db;
    const order = await db.collection('purchaseorders').findOne({ _id: new mongoose.Types.ObjectId(id) });
    
    return NextResponse.json(order, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await connectMongoose();
    const { id } = await params;
    const body = await req.json();
    
    const db = mongoose.connection.db;
    await db.collection('purchaseorders').updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: { ...body, updatedAt: new Date() } }
    );
    
    return NextResponse.json({ message: "Purchase order updated successfully" }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectMongoose();
    const { id } = await params;
    
    const db = mongoose.connection.db;
    await db.collection('purchaseorders').deleteOne({ _id: new mongoose.Types.ObjectId(id) });
    
    return NextResponse.json({ message: "Purchase order deleted successfully" }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
