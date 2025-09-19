import connectMongoose from "@/app/utilis/connectMongoose";
import User from "../../../../models/User";
import Employee from "../../../../models/Employee";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    await connectMongoose();
    const { email, password } = await req.json();

    if (!email || !password)
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });

    // Check if email exists in Employee collection
    const employee = await Employee.findOne({ email });
    if (!employee)
      return NextResponse.json({ error: "Email not found in employee DB" }, { status: 400 });

    // Check if user already created account
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return NextResponse.json({ error: "User already exists" }, { status: 400 });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save in User collection
    const user = await User.create({
      employeeId: employee.employeeId,
      name: employee.firstName + " " + employee.lastName,
      email,
      password: hashedPassword,
    });

    return NextResponse.json({ message: "User created successfully", user }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
