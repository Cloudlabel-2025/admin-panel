import { NextResponse } from "next/server";
import Payroll from "../../../../models/Payroll";
import connectMongoose from "@/app/utilis/connectMongoose";

export async function GET(req, { params }) {
  try {
    await connectMongoose();
    const { employeeId } = params;

    const payrolls = await Payroll.find({ employeeId }).sort({ generatedAt: -1 });
    return NextResponse.json({ success: true, payrolls });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message });
  }
}


