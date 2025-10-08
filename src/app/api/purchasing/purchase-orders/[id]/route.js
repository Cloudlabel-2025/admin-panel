import connectMongoose from "@/app/utilis/connectMongoose";
import PurchaseOrder from "@/models/purchasing/PurchaseOrder";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    await connectMongoose();
    const order = await PurchaseOrder.findById(params.id).populate(
      "vendor order"
    );
    return NextResponse.json(order, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await connectMongoose();
    const body = req.json();
    const order = await PurchaseOrder.findByIdAndUpdate(params.id,body,{new:true});
    return NextResponse.json(order,{status:200});
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectMongoose();
    await PurchaseOrder.findByIdAndDelete(params.id);
    return NextResponse.json({message:"Purchase order Deleted Successfully"},{status:200});
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
