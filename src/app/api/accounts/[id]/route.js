import connectMongoose from "@/app/utilis/connectMongoose";
import Account from "@/models/accounts/Account";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    await connectMongoose();
    const account = await Account.findById(params.id);
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    return NextResponse.json(account, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await connectMongoose();
    const body = await req.json();
    const UpdatedAccount = await Account.findByIdAndUpdate(params.id, body, {
      new: true,
    });
    if (!UpdatedAccount) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    return NextResponse.json(UpdatedAccount, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectMongoose();
    await Account.findByIdAndDelete(params.id);
    return NextResponse.json({ message: "Deleted Successfully" });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
