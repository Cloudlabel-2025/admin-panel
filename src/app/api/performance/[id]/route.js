import connectMongoose from "@/app/utilis/connectMongoose";
import Performance from "@/models/Performance";
import { NextResponse } from "next/server";

await connectMongoose();

export async function GET(req, { params }) {
  try {
    const performance = await Performance.findById(params.id).populate(
      "employeeId name"
    );
    return NextResponse.json(performance, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const body = req.json();
    const updatedPerformance = await Performance.findByIdAndUpdate(
      params.id,
      body,
      { new: true }
    );
    return NextResponse.json(updatedPerformance, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await Performance.findByIdAndDelete(params.id);
    return NextResponse.json(
      { message: "Deleted Successfully" },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
