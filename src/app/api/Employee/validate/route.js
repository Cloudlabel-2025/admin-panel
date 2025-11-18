import connectMongoose from "../../../utilis/connectMongoose";

export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

// ✅ POST: Validate if fields already exist
export async function POST(req) {
  try {
    await connectMongoose();
    const { employeeId, email, phone, emergencyContact } = await req.json();

    if (!employeeId && !email && !phone && !emergencyContact?.contactNumber) {
      return NextResponse.json(
        { error: "At least one field is required to validate" },
        { status: 400 }
      );
    }

    const departmentCollections = Object.keys(mongoose.models).filter(name =>
      name.endsWith("_department")
    );
    
    let duplicate = null;
    let field = null;

    // Check across all department collections
    for (const collName of departmentCollections) {
      const Model = mongoose.models[collName];
      
      if (employeeId && !duplicate) {
        duplicate = await Model.findOne({ employeeId });
        if (duplicate) field = "Employee ID";
      }
      if (email && !duplicate) {
        duplicate = await Model.findOne({ email });
        if (duplicate) field = "Email";
      }
      if (phone && !duplicate) {
        duplicate = await Model.findOne({ phone });
        if (duplicate) field = "Phone";
      }
      if (emergencyContact?.contactNumber && !duplicate) {
        duplicate = await Model.findOne({
          "emergencyContact.contactNumber": emergencyContact.contactNumber,
        });
        if (duplicate) field = "Emergency Contact Number";
      }
      
      if (duplicate) break;
    }

    if (duplicate) {
      return NextResponse.json({ exists: true, field }, { status: 200 });
    }

    return NextResponse.json({ exists: false }, { status: 200 });
  } catch (err) {
    console.error("Error validating employee:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
