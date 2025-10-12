import connectMongoose from "@/app/utilis/connectMongoose";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

// 🔹 Get employees from all departments or specific department
export async function GET(req) {
  try {
    await connectMongoose();
    
    const { searchParams } = new URL(req.url);
    const department = searchParams.get('department');
    
    const departmentCollections = Object.keys(mongoose.models).filter(name =>
      name.endsWith("_department")
    );
    
    let allEmployees = [];
    
    for (const collName of departmentCollections) {
      // If department filter is specified, only get from that department
      if (department) {
        const expectedCollectionName = `${department.toLowerCase()}_department`;
        if (collName.toLowerCase() !== expectedCollectionName) {
          continue;
        }
      }
      
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
