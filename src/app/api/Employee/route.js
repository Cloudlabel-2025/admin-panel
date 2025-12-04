import connectMongoose from "../../utilis/connectMongoose";


import { createEmployeeModel } from "../../../models/Employee";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireRole, requireAuth } from "../../utilis/authMiddleware";

// helper: find the latest employeeId across all departments
async function getNextEmployeeId() {
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  const departmentCollections = collections
    .map(col => col.name)
    .filter(name => name.endsWith("_department"));

  let maxId = 0;

  for (const collName of departmentCollections) {
    const collection = db.collection(collName);
    const lastEmp = await collection.findOne({}, { sort: { employeeId: -1 } });

    if (lastEmp && lastEmp.employeeId) {
      const num = parseInt(lastEmp.employeeId.replace("CHC", ""));
      if (num > maxId) maxId = num;
    }
  }

  const nextId = maxId + 1;
  return "CHC" + nextId.toString().padStart(4, "0");
}

export async function GET() {
  try {
    await connectMongoose();
    const db = mongoose.connection.db;
    
    const collections = await db.listCollections().toArray();
    const departmentCollections = collections
      .map((col) => col.name)
      .filter((name) => name.endsWith("_department"));

    let allEmployees = [];

    for (const collName of departmentCollections) {
      const collection = db.collection(collName);
      const employees = await collection.find({}).toArray();
      allEmployees = allEmployees.concat(employees);
    }

    return NextResponse.json(allEmployees);
  } catch (err) {
    console.error("Error fetching employees:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function handlePOST(req) {
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

    // Create department-specific model
    const DepartmentModel = createEmployeeModel(department);

    // Duplicate check across ALL departments
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const departmentCollections = collections
      .map(col => col.name)
      .filter(name => name.endsWith("_department"));

    for (const collName of departmentCollections) {
      const collection = db.collection(collName);
      const dup = await collection.findOne({
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

export const POST = requireRole(["super-admin", "admin", "developer"])(handlePOST);
