import connectMongoose from "../../../utilis/connectMongoose";
import Employee, { EmployeeSchema } from "../../../../models/Employee";
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

// ✅ GET: Single employee
export async function GET(req, { params }) {
  try {
    await connectMongoose();
    const { employeeId } = params;

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json(employee, { status: 200 });
  } catch (err) {
    console.error("Error fetching employee:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ✅ PATCH: Update employee (handles department transfer)
export async function PATCH(req, { params }) {
  try {
    await connectMongoose();
    const { employeeId } = params;
    const body = await req.json();
    const { department, ...updates } = body;

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const oldDepartment = employee.department;

    // Update main employee
    employee.set({ ...updates, department });
    await employee.save();

    // If department changed, move record
    if (department && department !== oldDepartment) {
      if (oldDepartment) {
        const OldDeptModel = getDepartmentModel(oldDepartment);
        await OldDeptModel.deleteOne({ employeeId });
      }
      const NewDeptModel = getDepartmentModel(department);
      await NewDeptModel.create(employee.toObject());
    } else if (department) {
      const CurrentDeptModel = getDepartmentModel(department);
      await CurrentDeptModel.updateOne({ employeeId }, employee.toObject());
    }

    return NextResponse.json(
      { message: "Employee updated successfully", employee },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error updating employee:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ✅ DELETE: Remove employee (main + department collection)
export async function DELETE(req, { params }) {
  try {
    await connectMongoose();
    const { employeeId } = params;

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const department = employee.department;

    await Employee.deleteOne({ employeeId });

    if (department) {
      const DeptModel = getDepartmentModel(department);
      await DeptModel.deleteOne({ employeeId });
    }

    return NextResponse.json(
      { message: "Employee deleted successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error deleting employee:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
