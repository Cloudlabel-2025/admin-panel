import connectMongoose from "../../utilis/connectMongoose";
import Employee from "../../../models/Employee";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

// helper: find the latest employeeId across all departments
async function getNextEmployeeId() {
  const departmentCollections = Object.keys(mongoose.models).filter(name =>
    name.endsWith("_department")
  );

  let maxId = 0;

  for (const collName of departmentCollections) {
    const Model = mongoose.models[collName];
    const lastEmp = await Model.findOne().sort({ employeeId: -1 }).exec();

    if (lastEmp && lastEmp.employeeId) {
      const num = parseInt(lastEmp.employeeId.replace("CHC", ""));
      if (num > maxId) maxId = num;
    }
  }

  const nextId = maxId + 1;
  return "CHC" + nextId.toString().padStart(4, "0");
}

export async function POST(req) {
  try {
    await connectMongoose();

    const body = await req.json();
    const { email, phone, emergencyContact, department } = body;

    if (!email || !phone || !emergencyContact?.contactNumber || !department) {
      return NextResponse.json(
        { error: "Please fill Email, Phone, Department and Emergency Contact Number." },
        { status: 400 }
      );
    }

    // Build department collection name
    const collectionName = department.toLowerCase() + "_department";
    const DepartmentModel =
      mongoose.models[collectionName] ||
      mongoose.model(collectionName, Employee.schema, collectionName);

    // Duplicate check across ALL departments
    const departmentCollections = Object.keys(mongoose.models).filter(name =>
      name.endsWith("_department")
    );

    for (const collName of departmentCollections) {
      const Model = mongoose.models[collName];
      const dup = await Model.findOne({
        $or: [
          { email },
          { phone },
          { "emergencyContact.contactNumber": emergencyContact.contactNumber },
        ],
      });
      if (dup) {
        return NextResponse.json(
          { error: "Employee with same email/phone/emergency contact exists already" },
          { status: 400 }
        );
      }
    }

    // Generate global employeeId
    const employeeId = await getNextEmployeeId();

    // Save directly in department collection
    const employee = await DepartmentModel.create({ ...body, employeeId });

    return NextResponse.json(
      { message: "Employee created successfully", employee },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creating employee:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
