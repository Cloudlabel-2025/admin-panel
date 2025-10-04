import { NextResponse } from "next/server";
import connectMongoose from "@/app/utilis/connectMongoose";
import Payroll from "@/models/Payroll";

// 🔹 GET: Fetch payroll for one employee
export async function GET(req, { params }) {
  try {
    await connectMongoose();
    const { employeeId } = params;

    const payroll = await Payroll.findOne({ employeeId })
      .populate("employeeId", "name employeeId department baseSalary");

    if (!payroll) {
      return NextResponse.json({ success: false, message: "Payroll not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, payroll }, { status: 200 });
  } catch (error) {
    console.error("Error fetching payroll:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 🔹 PUT: Update payroll (bonus, deductions, adjustments)
export async function PUT(req, { params }) {
  try {
    await connectMongoose();
    const { employeeId } = params;
    const body = await req.json();

    const { bonus = 0, deductions = 0 } = body;

    const payroll = await Payroll.findOne({ employeeId });
    if (!payroll) {
      return NextResponse.json({ success: false, message: "Payroll not found" }, { status: 404 });
    }

    payroll.bonus = bonus;
    payroll.deductions = deductions;
    payroll.netSalary = payroll.baseSalary + bonus - deductions;

    await payroll.save();

    return NextResponse.json({ success: true, payroll }, { status: 200 });
  } catch (error) {
    console.error("Error updating payroll:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
