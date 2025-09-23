import connectMongoose from "@/app/utilis/connectMongoose";
import User from "../../../../models/User";
import mongoose from "mongoose";
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

    // Fetch full employee details from department collections
    const allCollections = Object.keys(mongoose.connection.collections).filter(name =>
      name.endsWith("_department")
    );

    let employeeDetails = null;
    for (const coll of allCollections) {
      const collection = mongoose.connection.collections[coll];
      const doc = await collection.findOne({ employeeId });
      if (doc) {
        employeeDetails = {
          firstName: doc.firstName,
          lastName: doc.lastName,
          dob: doc.dob,
          gender: doc.gender,
          phone: doc.phone,
          joiningDate: doc.joiningDate,
          department: doc.department,
          role: doc.role,
          emergencyContact: doc.emergencyContact,
          address: doc.address
        };
        break;
      }
    }

    const fullUser = {
      ...user,
      ...employeeDetails
    };

    return NextResponse.json({ user: fullUser }, { status: 200 });
  } catch (err) {
    console.error("❌ Get User API error:", err);
    return NextResponse.json(
      { error: "Server error", details: err.message },
      { status: 500 }
    );
  }
}
