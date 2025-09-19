import connectMongoose from "../../../utilis/connectMongoose";
import Employee from "../../../../models/Employee";
import { NextResponse } from "next/server";

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

    let duplicate = null;
    let field = null;

    if (employeeId) {
      duplicate = await Employee.findOne({ employeeId });
      if (duplicate) field = "Employee ID";
    }
    if (!duplicate && email) {
      duplicate = await Employee.findOne({ email });
      if (duplicate) field = "Email";
    }
    if (!duplicate && phone) {
      duplicate = await Employee.findOne({ phone });
      if (duplicate) field = "Phone";
    }
    if (!duplicate && emergencyContact?.contactNumber) {
      duplicate = await Employee.findOne({
        "emergencyContact.contactNumber": emergencyContact.contactNumber,
      });
      if (duplicate) field = "Emergency Contact Number";
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
