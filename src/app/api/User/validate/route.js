import connectMongoose from "../../../utilis/connectMongoose";

export const dynamic = "force-dynamic";
import mongoose from "mongoose";
import User from "../../../../models/User";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectMongoose();
    const { email } = await req.json();
    if (!email)
      return NextResponse.json({ error: "Email required" }, { status: 400 });

    // Search email in all department collections
    const allCollections = Object.keys(mongoose.connection.collections).filter(name =>
      name.endsWith("_department")
    );

    let employee = null;
    for (const coll of allCollections) {
      // Wrap native collection in Mongoose model
      const DepartmentModel =
        mongoose.models[coll] ||
        mongoose.model(coll, new mongoose.Schema({}, { strict: false }), coll);

      const doc = await DepartmentModel.findOne({ email });
      if (doc) {
        employee = doc;
        break;
      }
    }

    if (!employee)
      return NextResponse.json(
        { error: "Email not found in Employee DB" },
        { status: 400 }
      );

    // Check if user already signed up
    const userExists = await User.findOne({ email });
    if (userExists)
      return NextResponse.json(
        { error: "User already signed up" },
        { status: 400 }
      );

    return NextResponse.json({ message: "Email valid", employee }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
