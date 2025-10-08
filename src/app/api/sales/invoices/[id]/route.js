import connectMongoose from "@/app/utilis/connectMongoose";
import SalesInvoice from "@/models/sales/SalesInvoice";
import { NextResponse } from "next/server";

export async function GET(req,{params}){
    try{
        await connectMongoose();
        const invoice = await SalesInvoice.findById(params.id)
        .populate("customer order");
        return NextResponse.json(invoice,{status:200});
    }
    catch(err){
     return NextResponse.json({error:err.message},{status:500});
    }
}

export async function PUT(req,{params}){
    try{
        await connectMongoose();
        const body = req.json();
        const invoice = await SalesInvoice.findByIdAndUpdate(params.id,body,{new:true});
        return NextResponse.json(invoice,{status:200});
    }
    catch(err){
     return NextResponse.json({error:err.message},{status:500});
    }
}

export async function PUT(req,{params}){
    try{
        await connectMongoose();
        await SalesInvoice.findByIdAndDelete(params.id);
        return NextResponse.json({message:"Invoice is Deleted Successfully"},{status:200});
    }
    catch(err){
     return NextResponse.json({error:err.message},{status:500});
    }
}