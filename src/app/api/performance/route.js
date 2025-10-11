import connectMongoose from "@/app/utilis/connectMongoose";
import Performance from "@/models/Performance";
import { NextResponse } from "next/server";

export async function POST(req) {
    try{
    await connectMongoose();
     const body =await req.json();
     const performance = await Performance.create(body);
     return NextResponse.json(performance,{status:200});
    }
    catch(err){
    return NextResponse.json({error:err.message},{status:500});
    }
}

export async function GET() {
    try{
     await connectMongoose();
     const performance = await Performance.find()
     .populate("employeeId","name")
     .sort({createdAt:-1});
    return NextResponse.json(performance,{status:200});
    }
    catch(err){
    return NextResponse.json({error:err.message},{status:500});
    }
}