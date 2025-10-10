import { NextResponse } from "next/server";
import Payroll from "../../../models/Payroll";
import connectMongoose from "@/app/utilis/connectMongoose";

export async function GET(req) {
  try {
    await connectMongoose();
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    
    let query = {};
    if (employeeId) query.employeeId = employeeId;
    
    const payrolls = await Payroll.find(query).sort({ createdAt: -1 });
    return NextResponse.json(payrolls);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectMongoose();
    const { employeeId, employeeInfo, attendance, calculations, createdAt } = await req.json();
    
    if (!employeeId || !calculations) {
      return NextResponse.json({ error: "Missing required data" }, { status: 400 });
    }
    
    const payroll = await Payroll.create({
      employeeId,
      employeeName: employeeInfo?.name || employeeId,
      department: employeeInfo?.department || "-",
      designation: employeeInfo?.designation || "-",
      grossSalary: calculations.gross,
      basicSalary: calculations.basic,
      hra: calculations.hra,
      da: calculations.da,
      conveyance: calculations.conveyance,
      medical: calculations.medical,
      bonus: calculations.bonus,
      weekendWork: calculations.weekendWork,
      totalEarnings: calculations.totalEarnings,
      pf: calculations.pf,
      esi: calculations.esi,
      lopAmount: calculations.lopAmount,
      lopDays: calculations.lopDays,
      loanDeduction: calculations.loanDeduction,
      totalDeductions: calculations.totalDeductions,
      netPay: calculations.netPay,
      presentDays: calculations.presentDays,
      expectedWorkingDays: calculations.expectedWorkingDays,
      createdAt: createdAt || new Date()
    });
    
    return NextResponse.json({ success: true, payroll });
  } catch (err) {
    console.error("Payroll creation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
