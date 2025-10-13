import connectMongoose from "../../../utilis/connectMongoose";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectMongoose();
    const body = await req.json();
    
    const db = mongoose.connection.db;
    const result = await db.collection('purchaseinvoices').insertOne({
      ...body,
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
    const invoices = await db.collection('purchaseinvoices').find({}).sort({ createdAt: -1 }).toArray();
    
    // Fetch vendor names for each invoice
    const invoicesWithVendors = await Promise.all(
      invoices.map(async (invoice) => {
        if (invoice.vendor) {
          try {
            const vendor = await db.collection('vendors').findOne({ _id: new mongoose.Types.ObjectId(invoice.vendor) });
            return {
              ...invoice,
              vendor: vendor ? { _id: vendor._id, name: vendor.name } : null
            };
          } catch (err) {
            return { ...invoice, vendor: null };
          }
        }
        return invoice;
      })
    );
    
    return NextResponse.json(invoicesWithVendors, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
