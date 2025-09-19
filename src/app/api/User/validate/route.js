import connectMongoose from "../../../utilis/connectMongoose";
import User from "../../../../models/User";
import Employee from "../../../../models/Employee"
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectMongoose();

    const { email } = await req.json();
    if (!email)
      return NextResponse.json({ error: "Email required" }, { status: 400 });

    // Check email exists in Employee DB
    const employee = await Employee.findOne({ email });
    if (!employee)
      return NextResponse.json(
        { error: "Email not found in Employee DB" },
        { status: 400 }
      );

    // Check if user already signed up
    const userExists = await User.findOne({ email });
    if (userExists)
      return NextResponse.json(
        { error: "User already signed up" },
        { status: 400 }
      );

    return NextResponse.json({ message: "Email valid, can create account", employee });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
