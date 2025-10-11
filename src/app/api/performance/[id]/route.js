import connectMongoose from "@/app/utilis/connectMongoose";
import Performance from "@/models/Performance";
import { NextResponse } from "next/server";

export async function GET(req, context) {
  try {
    const {id} = await context.params;
    await connectMongoose();
    const performance = await Performance.findById(id).populate(
      "employeeId","name"
    );
    return NextResponse.json(performance, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req, context) {
  try {
    const {id} = await context.params;
    await connectMongoose();
    const body = req.json();
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
