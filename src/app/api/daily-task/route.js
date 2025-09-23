import connectMongoose from "@/app/utilis/connectMongoose";
import DailyTask from "../../../models/Dailytask";
import Employee from "../../../models/Employee";
import { NextResponse } from "next/server";

export async function GET(req) {
  await connectMongoose();
  const { employeeId, date, month, year } = Object.fromEntries(req.nextUrl.searchParams);

  if (employeeId && date) {
    // Fetch DailyTask for employee on a specific date
    const employee = await Employee.findOne({ employeeId });
    if (!employee) return NextResponse.json([], { status: 404 });

    const dailyTask = await DailyTask.find({ 
      employee: employee._id, 
      date: { $gte: new Date(date), $lte: new Date(date + "T23:59:59") } 
    }).populate("employee");

    return NextResponse.json(dailyTask);
  }

  if (month && year) {
    // Fetch all tasks for a given month
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const tasks = await DailyTask.find({ date: { $gte: start, $lte: end } }).populate("employee");
    return NextResponse.json(tasks);
  }

  const allTasks = await DailyTask.find().populate("employee");
  return NextResponse.json(allTasks);
}

export async function POST(req) {
  await connectMongoose();
  const data = await req.json();

  const employee = await Employee.findOne({ employeeId: data.employeeId });
  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  const dailyTask = new DailyTask({
    employee: employee._id,
    date: data.date || new Date(),
    tasks: data.tasks,
  });

  await dailyTask.save();
  return NextResponse.json({ message: "DailyTask created", dailyTask });
}

export async function PUT(req) {
  await connectMongoose();
  const data = await req.json();

  const dailyTask = await DailyTask.findById(data._id);
  if (!dailyTask) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  dailyTask.tasks = data.tasks;
  await dailyTask.save();
  return NextResponse.json({ message: "DailyTask updated", dailyTask });
}
export async function DELETE(req) {
  await connectMongoose();
  const { id } = Object.fromEntries(req.nextUrl.searchParams);
  const dailyTask = await DailyTask.findById(id);
  if (!dailyTask) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  await dailyTask.remove();
  return NextResponse.json({ message: "DailyTask deleted" });
}