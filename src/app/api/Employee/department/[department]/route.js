import connectMongoose from "../../../../utilis/connectMongoose";
import { createEmployeeModel } from "../../../../../models/Employee";
import { NextResponse } from "next/server";

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

    const DeptModel = createEmployeeModel(department);
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
