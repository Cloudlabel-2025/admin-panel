import connectMongoose from "@/app/utilis/connectMongoose";
import Performance from "@/models/Performance";
import { NextResponse } from "next/server";

export async function POST(req) {
    try{
     const body = req.json();
     const performance = await Performance.create(body);
     return NextResponse.json(performance,{status:201});
    }
    catch(err){
    return NextResponse.json({error:err.message},{status:500});
    }
}

export async function GET(req) {
    try{
     await connectMongoose();
     const { searchParams } = new URL(req.url);
     const userRole = searchParams.get("userRole");
     const userDepartment = searchParams.get("userDepartment");
     
     let query = {};
     
     // Filter by department for team roles
     if ((userRole === "Team-Lead" || userRole === "Team-admin") && userDepartment) {
       // Get employees from the same department
       const mongoose = require('mongoose');
       const departmentModels = Object.keys(mongoose.models).filter(name =>
         name.endsWith("_department")
       );
       
       let departmentEmployeeIds = [];
       for (const modelName of departmentModels) {
         if (modelName === `${userDepartment}_department`) {
           const Model = mongoose.models[modelName];
           const employees = await Model.find({ role: { $ne: "Team-Lead" } });
           departmentEmployeeIds = employees.map(emp => emp.employeeId);
           break;
         }
       }
       
       if (departmentEmployeeIds.length > 0) {
         query.employeeId = { $in: departmentEmployeeIds };
       }
     }
     
     const performance = await Performance.find(query)
     .populate("employeeId name")
     .sort({createdAt:-1});
    return NextResponse.json(performance,{status:200});
    }
    catch(err){
    return NextResponse.json({error:err.message},{status:500});
    }
}