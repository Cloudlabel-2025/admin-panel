import connectMongoose from "../../../utilis/connectMongoose";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectMongoose();
    const { employeeId, terminatedBy, reason } = await req.json();

    if (!employeeId) {
      return NextResponse.json({ error: "Employee ID required" }, { status: 400 });
    }

    const mongoose = await import('mongoose');
    const db = mongoose.default.connection.db;
    
    const collections = await db.listCollections().toArray();
    const departmentCollections = collections
      .map(col => col.name)
      .filter(name => name.endsWith('_department'));

    let employeeData = null;
    let sourceCollection = null;

    for (const collName of departmentCollections) {
      const employee = await db.collection(collName).findOne({ employeeId });
      if (employee) {
        employeeData = employee;
        sourceCollection = collName;
        break;
      }
    }

    if (!employeeData) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const terminatedEmployee = {
      ...employeeData,
      terminatedDate: new Date(),
      terminatedBy,
      terminationReason: reason || "Not specified",
      originalDepartment: sourceCollection
    };

    await db.collection('terminated_employees').insertOne(terminatedEmployee);
    await db.collection(sourceCollection).deleteOne({ employeeId });

    const User = (await import('../../../../models/User')).default;
    await User.updateOne({ employeeId }, { $set: { isTerminated: true } });

    return NextResponse.json({ 
      message: "Employee terminated successfully",
      employeeId 
    });
  } catch (error) {
    console.error("Error terminating employee:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
