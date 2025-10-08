import connectMongoose from "@/app/utilis/connectMongoose";
import Vendor from "@/models/purchasing/Vendor";
import { NextResponse } from "next/server";

export async function GET(req,{params}) {
    try{
        await connectMongoose();
        const vendor = await Vendor.findById(params.id);
        return NextResponse.json(vendor,{status:200});
    }
    catch(err){
        return NextResponse.json({error:err.message},{status:500});
    }
}

export async function PUT(req,{params}) {
    try{
        await connectMongoose();
        const body = await req.json();
        const vendor = await Vendor.findByIdAndUpdate(params.id,body,{new:true});
        return NextResponse.json(vendor,{status:200})
    }
    catch(err){
        return NextResponse.json({error:err.message},{status:500});
    }
}

export async function DELETE(req,{params}) {
    try{
        await connectMongoose();
        await Vendor.findByIdAndDelete(params.id);
        return NextResponse.json({message: "Vendor deleted"},{status:200});
    }
    catch(err){
        return NextResponse.json({error:err.message},{status:500});
    }
}