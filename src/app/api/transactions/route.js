import connectMongoose from "@/app/utilis/connectMongoose";

export const dynamic = "force-dynamic";
import Transaction from "@/models/accounts/Transaction";
import Account from "@/models/accounts/Account";
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
       .populate("fromAccount toAccount")
       .lean();
       return NextResponse.json(transactions,{status:200})
    }
    catch(err){
        console.error('Transactions API Error:', err);
        // Fallback: try without populate
        try {
            const transactions = await Transaction.find({}).lean();
            return NextResponse.json(transactions,{status:200})
        } catch(fallbackErr) {
            console.error('Transactions Fallback Error:', fallbackErr);
            return NextResponse.json({error:err.message},{status:500})
        }
    }
}