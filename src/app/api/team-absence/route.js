import { NextResponse } from "next/server";
import Absence from "@/models/Absence";
import connectMongoose from "@/app/utilis/connectMongoose";
import mongoose from "mongoose";

async function getEmployeeData(employeeId) {
  try {
    const departmentModels = Object.keys(mongoose.models).filter(name =>
      name.endsWith("_department")
    );
    
    for (const modelName of departmentModels) {
      const Model = mongoose.models[modelName];
      const employee = await Model.findOne({ employeeId });
      if (employee) {
        return {
          name: `${employee.firstName} ${employee.lastName}`,
          department: modelName.replace("_department", ""),
          email: employee.email,
          role: employee.role
        };
      }
    }
  } catch (error) {
    console.error('Error fetching employee:', error);
  }
  return null;
}

export async function GET(req) {
  try {
    await connectMongoose();
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    
    if (!employeeId) {
      return NextResponse.json({ error: "Employee ID required" }, { status: 400 });
    }

    const currentUser = await getEmployeeData(employeeId);
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let absences = [];

    if (currentUser.role === "super-admin" || currentUser.role === "admin") {
      // Admin sees all absences
      absences = await Absence.find({}).sort({ createdAt: -1 });
    } else if (currentUser.role === "Team-Lead" || currentUser.role === "Team-admin") {
      // Team roles see only their department's absences
      const departmentModel = mongoose.models[`${currentUser.department}_department`];
      if (departmentModel) {
        const departmentEmployees = await departmentModel.find({});
        const employeeIds = departmentEmployees.map(emp => emp.employeeId);
        absences = await Absence.find({ 
          employeeId: { $in: employeeIds },
          employeeId: { $ne: employeeId } // Exclude their own requests
        }).sort({ createdAt: -1 });
      }
    }

    // Add employee names to absences
    const absencesWithNames = await Promise.all(
      absences.map(async (absence) => {
        const empData = await getEmployeeData(absence.employeeId);
        return {
          ...absence.toObject(),
          employeeName: empData ? empData.name : 'Unknown Employee'
        };
      })
    );

    return NextResponse.json(absencesWithNames);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}