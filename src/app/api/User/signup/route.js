import connectMongoose from "@/app/utilis/connectMongoose";

export const dynamic = "force-dynamic";
import User from "../../../../models/User";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    await connectMongoose();
    const { email, password } = await req.json();
    console.log('Signup attempt for email:', email);
    
    if (!email || !password)
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });

    // Search email in all department collections
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const departmentCollections = collections
      .map(col => col.name)
      .filter(name => name.endsWith('_department'));
    
    console.log('Available department collections:', departmentCollections);

    let employee = null;
    for (const collName of departmentCollections) {
      const collection = db.collection(collName);
      const doc = await collection.findOne({ email });
      console.log(`Searching in ${collName} for email ${email}:`, doc ? 'Found' : 'Not found');
      if (doc) {
        employee = doc;
        break;
      }
    }

    if (!employee) {
      console.log('Employee not found in any department collection for email:', email);
      return NextResponse.json({ error: "Email not found in Employee DB. Please contact admin to create your employee record first." }, { status: 400 });
    }

    console.log('Employee found:', { employeeId: employee.employeeId, role: employee.role });

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists for email:', email);
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save in User collection
    const user = await User.create({
      employeeId: employee.employeeId,
      name: employee.firstName + " " + employee.lastName,
      email,
      password: hashedPassword,
      role: employee.role || "Employee",
    });

    console.log('User created successfully:', { employeeId: user.employeeId, role: user.role });
    return NextResponse.json({ message: "User created successfully", user: { employeeId: user.employeeId, name: user.name, email: user.email, role: user.role } }, { status: 201 });
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
