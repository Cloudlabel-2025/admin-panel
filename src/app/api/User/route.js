import connectMongoose from "../../utilis/connectMongoose";
import mongoose from "mongoose";
import Employee from "../../models/Employee";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectMongoose();
    const body = await req.json();
    const { department } = body;

    if (!department) return NextResponse.json({ error: "Department required" }, { status: 400 });

    // Create employee object
    const employee = new Employee(body);
    await employee.save();

    // Save in department-specific collection
    const collectionName = department.toLowerCase() + "_department";
    const DepartmentSchema = new mongoose.Schema({}, { strict: false });
    const DepartmentModel =
      mongoose.models[collectionName] ||
      mongoose.model(collectionName, DepartmentSchema, collectionName);

    await DepartmentModel.create(employee.toObject());

    return NextResponse.json({ message: "Employee saved", employee }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    await connectMongoose();
    const { searchParams } = new URL(req.url);
    const department = searchParams.get("department");

    if (!department) {
      // Fetch all employees from all departments
      const allCollections = Object.keys(mongoose.connection.collections).filter(name =>
        name.endsWith("_department")
      );

      let allEmployees = [];
      for (const coll of allCollections) {
        const collection = mongoose.connection.collections[coll];
        const docs = await collection.find().toArray();
        allEmployees = allEmployees.concat(docs);
      }
      return NextResponse.json(allEmployees, { status: 200 });
    }

    // Fetch specific department
    const collectionName = department.toLowerCase() + "_department";
    const DepartmentSchema = new mongoose.Schema({}, { strict: false });
    const DepartmentModel =
      mongoose.models[collectionName] ||
      mongoose.model(collectionName, DepartmentSchema, collectionName);

    const employees = await DepartmentModel.find();
    return NextResponse.json(employees, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
