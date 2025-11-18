import connectMongoose from "@/app/utilis/connectMongoose";

export const dynamic = "force-dynamic";
import Budget from "@/models/budgeting/Budget";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectMongoose();
    const body = await req.json();
    const budget = await Budget.create(body);
    return NextResponse.json(budget, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectMongoose();
    const budgets = await Budget.find({});
    const result = await budgets.map((b) => ({
      ...b.toObject(),
      variance: b.allocatedAmout - b.spentAmount,
    }));
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
