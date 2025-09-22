import connectMongoose from "@/app/utilis/connectMongoose";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

// 🔹 Get all employees from all departments
export async function GET() {
  try {
    await connectMongoose();
    
    const departmentCollections = Object.keys(mongoose.models).filter(name =>
      name.endsWith("_department")
    );
    
    let allEmployees = [];
    
    for (const collName of departmentCollections) {
      const Model = mongoose.models[collName];
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

    const departmentCollections = Object.keys(mongoose.models).filter(name =>
      name.endsWith("_department")
    );
    
    for (const collName of departmentCollections) {
      const Model = mongoose.models[collName];
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
