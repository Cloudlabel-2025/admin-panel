import connectMongoose from "@/app/utilis/connectMongoose";
import PettyCash from "@/models/accounts/PettyCash";
import Account from "@/models/accounts/Account";
import Transaction from "@/models/accounts/Transaction";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectMongoose();
    const entries = await PettyCash.find().sort({ date: -1 });
    return NextResponse.json(entries, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectMongoose();
    const body = await req.json();
    
    // Create petty cash entry
    const entry = await PettyCash.create(body);
    
    // Find or create Petty Cash account
    let pettyCashAccount = await Account.findOne({ name: "Petty Cash" });
    if (!pettyCashAccount) {
      pettyCashAccount = await Account.create({
        name: "Petty Cash",
        type: "Asset",
        balance: 0,
        description: "Petty Cash Account"
      });
    }
    
    // Update account balance
    const amount = body.type === 'in' ? body.amount : -body.amount;
    await Account.findByIdAndUpdate(pettyCashAccount._id, {
      $inc: { balance: amount }
    });
    
    // Create corresponding transaction
    await Transaction.create({
      fromAccount: body.type === 'out' ? pettyCashAccount._id : null,
      toAccount: body.type === 'in' ? pettyCashAccount._id : null,
      type: body.type === 'in' ? 'Credit' : 'Debit',
      amount: body.amount,
      description: body.description,
      date: body.date,
      source: 'petty-cash'
    });
    
    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}