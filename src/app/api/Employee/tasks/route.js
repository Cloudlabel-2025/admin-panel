import connectMongoose from "../../../utilis/connectMongoose";
import Task from "../../../../models/Task";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connectMongoose();
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");

    if (!employeeId) {
      return NextResponse.json({ error: "Employee ID required" }, { status: 400 });
    }

    console.log("Fetching tasks for employeeId:", employeeId);
    const tasks = await Task.find({ employeeId }).sort({ createdAt: -1 });
    console.log("Found tasks:", tasks.length);
    
    return NextResponse.json(tasks, { status: 200 });
  } catch (err) {
    console.error("Error fetching employee tasks:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}