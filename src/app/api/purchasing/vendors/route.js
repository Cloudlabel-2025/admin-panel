import connectMongoose from "@/app/utilis/connectMongoose";
import Vendor from "@/models/purchasing/Vendor";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectMongoose();
    const body = await req.json();
    const vendor = await Vendor.create(body);
    return NextResponse.json(vendor, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectMongoose();
    const vendors = await Vendor.find({});
    return NextResponse.json(vendors, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
