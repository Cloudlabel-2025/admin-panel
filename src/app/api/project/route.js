import connectMongoose from "@/app/utilis/connectMongoose";
import Project from "@/models/Project";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectMongoose();

    const projects = await Project.find({})
      .populate("assignedBy", "employeeId name email ")
      .populate("assignedTo", "employeeId name email ");

    return NextResponse.json(projects);
  } catch (err) {
    console.error("Project GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: create new project
export async function POST(req) {
  try {
    await connectMongoose();
    const body = await req.json();
    const project = await Project.create(body);
    const populatedProject = await Project.findById(project._id)
      .populate("assignedBy", "employeeId name email ")
      .populate("assignedTo", "employeeId name email ");

    return NextResponse.json(populatedProject, { status: 201 });
  } catch (err) {
    console.error("Project POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}