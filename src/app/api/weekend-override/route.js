import connectMongoose from "@/app/utilis/connectMongoose";
import WeekendOverride from "@/models/WeekendOverride";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connectMongoose();
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type");

    let query = {};
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (type) {
      query.type = type;
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
    const { date, isWeekend, reason, createdBy, type, compensationDate } = body;

    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    const overrideData = { 
      isWeekend, 
      reason, 
      createdBy, 
      type: type || 'override',
      createdAt: new Date() 
    };

    if (compensationDate) {
      const compDate = new Date(compensationDate);
      compDate.setHours(0, 0, 0, 0);
      overrideData.compensationDate = compDate;
      
      await WeekendOverride.findOneAndUpdate(
        { date: compDate },
        { isWeekend: false, reason: `Compensation for ${checkDate.toLocaleDateString()}`, createdBy, type: 'compensation', createdAt: new Date() },
        { upsert: true, new: true }
      );
    }

    const override = await WeekendOverride.findOneAndUpdate(
      { date: checkDate },
      overrideData,
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
    const id = searchParams.get("id");

    if (id) {
      await WeekendOverride.deleteOne({ _id: id });
      return NextResponse.json({ success: true });
    }

    if (!date) {
      return NextResponse.json({ error: "Date or ID required" }, { status: 400 });
    }

    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    await WeekendOverride.deleteOne({ date: checkDate });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
