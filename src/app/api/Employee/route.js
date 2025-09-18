import connectMongoose from "../../utilis/connectMongoose";
import Employee from "../../models/Employee";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function POST(req) {
  try {
    await connectMongoose();

    const body = await req.json();
    const { department } = body;

    if (!department) {
      return NextResponse.json(
        { error: "Department is required" },
        { status: 400 }
      );
    }

    // 1️⃣ Save in main employees collection
    const employee = await Employee.create(body);

    // 2️⃣ Save in dynamic department collection with flexible schema
    const collectionName = department.toLowerCase() + "_department";
    const DepartmentSchema = new mongoose.Schema({}, { strict: false });
    const DepartmentModel =
      mongoose.models[collectionName] ||
      mongoose.model(collectionName, DepartmentSchema, collectionName);

    await DepartmentModel.create(body);

    return NextResponse.json(
      {
        message: `Employee saved in employees and ${collectionName} collections`,
        employee,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creating employee:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    await connectMongoose();

    const { searchParams } = new URL(req.url);
    const department = searchParams.get("department"); // optional query param

    if (department) {
      // Fetch from dynamic department collection
      const collectionName = department.toLowerCase() + "_department";
      const DepartmentSchema = new mongoose.Schema({}, { strict: false });
      const DepartmentModel =
        mongoose.models[collectionName] ||
        mongoose.model(collectionName, DepartmentSchema, collectionName);

      const employees = await DepartmentModel.find();
      return NextResponse.json(employees, { status: 200 });
    } else {
      // Fetch all employees from main collection
      const employees = await Employee.find();
      return NextResponse.json(employees, { status: 200 });
    }
  } catch (err) {
    console.error("Error fetching employees:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
