import connectMongoose from "@/app/utilis/connectMongoose";
import Customer from "@/models/sales/Customer";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectMongoose();
    const body = await req.json();
    const customer = await Customer.create(body);
    return NextResponse.json(customer, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    await connectMongoose();
    const customer = await Customer.find({});
    return NextResponse.json(customer, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
