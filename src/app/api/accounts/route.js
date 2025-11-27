import connectMongoose from "@/app/utilis/connectMongoose";


import Account from "@/models/accounts/Account";
import { NextResponse } from "next/server";

export async function POST(req){
    try{
        await connectMongoose();
        const body = await req.json();
        const account = await Account.create(body);
        return NextResponse.json(account,{status:201});
    }
    catch(err){
        return NextResponse.json({error:err.message},{status:500});
    }
}

export async function GET(){
    try{
        await connectMongoose();
        const accounts = await Account.find();
        return NextResponse.json(accounts,{status:200});
    }
    catch(err){
        return NextResponse.json({error:err.message},{status:500});
    }
}
