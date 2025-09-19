import connectMongoose from "../../../../utilis/connectMongoose";
import Employee, { EmployeeSchema } from "../../../../../models/Employee";
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

// ✅ GET: All employees from a department
export async function GET(req, { params }) {
  try {
    await connectMongoose();
    const { department } = params;

    if (!department) {
      return NextResponse.json(
        { error: "Department is required" },
        { status: 400 }
      );
    }

    const DeptModel = getDepartmentModel(department);
    const employees = await DeptModel.find();

    if (!employees.length) {
      return NextResponse.json(
        { message: `No employees found in ${department}` },
        { status: 404 }
      );
    }

    return NextResponse.json(employees, { status: 200 });
  } catch (err) {
    console.error("Error fetching department employees:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
