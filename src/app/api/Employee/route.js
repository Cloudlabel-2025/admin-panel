import connectMongoose from "../../utilis/connectMongoose";
import Employee, { EmployeeSchema } from "../../../models/Employee";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

// 🔹 Utility to get department model dynamically
function getDepartmentModel(department) {
  const collectionName = department.toLowerCase() + "_department";
  return (
    mongoose.models[collectionName] ||
    mongoose.model(collectionName, EmployeeSchema, collectionName)
  );
}

// ✅ POST: Create new employee with duplicate checks
export async function POST(req) {
  try {
    await connectMongoose();
    const body = await req.json();
    const { employeeId, email, phone, emergencyContact, department } = body;

    if (!employeeId || !email || !phone || !emergencyContact?.contactNumber || !department) {
      return NextResponse.json(
        { error: "employeeId, email, phone, emergency contact, and department are required" },
        { status: 400 }
      );
    }

    // 🔎 Check for duplicates
    const duplicate = await Employee.findOne({
      $or: [
        { employeeId },
        { email },
        { phone },
        { "emergencyContact.contactNumber": emergencyContact.contactNumber },
      ],
    });

    if (duplicate) {
      return NextResponse.json(
        { error: "Employee with same ID, email, phone, or emergency contact already exists" },
        { status: 400 }
      );
    }

    // ✅ Save in main collection
    const employee = await Employee.create(body);

    // ✅ Save in department collection
    const DepartmentModel = getDepartmentModel(department);
    await DepartmentModel.create(body);

    return NextResponse.json(
      { message: "Employee created successfully", employee },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creating employee:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

