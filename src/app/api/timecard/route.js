import connectMongoose from "@/app/utilis/connectMongoose";
import Timecard from "@/models/Timecard";
import { NextResponse } from "next/server";

export  async function POST(req,res){
    try{
    await connectMongoose();
    const data = await req.json();
     if (!data.date) {
      data.date = new Date();
    }
    const timecard = await Timecard.create(data);
    return NextResponse.json({ message: "Timecard created", timecard }, { status: 201 });
    }
    catch(err){
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
}

export  async function GET(req,res) {
    try{
    await connectMongoose();
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const isAdmin = searchParams.get("admin");
    
    let query = {};
    if (employeeId && !isAdmin) {
      query.employeeId = employeeId;
    }
    
    const timecards = await Timecard.find(query).sort({date:-1});
    return NextResponse.json(isAdmin ? { timecards } : timecards, {status:200});
    }
    catch(err){
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
}

export async function PUT(req){
  try {
    await connectMongoose();
    const body = await req.json();
    const { _id, ...updates } = body;

    const timecard = await Timecard.findByIdAndUpdate(_id, updates, { new: true });

    if (!timecard) {
      return NextResponse.json({ error: "Timecard not found" }, { status: 404 });
    }

    return NextResponse.json({ timecard });
  } catch (err) {
    console.error("PUT error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
