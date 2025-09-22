import connectMongoose from "@/app/utilis/connectMongoose";
import User from "../../../../models/User";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    await connectMongoose();
    const { email, password } = await req.json();
    if (!email || !password)
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });

    // Search email in all department collections
    const allCollections = Object.keys(mongoose.connection.collections).filter(name =>
      name.endsWith("_department")
    );

    let employee = null;
    for (const coll of allCollections) {
      const collection = mongoose.connection.collections[coll];
      const doc = await collection.findOne({ email });
      if (doc) {
        employee = doc;
        break;
      }
    }

    if (!employee) return NextResponse.json({ error: "Email not found in Employee DB" }, { status: 400 });

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return NextResponse.json({ error: "User already exists" }, { status: 400 });

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
