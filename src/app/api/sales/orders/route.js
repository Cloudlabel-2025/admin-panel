import connectMongoose from "@/app/utilis/connectMongoose";

export const dynamic = "force-dynamic";
import SalesOrder from "@/models/sales/SalesOrder";
import { NextResponse } from "next/server";

export async function POST(req){
    try{
        await connectMongoose();
        const body = await req.json();
        const salesorder = await SalesOrder.create(body);
        return NextResponse.json(salesorder,{status:200});
    }
    catch(err){
        return NextResponse.json({error:err.message},{status:500});
    }
}

export async function GET(){
    try{
        await connectMongoose();
        const orders = await SalesOrder.find({})
        .populate("customer");
        return NextResponse.json(orders,{status:200});
    }
    catch(err){
        return NextResponse.json({error:err.message},{status:500});
    }
}