import connectMongoose from "@/app/utilis/connectMongoose";
import SalesOrder from "@/models/sales/SalesOrder";
import { NextResponse } from "next/server";

export async function GET(req,{params}){
    try{
        await connectMongoose();
        const order = await SalesOrder.findById(params.id)
        .populate("customer");
        return NextResponse.json(order,{status:200});
    }
    catch(err){
        return NextResponse.json({error:err.message},{status:500});
    }
}

export async function PUT(req,{params}){
    try{
        await connectMongoose();
        const body = req.json();
        const order = await SalesOrder.findByIdAndUpdate(params.id,body,{new:true});
        return NextResponse.json(order,{status:200});
    }
    catch(err){
        return NextResponse.json({error:err.message},{status:500});
    }
}

export async function DELETE(req,{params}){
    try{
        await connectMongoose();
        await SalesOrder.findByIdAndDelete(params.id);
        return NextResponse.json({message:"Sales Order Deleted Successfully"},{status:200});
    }
    catch(err){
        return NextResponse.json({error:err.message},{status:500});
    }
}