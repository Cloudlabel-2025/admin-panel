import connectMongoose from "@/app/utilis/connectMongoose";
import Employee from "@/models/Employee";
import { NextResponse } from "next/server";

// 🔹 Get all employees
export async function GET() {
  try {
    await connectMongoose();
    const employees = await Employee.find();
    return NextResponse.json({ employees }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 🔹 Search employee by ID
export async function POST(req) {
  try {
    await connectMongoose();
    const { employeeId } = await req.json();

    if (!employeeId) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
    }

    const employee = await Employee.findOne({ employeeId });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json({ employee }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
