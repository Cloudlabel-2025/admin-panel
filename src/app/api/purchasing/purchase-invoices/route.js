import connectMongoose from "@/app/utilis/connectMongoose";
import PurchaseInvoice from "@/models/purchasing/PurchaseInvoice";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectMongoose();
    const body = await req.json();
    const invoice = await PurchaseInvoice.create(body);
    return NextResponse.json(invoice, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectMongoose();
    const invoices = await PurchaseInvoice.find({})
    .populate("vendor order");
    return NextResponse.json(invoices,{status:200});
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
