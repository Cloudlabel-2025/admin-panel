import connectMongoose from "@/app/utilis/connectMongoose";

export const dynamic = "force-dynamic";
import Performance from "@/models/Performance";
import { NextResponse } from "next/server";

export async function GET(req, context) {
  try {
    const {id} = await context.params;
    await connectMongoose();
    const performance = await Performance.findById(id);
    if (!performance) {
      return NextResponse.json({ error: "Performance not found" }, { status: 404 });
    }
    return NextResponse.json(performance, { status: 200 });
  } catch (err) {
    console.error('Performance GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req, context) {
  try {
    const {id} = await context.params;
    await connectMongoose();
    const body = await req.json();
    const updatedPerformance = await Performance.findByIdAndUpdate(
      id,
      body,
      { new: true }
    );
    return NextResponse.json(updatedPerformance, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    await connectMongoose();
    const {id} = await context.params;
    await Performance.findByIdAndDelete(id);
    return NextResponse.json(
      { message: "Deleted Successfully" },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
