import connectMongoose from "@/app/utilis/connectMongoose";
import WeekendOverride from "@/models/WeekendOverride";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connectMongoose();
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let query = {};
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const overrides = await WeekendOverride.find(query).sort({ date: 1 });
    return NextResponse.json(overrides);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectMongoose();
    const body = await req.json();
    const { date, isWeekend, reason, createdBy } = body;

    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    const override = await WeekendOverride.findOneAndUpdate(
      { date: checkDate },
      { isWeekend, reason, createdBy, createdAt: new Date() },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, override });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await connectMongoose();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json({ error: "Date required" }, { status: 400 });
    }

    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    await WeekendOverride.deleteOne({ date: checkDate });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
