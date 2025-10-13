import connectMongoose from "@/app/utilis/connectMongoose";
import Vendor from "@/models/purchasing/Vendor";
import { NextResponse } from "next/server";

export async function GET(req,{params}) {
    try{
        await connectMongoose();
        const { id } = await params;
        const vendor = await Vendor.findById(id);
        return NextResponse.json(vendor,{status:200});
    }
    catch(err){
        return NextResponse.json({error:err.message},{status:500});
    }
}

export async function PUT(req,{params}) {
    try{
        await connectMongoose();
        const { id } = await params;
        const body = await req.json();
        const vendor = await Vendor.findByIdAndUpdate(id,body,{new:true});
        return NextResponse.json(vendor,{status:200})
    }
    catch(err){
        return NextResponse.json({error:err.message},{status:500});
    }
}

export async function DELETE(req,{params}) {
    try{
        await connectMongoose();
        const { id } = await params;
        await Vendor.findByIdAndDelete(id);
        return NextResponse.json({message: "Vendor deleted"},{status:200});
    }
    catch(err){
        return NextResponse.json({error:err.message},{status:500});
    }
}