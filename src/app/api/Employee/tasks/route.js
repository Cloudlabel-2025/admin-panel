import connectMongoose from "../../../utilis/connectMongoose";
import Task from "../../../../models/Task";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connectMongoose();
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");

    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    if (!employeeId) {
      return NextResponse.json({ error: "Employee ID required" }, { status: 400 });
    }

    console.log("Fetching tasks for employeeId:", employeeId);

    const totalTasks = await Task.countDocuments({ employeeId });
    const tasks = await Task.find({ employeeId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    console.log("Found tasks:", tasks.length);

    return NextResponse.json({
      tasks,
      pagination: {
        totalTasks,
        totalPages: Math.ceil(totalTasks / limit),
        currentPage: page,
        limit
      }
    }, { status: 200 });
  } catch (err) {
    console.error("Error fetching employee tasks:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}