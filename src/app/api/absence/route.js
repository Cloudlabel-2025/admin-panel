import { NextResponse } from "next/server";
import Absence from "@/models/Absence";
import connectMongoose from "@/app/utilis/connectMongoose";

export async function GET(req) {
  try {
    await connectMongoose();
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");
    
    let query = {};
    if (employeeId) query.employeeId = employeeId;
    if (status) query.status = status;
    
    const absences = await Absence.find(query).sort({ createdAt: -1 });
    return NextResponse.json(absences);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectMongoose();
    const data = await req.json();
    
    const absence = await Absence.create(data);
    return NextResponse.json({ success: true, absence });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await connectMongoose();
    const { _id, action, ...updates } = await req.json();
    
    if (action === "approve") {
      updates.status = "Approved";
      updates.approvalDate = new Date();
    } else if (action === "reject") {
      updates.status = "Rejected";
      updates.approvalDate = new Date();
    }
    
    const absence = await Absence.findByIdAndUpdate(_id, updates, { new: true });
    
    if (!absence) {
      return NextResponse.json({ error: "Absence record not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, absence });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}