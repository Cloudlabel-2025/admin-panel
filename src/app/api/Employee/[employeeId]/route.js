import connectMongoose from "../../../utilis/connectMongoose";
import { createEmployeeModel } from "../../../../models/Employee";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

// Helper to find employee across all department collections
async function findEmployeeInDepartments(employeeId) {
  const departmentCollections = Object.keys(mongoose.models).filter(name =>
    name.endsWith("_department")
  );
  
  for (const collName of departmentCollections) {
    const Model = mongoose.models[collName];
    const employee = await Model.findOne({ employeeId });
    if (employee) {
      return { employee, department: collName.replace("_department", "") };
    }
  }
  return null;
}

// ✅ GET: Single employee
export async function GET(req, { params }) {
  try {
    await connectMongoose();
    const { employeeId } = await params;

    const result = await findEmployeeInDepartments(employeeId);
    if (!result) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json(result.employee, { status: 200 });
  } catch (err) {
    console.error("Error fetching employee:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ✅ PATCH: Update employee (handles department transfer)
export async function PATCH(req, { params }) {
  try {
    await connectMongoose();
    const { employeeId } = await params;
    const body = await req.json();
    const { department: newDepartment, ...updates } = body;

    const result = await findEmployeeInDepartments(employeeId);
    if (!result) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const { employee, department: oldDepartment } = result;
    const updatedData = { ...employee.toObject(), ...updates, department: newDepartment };

    // If department changed, move record
    if (newDepartment && newDepartment !== oldDepartment) {
      const OldDeptModel = createEmployeeModel(oldDepartment);
      await OldDeptModel.deleteOne({ employeeId });
      
      const NewDeptModel = createEmployeeModel(newDepartment);
      const updatedEmployee = await NewDeptModel.create(updatedData);
      
      return NextResponse.json(
        { message: "Employee updated and transferred successfully", employee: updatedEmployee },
        { status: 200 }
      );
    } else {
      const CurrentDeptModel = createEmployeeModel(oldDepartment);
      const updatedEmployee = await CurrentDeptModel.findOneAndUpdate(
        { employeeId },
        updatedData,
        { new: true }
      );
      
      return NextResponse.json(
        { message: "Employee updated successfully", employee: updatedEmployee },
        { status: 200 }
      );
    }
  } catch (err) {
    console.error("Error updating employee:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ✅ DELETE: Remove employee from department collection
export async function DELETE(req, { params }) {
  try {
    await connectMongoose();
    const { employeeId } = await params;

    const result = await findEmployeeInDepartments(employeeId);
    if (!result) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const { department } = result;
    const DeptModel = createEmployeeModel(department);
    await DeptModel.deleteOne({ employeeId });

    return NextResponse.json(
      { message: "Employee deleted successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error deleting employee:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
