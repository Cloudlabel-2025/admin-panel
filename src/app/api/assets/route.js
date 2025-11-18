import connectMongoose from "@/app/utilis/connectMongoose";

export const dynamic = "force-dynamic";
import Asset from "@/models/accounts/Asset";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectMongoose();
    const assets = await Asset.find().sort({ createdAt: -1 });
    return NextResponse.json(assets, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectMongoose();
    const body = await req.json();
    const asset = await Asset.create(body);
    return NextResponse.json(asset, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}