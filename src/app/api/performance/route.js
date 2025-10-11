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
     const performance = await Performance.find()
     .populate("employeeId name")
     .sort({createdAt:-1});
    return NextResponse.json(performance,{status:200});
    }
    catch(err){
    return NextResponse.json({error:err.message},{status:500});
    }
}