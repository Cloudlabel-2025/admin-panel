import connectMongoose from "@/app/utilis/connectMongoose";
import Skill from "@/models/Skill";
import { NextResponse } from "next/server";

await connectMongoose();

export async function GET(req, { params }) {
  try {
    const skill = await Skill.findById(params.id)
    .populate("employeeId name");
    if (!skill) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }
    return NextResponse.json(skill, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const body = await req.json();
    const skill = await Skill.findByIdAndUpdate(params.id, body, { new: true });
    return NextResponse.json(skill, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await Skill.findByIdAndDelete(params.id);
    return NextResponse.json(
      { success: "Deleted Successfully" },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
