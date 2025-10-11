import connectMongoose from "@/app/utilis/connectMongoose";
import Skill from "@/models/Skill";
import { NextResponse } from "next/server";



export async function GET(req,context) {
  try {
    await connectMongoose();
    const {id} = await context.params;
    const skill = await Skill.findById(id)
    .populate("employeeId","name");
    if (!skill) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }
    return NextResponse.json(skill, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req,context) {
  try {
    await connectMongoose();
    const {id} = await context.params;
    const body = await req.json();
    const skill = await Skill.findByIdAndUpdate(id, body, { new: true });
    return NextResponse.json(skill, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req,context) {
  try {
    await connectMongoose();
    const {id} = await context.params;
    const skill = await Skill.findByIdAndDelete(id);
    return NextResponse.json(
      { success: "Deleted Successfully" },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
