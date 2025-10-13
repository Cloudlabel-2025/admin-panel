import connectMongoose from "../../../../utilis/connectMongoose";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    await connectMongoose();
    const { id } = await params;
    
    const db = mongoose.connection.db;
    const invoice = await db.collection('purchaseinvoices').findOne({ _id: new mongoose.Types.ObjectId(id) });
    
    return NextResponse.json(invoice, { status: 200 });
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
    await db.collection('purchaseinvoices').updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: { ...body, updatedAt: new Date() } }
    );
    
    return NextResponse.json({ message: "Purchase invoice updated successfully" }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectMongoose();
    const { id } = await params;
    
    const db = mongoose.connection.db;
    await db.collection('purchaseinvoices').deleteOne({ _id: new mongoose.Types.ObjectId(id) });
    
    return NextResponse.json({ message: "Purchase invoice deleted successfully" }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

