import connectMongoose from "@/app/utilis/connectMongoose";
import User from "../../../../models/User";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connectMongoose();

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");

    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ employeeId }).lean();

    if (!user) {
      return NextResponse.json(
        { error: `User not found for employeeId: ${employeeId}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (err) {
    console.error("❌ Get User API error:", err); // log error in server console
    return NextResponse.json(
      { error: "Server error", details: err.message },
      { status: 500 }
    );
  }
}
