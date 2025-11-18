import connectMongoose from "@/app/utilis/connectMongoose";

export const dynamic = "force-dynamic";
import Holiday from "../../../models/Holiday";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connectMongoose();
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    let query = {};
    if (year) {
      const startDate = new Date(year, month ? month - 1 : 0, 1);
      const endDate = new Date(year, month ? month : 12, 0);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const holidays = await Holiday.find(query).sort({ date: 1 });
    return NextResponse.json(holidays);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectMongoose();
    const body = await req.json();
    const { name, date, type, description, isRecurring, createdBy } = body;

    const holiday = new Holiday({
      name,
      date: new Date(date),
      type,
      description,
      isRecurring,
      createdBy
    });

    await holiday.save();
    return NextResponse.json(holiday, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await connectMongoose();
    const body = await req.json();
    const { _id, ...updates } = body;
    
    updates.updatedAt = new Date();
    const holiday = await Holiday.findByIdAndUpdate(_id, updates, { new: true });
    
    if (!holiday) {
      return NextResponse.json({ error: "Holiday not found" }, { status: 404 });
    }
    
    return NextResponse.json(holiday);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await connectMongoose();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    const holiday = await Holiday.findByIdAndDelete(id);
    
    if (!holiday) {
      return NextResponse.json({ error: "Holiday not found" }, { status: 404 });
    }
    
    return NextResponse.json({ message: "Holiday deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}