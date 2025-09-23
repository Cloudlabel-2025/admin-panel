import connectMongoose from "@/app/utilis/connectMongoose";
import User from "../../../models/User";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectMongoose();
    const { email, password } = await req.json();
    if (!email || !password)
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );

    // Search in all department collections
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
    if (!employee)
      return NextResponse.json(
        { error: "Employee email not found" },
        { status: 400 }
      );

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );

    const user = await User.create({
      employeeId: employee.employeeId,
      name: `${employee.firstName} ${employee.lastName}`,
      email,
      password, // In production, hash the password
    });
    return NextResponse.json(
      { message: "User created", user },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
