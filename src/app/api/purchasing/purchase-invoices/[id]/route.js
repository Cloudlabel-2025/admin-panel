import connectMongoose from "@/app/utilis/connectMongoose";
import PurchaseInvoice from "@/models/purchasing/PurchaseInvoice";
import { NextResponse } from "next/server";

export async function GET(req,{params}){
    try{
      await connectMongoose();
      const invoice = await PurchaseInvoice.findById(params.id)
      .populate("vendor order");
      return NextResponse.json(invoice,{status:200});
    }
    catch(err){
        return NextResponse.json({error:err.message},{status:500})
    }
}

export async function PUT(req,{params}){
    try{
      await connectMongoose();
      const body = req.json();
      const invoice = await PurchaseInvoice.findByIdAndUpdate(params.id,body,{new:true});
      return NextResponse.json(invoice,{status:200});
    }
    catch(err){
        return NextResponse.json({error:err.message},{status:500})
    }
}

export async function DELETE(req,{params}){
    try{
      await connectMongoose();
      await PurchaseInvoice.findByIdAndDelete(params.id);
      return NextResponse.json({message:"Purchase invoice is Deleted"},{status:200});
    }
    catch(err){
        return NextResponse.json({error:err.message},{status:500})
    }
}

