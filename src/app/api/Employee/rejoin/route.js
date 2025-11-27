import connectMongoose from "../../../utilis/connectMongoose";


import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectMongoose();
    const { employeeId } = await req.json();

    if (!employeeId) {
      return NextResponse.json({ error: "Employee ID required" }, { status: 400 });
    }

    const mongoose = await import('mongoose');
    const db = mongoose.default.connection.db;

    const terminatedEmployee = await db.collection('terminated_employees').findOne({ employeeId });

    if (!terminatedEmployee) {
      return NextResponse.json({ error: "Terminated employee not found" }, { status: 404 });
    }

    const { terminatedDate, terminatedBy, terminationReason, originalDepartment, ...employeeData } = terminatedEmployee;

    await db.collection(originalDepartment).insertOne(employeeData);
    await db.collection('terminated_employees').deleteOne({ employeeId });

    const User = (await import('../../../../models/User')).default;
    await User.updateOne({ employeeId }, { $set: { isTerminated: false } });

    return NextResponse.json({ 
      message: "Employee rejoined successfully",
      employeeId 
    });
  } catch (error) {
    console.error("Error rejoining employee:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
