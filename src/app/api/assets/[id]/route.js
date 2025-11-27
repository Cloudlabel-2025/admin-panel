import connectMongoose from "@/app/utilis/connectMongoose";

import Asset from "@/models/accounts/Asset";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    await connectMongoose();
    const resolvedParams = await params;
    const asset = await Asset.findById(resolvedParams.id);
    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }
    return NextResponse.json(asset, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await connectMongoose();
    const resolvedParams = await params;
    const body = await req.json();
    
    const updatedAsset = await Asset.findByIdAndUpdate(resolvedParams.id, body, { new: true });
    if (!updatedAsset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }
    return NextResponse.json(updatedAsset, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectMongoose();
    const resolvedParams = await params;
    await Asset.findByIdAndDelete(resolvedParams.id);
    return NextResponse.json({ message: "Asset deleted successfully" });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}