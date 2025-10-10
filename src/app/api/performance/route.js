import connectMongoose from "@/app/utilis/connectMongoose";
import Performance from "@/models/Performance";
import { NextResponse } from "next/server";

await connectMongoose();

export async function POST(req) {
    try{
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
     const { searchParams } = new URL(req.url);
     const employeeId = searchParams.get("employeeId");
     const isEmployee = searchParams.get("employee") === "true";
     
     let query = {};
     if (isEmployee && employeeId) {
       // Find user by employeeId first
       const User = (await import("@/models/User")).default;
       const user = await User.findOne({ employeeId });
       if (user) {
         query.employeeId = user._id;
       }
     }
     
     const performance = await Performance.find(query)
     .populate("employeeId", "employeeId name email")
     .sort({createdAt:-1});
    return NextResponse.json(performance,{status:200});
    }
    catch(err){
    return NextResponse.json({error:err.message},{status:500});
    }
}