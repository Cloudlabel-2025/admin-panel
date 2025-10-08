import connectMongoose from "@/app/utilis/connectMongoose";
import Transaction from "@/models/accounts/Transaction";
import { NextResponse } from "next/server";

export async function GET(req){
try{
    await connectMongoose();
    const {searchParams} = new URL(req.url);
    const type = searchParams.get("type");
    const start = new Date(searchParams.get("startDate"));
    const end = new Date(searchParams.get("endDate"));

    const transactions = await Transaction.find({
        type,
        date:{$gte:start ,$gte:end}
    }).populate("fromAccount toAccount");
    return NextResponse.json(transactions,{status:200});
}
catch(err){
    return NextResponse.json({error:err.message},{status:500})
}
}
