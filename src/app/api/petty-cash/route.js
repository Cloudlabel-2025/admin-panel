import connectMongoose from "@/app/utilis/connectMongoose";


import PettyCash from "@/models/accounts/PettyCash";
import Account from "@/models/accounts/Account";
import Transaction from "@/models/accounts/Transaction";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connectMongoose();
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get("adminId");
    const month = searchParams.get("month");
    const filter = searchParams.get("filter"); // weekly, monthly, 3months

    let query = {};
    if (adminId) query.handledBy = adminId;
    if (month) query.month = month;

    // Date filtering
    if (filter) {
      const now = new Date();
      let startDate;
      if (filter === 'weekly') {
        startDate = new Date(now.setDate(now.getDate() - 7));
      } else if (filter === 'monthly') {
        startDate = new Date(now.setMonth(now.getMonth() - 1));
      } else if (filter === '3months') {
        startDate = new Date(now.setMonth(now.getMonth() - 3));
      }
      if (startDate) query.date = { $gte: startDate };
    }

    const entries = await PettyCash.find(query).sort({ date: -1 });
    return NextResponse.json(entries, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectMongoose();
    const body = await req.json();
    const { type, amount, handledBy, handledByName, month, isAllocation } = body;

    // If it's a budget allocation from super-admin
    if (isAllocation && type === 'in') {
      const entry = await PettyCash.create({
        ...body,
        allocatedAmount: amount,
        currentBalance: amount
      });

      // Create notification for admin
      const Notification = (await import("@/models/Notification")).default;
      await Notification.create({
        userId: handledBy,
        message: `Budget allocated: ₹${amount} for ${month}`,
        type: "budget",
        read: false
      });

      return NextResponse.json({ message: "Budget allocated", entry }, { status: 201 });
    }

    // Admin expense entry
    if (type === 'out') {
      // Get current balance for this admin in this month
      const lastEntry = await PettyCash.findOne({ handledBy, month }).sort({ createdAt: -1 });
      const currentBalance = lastEntry ? lastEntry.currentBalance : 0;

      if (currentBalance < amount) {
        return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
      }

      const entry = await PettyCash.create({
        ...body,
        currentBalance: currentBalance - amount
      });

      return NextResponse.json({ message: "Expense recorded", entry }, { status: 201 });
    }

    // Default petty cash entry
    const entry = await PettyCash.create(body);
    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
