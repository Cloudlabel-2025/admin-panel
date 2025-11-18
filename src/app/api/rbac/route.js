import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import connectMongoose from "@/app/utilis/connectMongoose";
import mongoose from "mongoose";

const UserPermissionSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  permissions: { type: Object, required: true }
}, { timestamps: true });

const UserPermission = mongoose.models.UserPermission || mongoose.model("UserPermission", UserPermissionSchema);

export async function GET(req) {
  try {
    await connectMongoose();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (userId) {
      const userPermission = await UserPermission.findOne({ userId });
      return NextResponse.json(userPermission?.permissions || {});
    }
    
    const allPermissions = await UserPermission.find({});
    return NextResponse.json(allPermissions);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectMongoose();
    const { userId, permissions } = await req.json();
    
    const userPermission = await UserPermission.findOneAndUpdate(
      { userId },
      { permissions },
      { upsert: true, new: true }
    );
    
    return NextResponse.json(userPermission);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}