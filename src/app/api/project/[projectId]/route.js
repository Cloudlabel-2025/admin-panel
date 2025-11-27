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
    const {projectId} = await params;
    const body = await req.json();

    const project = await Project.findByIdAndUpdate(projectId, body, { new: true })
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
  let retries = 3;
  while (retries > 0) {
    try {
      await connectMongoose();
      const {projectId} = await params;

      const project = await Project.findByIdAndDelete(projectId);
      if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

      return NextResponse.json({ message: "Project deleted successfully" });
    } catch (err) {
      console.error("Project DELETE error:", err);
      retries--;
      if (retries === 0 || !err.message.includes('ECONNRESET')) {
        return NextResponse.json({ error: "Failed to delete project. Please try again." }, { status: 500 });
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}