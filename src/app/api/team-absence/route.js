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
      console.log('Employee not found:', employeeId);
      return NextResponse.json([]);
    }
    
    console.log('Current user for team-absence:', currentUser);

    let absences = [];

    if (currentUser.role === "super-admin" || currentUser.role === "Super-admin") {
      // Super-admin sees all absences
      absences = await Absence.find({}).sort({ createdAt: -1 });
    } else if (currentUser.role === "admin" || currentUser.role === "admin-management") {
      // admin/admin-management sees all except super-admin and their own
      const allDepartmentModels = Object.keys(mongoose.models).filter(name =>
        name.endsWith("_department")
      );
      
      const employeeIds = [];
      for (const modelName of allDepartmentModels) {
        const Model = mongoose.models[modelName];
        const employees = await Model.find({ 
          role: { $nin: ["super-admin", "Super-admin"] },
          employeeId: { $ne: employeeId }
        });
        employeeIds.push(...employees.map(emp => emp.employeeId));
      }
      
      absences = await Absence.find({ 
        employeeId: { $in: employeeIds }
      }).sort({ createdAt: -1 });
    } else if (currentUser.role === "Teamlead" || currentUser.role === "Team-Lead") {
      // Team-lead sees Employee and Intern leaves from their department
      const departmentModel = mongoose.models[`${currentUser.department}_department`];
      if (departmentModel) {
        const departmentEmployees = await departmentModel.find({ 
          role: { $in: ["Employee", "Intern", "Team-admin", "Team Admin"] },
          employeeId: { $ne: employeeId }
        });
        const employeeIds = departmentEmployees.map(emp => emp.employeeId);
        console.log('Team-Lead can view leaves from:', employeeIds);
        absences = await Absence.find({ 
          employeeId: { $in: employeeIds }
        }).sort({ createdAt: -1 });
        console.log('Team-Lead absences found:', absences.length);
      }
    } else if (currentUser.role === "Team-admin" || currentUser.role === "Team Admin") {
      // Team-admin sees Employee and Intern leaves from their department
      const departmentModel = mongoose.models[`${currentUser.department}_department`];
      if (departmentModel) {
        const departmentEmployees = await departmentModel.find({ 
          role: { $in: ["Employee", "Intern"] },
          employeeId: { $ne: employeeId }
        });
        const employeeIds = departmentEmployees.map(emp => emp.employeeId);
        console.log('Team-Admin can view leaves from:', employeeIds);
        absences = await Absence.find({ 
          employeeId: { $in: employeeIds }
        }).sort({ createdAt: -1 });
        console.log('Team-Admin absences found:', absences.length);
      }
    }

    // Add employee names to absences
    const absencesWithNames = await Promise.all(
      absences.map(async (absence) => {
        const empData = await getEmployeeData(absence.employeeId);
        return {
          ...absence.toObject(),
          employeeName: empData ? empData.name : 'Unknown Employee',
          department: empData ? empData.department : absence.department
        };
      })
    );

    return NextResponse.json(absencesWithNames);
  } catch (err) {
    console.error('Error in team-absence GET:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
