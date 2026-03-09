import connectMongoose from "@/app/utilis/connectMongoose";


import { NextResponse } from "next/server";
import mongoose from "mongoose";

// 🔹 Get employees from all departments or specific department
export async function GET(req) {
  try {
    await connectMongoose();

    const { searchParams } = new URL(req.url);
    const department = searchParams.get('department');

    const collections = await mongoose.connection.db.listCollections().toArray();
    const departmentCollections = collections
      .map(c => c.name)
      .filter(name => name.endsWith("_department"));

    let allEmployees = [];

    const { createEmployeeModel } = await import("@/models/Employee");

    for (const collName of departmentCollections) {
      const departmentName = collName.replace("_department", "");

      // If department filter is specified, only get from that department
      if (department) {
        if (departmentName.toLowerCase() !== department.toLowerCase()) {
          continue;
        }
      }

      const Model = createEmployeeModel(departmentName);
      const employees = await Model.find();
      allEmployees = allEmployees.concat(employees);
    }

    return NextResponse.json({ employees: allEmployees }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 🔹 Search employee by ID across all departments
export async function POST(req) {
  try {
    await connectMongoose();
    const { employeeId } = await req.json();

    if (!employeeId) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
    }

    const collections = await mongoose.connection.db.listCollections().toArray();
    const departmentCollections = collections
      .map(c => c.name)
      .filter(name => name.endsWith("_department"));

    const { createEmployeeModel } = await import("@/models/Employee");

    for (const collName of departmentCollections) {
      const departmentName = collName.replace("_department", "");
      const Model = createEmployeeModel(departmentName);
      const employee = await Model.findOne({ employeeId });
      if (employee) {
        return NextResponse.json({ employee }, { status: 200 });
      }
    }

    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
