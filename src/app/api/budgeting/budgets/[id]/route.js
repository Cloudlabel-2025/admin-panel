import connectMongoose from "@/app/utilis/connectMongoose";
import Budget from "@/models/budgeting/Budget";
import { NextResponse } from "next/server";

export async function GET(req,{params}) {
  try {
    await connectMongoose();
    const budget = await Budget.findById(params.id);
    return NextResponse.json(budget,{status:200});
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
export async function PUT(req,{params}) {
  try {
    await connectMongoose();
    const body = await req.json();
    const budget = await Budget.findByIdAndUpdate(params.id,body,{new:true});
    return NextResponse.json(budget,{status:200});
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
export async function DELETE(req,{params}) {
  try {
    await connectMongoose();
    await Budget.findByIdAndDelete(params.id);
    return NextResponse.json({message:"Budget deleted"},{status:200});
} catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
