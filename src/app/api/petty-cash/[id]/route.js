import connectMongoose from "@/app/utilis/connectMongoose";

export const dynamic = "force-dynamic";
import PettyCash from "@/models/accounts/PettyCash";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    await connectMongoose();
    const resolvedParams = await params;
    const entry = await PettyCash.findById(resolvedParams.id);
    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }
    return NextResponse.json(entry, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await connectMongoose();
    const resolvedParams = await params;
    const body = await req.json();
    
    // Get original entry to calculate balance difference
    const originalEntry = await PettyCash.findById(resolvedParams.id);
    if (!originalEntry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }
    
    // Update entry
    const updatedEntry = await PettyCash.findByIdAndUpdate(resolvedParams.id, body, { new: true });
    
    // Find Petty Cash account and update balance
    const pettyCashAccount = await Account.findOne({ name: "Petty Cash" });
    if (pettyCashAccount) {
      // Reverse original amount
      const originalAmount = originalEntry.type === 'in' ? -originalEntry.amount : originalEntry.amount;
      // Apply new amount
      const newAmount = body.type === 'in' ? body.amount : -body.amount;
      const balanceChange = originalAmount + newAmount;
      
      await Account.findByIdAndUpdate(pettyCashAccount._id, {
        $inc: { balance: balanceChange }
      });
    }
    
    return NextResponse.json(updatedEntry, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectMongoose();
    const resolvedParams = await params;
    
    // Get entry before deletion to update account balance
    const entry = await PettyCash.findById(resolvedParams.id);
    if (entry) {
      // Find Petty Cash account and reverse the balance
      const pettyCashAccount = await Account.findOne({ name: "Petty Cash" });
      if (pettyCashAccount) {
        const amount = entry.type === 'in' ? -entry.amount : entry.amount;
        await Account.findByIdAndUpdate(pettyCashAccount._id, {
          $inc: { balance: amount }
        });
      }
    }
    
    await PettyCash.findByIdAndDelete(resolvedParams.id);
    return NextResponse.json({ message: "Entry deleted successfully" });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}