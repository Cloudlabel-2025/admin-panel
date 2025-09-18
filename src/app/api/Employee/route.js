import connectMongoose from "@/app/utilis/connectMongoose";
import Employee from "@/app/models/Employee";
import { NextResponse } from "next/server";

export  async function POST(req, res) {
    try{
        await connectMongoose();
        const body = await req.json();
        const employee = await Employee.create(body);
        return NextResponse.json(employee, {status:201} );
    }
    catch(err){
        return NextResponse.json({error: err.message},{status:500})
    } 
}

export  async function GET() {
    try{
        await connectMongoose();
        const employees = await Employee.find();
        return NextResponse.json(employees,{status:200});
    }
    catch(err){
        return NextResponse.json({error:err.message},{status:500})
    }
}