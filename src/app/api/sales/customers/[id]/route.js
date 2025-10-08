import connectMongoose from "@/app/utilis/connectMongoose";
import Customer from "@/models/sales/Customer";
import { NextResponse } from "next/server";

export async function GET(req,{params}) {
    try{
        await connectMongoose();
        const customer = await Customer.findById(params.id);
        return NextResponse.json(customer,{status:200})
    }
    catch(err){
        return NextResponse.json({error:err.message},{status:500});
    }
}

export async function PUT(req,{params}) {
    try{
        await connectMongoose();
        const body = await req.json();
        const customer = await Customer.findByIdAndUpdate(params.id,body,{new:true});
        return NextResponse.json(customer,{status:200})
    }
    catch(err){
        return NextResponse.json({error:err.message},{status:500});
    }
}

export async function DELETE(req, {params}) {
    try{
        await connectMongoose();
        await Customer.findByIdAndUpdate(params.id);
        return NextResponse.json({message:"Deleted Successfully"},{status:200});
    }
    catch(err){
        return NextResponse.json({error:err.message},{status:500});
    }
}