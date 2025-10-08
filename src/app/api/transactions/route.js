import connectMongoose from "@/app/utilis/connectMongoose";
import Transaction from "@/models/accounts/Transaction";
import { NextResponse } from "next/server";

export async function POST(req){
    try{
    await connectMongoose();
    const body = await req.json();
    const transaction = await Transaction.create(body);
    return NextResponse.json(transaction,{status:201});
    }
    catch(err){
        return NextResponse.json({error:err.message},{status:500})
    }
}

export async function GET(){
    try{
       await connectMongoose();
       const transactions = await Transaction.find({})
       .populate("fromAccount toAccount");
       return NextResponse.json(transactions,{status:200})
    }
    catch(err){
        return NextResponse.json({error:err.message},{status:500})
    }
}