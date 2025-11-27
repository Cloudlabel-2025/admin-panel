import connectMongoose from "@/app/utilis/connectMongoose";


import SalesInvoice from "@/models/sales/SalesInvoice";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectMongoose();
    const body = await req.json();
    const invoice = await SalesInvoice.create(body);
    return NextResponse.json(invoice, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectMongoose();
    const invoices = await SalesInvoice.find({}).sort({ createdAt: -1 });
    return NextResponse.json(invoices, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
