import connectMongoose from "../../utilis/connectMongoose";
import DailyTask from "../../../models/Dailytask";
import { NextResponse } from "next/server";

// GET: fetch daily tasks or monthly report
export async function GET(req) {
  try {
    await connectMongoose();
    const { searchParams } = new URL(req.url);

    const employeeId = searchParams.get("employeeId");
    const dateParam = searchParams.get("date"); // fetch daily
    const month = parseInt(searchParams.get("month")); // fetch monthly
    const year = parseInt(searchParams.get("year"));

    // Monthly report
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      let query = { date: { $gte: start, $lte: end } };
      if (employeeId) query.employeeId = employeeId;

      const tasks = await DailyTask.find(query).sort({ date: 1 });
      return NextResponse.json(tasks, { status: 200 });
    }

    // Daily fetch
    let query = {};
    if (employeeId) query.employeeId = employeeId;
    if (dateParam) {
      const start = new Date(dateParam);
      const end = new Date(dateParam);
      end.setHours(23, 59, 59);
      query.date = { $gte: start, $lte: end };
    }
    const tasks = await DailyTask.find(query).sort({ date: -1 });
    return NextResponse.json(tasks, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

// POST: create new DailyTask
export async function POST(req) {
  try {
    await connectMongoose();
    const data = await req.json();
    if (!data.date) data.date = new Date();
    const dailyTask = await DailyTask.create(data);
    return NextResponse.json({ message: "Daily Task created", dailyTask }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

// PUT: update existing DailyTask
export async function PUT(req) {
  try {
    await connectMongoose();
    const body = await req.json();
    const { _id, ...updates } = body;

    const dailyTask = await DailyTask.findByIdAndUpdate(_id, updates, { new: true });
    if (!dailyTask) return NextResponse.json({ error: "Daily Task not found" }, { status: 404 });

    return NextResponse.json({ dailyTask });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to update" }, { status: 500 });
  }
}
