import connectMongoose from "@/app/utilis/connectMongoose";
import Project from "@/models/Project";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    await connectMongoose();
    const project = await Project.findById(params.projectId)
      .populate("assignedBy", "employeeId name email ")
      .populate("assignedTo", "employeeId name email ");

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    return NextResponse.json(project);
  } catch (err) {
    console.error("Project GET by ID error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await connectMongoose();
    const body = await req.json();

    const project = await Project.findByIdAndUpdate(params.projectId, body, { new: true })
      .populate("assignedBy", "employeeId name email ")
      .populate("assignedTo", "employeeId name email ");

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    return NextResponse.json(project);
  } catch (err) {
    console.error("Project PUT error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectMongoose();
    const project = await Project.findByIdAndDelete(params.projectId);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error("Project DELETE error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}