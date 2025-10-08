import connectMongoose from "@/app/utilis/connectMongoose";
import PurchaseOrder from "@/models/purchasing/PurchaseOrder";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectMongoose();
    const body = await req.json();
    const purchaseOrder = await PurchaseOrder.create(body);
    return NextResponse.json(purchaseOrder, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectMongoose();
    const orders = await PurchaseOrder.find({}).populate("vendor");
    return NextResponse.json(orders, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
