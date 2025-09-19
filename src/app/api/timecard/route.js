import connectMongoose from "@/app/utilis/connectMongoose";
import Timecard from "@/models/Timecard";
import { NextResponse } from "next/server";

export  async function POST(req,res){
    try{
    await connectMongoose();
    const data = await req.json();
    const timecard = await Timecard.create(data);
    return NextResponse.json({ message: "Timecard created", timecard }, { status: 201 });
    }
    catch(err){
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
}

export  async function GET(req,res) {
    try{
    await connectMongoose();
    const timecards = await Timecard.find().sort({date:-1});
    return NextResponse.json(timecards,{status:200});
    }
    catch(err){
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
}