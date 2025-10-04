import connectMongoose from "@/app/utilis/connectMongoose";
import Attendance from "@/models/Attendance";
import Payroll from "@/models/Payroll";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

// Helper: Calculate payroll for one employee
function calculatePayroll(attendanceRecords, baseSalary) {
  let presentDays = 0, halfDays = 0, absentDays = 0;

  attendanceRecords.forEach((rec) => {
    if (rec.status === "Present") presentDays++;
    else if (rec.status === "Half Day") halfDays++;
    else if (rec.status === "Absent") absentDays++;
  });

  const perDaySalary = baseSalary / 30;
  const netSalary = presentDays * perDaySalary + halfDays * (perDaySalary / 2);

  return { presentDays, halfDays, absentDays, netSalary };
}

// POST: Generate payroll (single or bulk)
export async function POST(req) {
  try {
    await connectMongoose();
    const body = await req.json();
    const { employeeId, month, year, baseSalary, bulk } = body;

    if (!month || !year) {
      return NextResponse.json({ error: "Month and year required" }, { status: 400 });
    }

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    end.setHours(23, 59, 59);

    // Single employee payroll
    if (!bulk && employeeId && baseSalary) {
      const attendanceRecords = await Attendance.find({
        employeeId,
        date: { $gte: start, $lte: end },
      });

      const { presentDays, halfDays, absentDays, netSalary } =
        calculatePayroll(attendanceRecords, baseSalary);

      const payroll = await Payroll.create({
        employeeId,
        month,
        year,
        baseSalary,
        totalDays: 30,
        presentDays,
        halfDays,
        absentDays,
        netSalary,
      });

      return NextResponse.json({ message: "Payroll generated", payroll }, { status: 201 });
    }

    // Bulk payroll for all employees
    if (bulk) {
      const collections = Object.keys(mongoose.connection.collections);
      const departmentCollections = collections.filter(name => name.endsWith('_department'));
      const results = [];

      for (const collectionName of departmentCollections) {
        const collection = mongoose.connection.collections[collectionName];
        const employees = await collection.find({}).toArray();
        
        for (const emp of employees) {
          const attendanceRecords = await Attendance.find({
            employeeId: emp.employeeId,
            date: { $gte: start, $lte: end },
          });

          const empBaseSalary = emp.payroll?.salary || baseSalary;
          const { presentDays, halfDays, absentDays, netSalary } =
            calculatePayroll(attendanceRecords, empBaseSalary);

          const payroll = await Payroll.create({
            employeeId: emp.employeeId,
            month,
            year,
            baseSalary: empBaseSalary,
            totalDays: 30,
            presentDays,
            halfDays,
            absentDays,
            netSalary,
          });

          results.push(payroll);
        }
      }

      return NextResponse.json({ message: "Bulk payroll generated", payrolls: results }, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (err) {
    console.error("Payroll error:", err);
    return NextResponse.json({ error: err.message || "Failed to generate payroll" }, { status: 500 });
  }
}

// GET: Fetch payrolls
export async function GET(req) {
  try {
    await connectMongoose();
    const { searchParams } = new URL(req.url);

    const employeeId = searchParams.get("employeeId");
    let query = {};
    if (employeeId) query.employeeId = employeeId;

    const payrolls = await Payroll.find(query).sort({ year: -1, month: -1 });
    return NextResponse.json(payrolls, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed to fetch payroll" }, { status: 500 });
  }
}