import connectMongoose from "@/app/utilis/connectMongoose";

export const dynamic = "force-dynamic";
import Performance from "@/models/Performance";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function POST(req) {
    try{
     await connectMongoose();
     const body = await req.json();
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
     const employeeParam = searchParams.get("employee");
     const employeeId = searchParams.get("employeeId");
     
     let query = {};
     
     // Filter for specific employee (My Performance page)
     if (employeeParam === "true" && employeeId) {
       query.employeeId = employeeId;
     }
     
     const performance = await Performance.find(query).sort({createdAt:-1});
     
     // Fetch employee names from department collections
     const collections = Object.keys(mongoose.connection.collections);
     const departmentCollections = collections.filter(name => name.endsWith('_department'));
     
     const performanceWithNames = performance.map(perf => perf.toObject());
     
     return NextResponse.json(performanceWithNames,{status:200});
    }
    catch(err){
    return NextResponse.json({error:err.message},{status:500});
    }
}

export async function DELETE(req) {
    try{
     await connectMongoose();
     await Performance.deleteMany({});
     return NextResponse.json({message:"All performance records deleted"},{status:200});
    }
    catch(err){
    return NextResponse.json({error:err.message},{status:500});
    }
}