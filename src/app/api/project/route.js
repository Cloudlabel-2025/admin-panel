import connectMongoose from "@/app/utilis/connectMongoose";

export const dynamic = "force-dynamic";
import Project from "@/models/Project";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connectMongoose();
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const isEmployee = searchParams.get("employee") === "true";

    let query = {};
    if (isEmployee && employeeId) {
      query.assignedTo = employeeId;
    }

    const projects = await Project.find(query)
      .sort({ createdAt: -1 });

    // Get user details for each project
    const User = (await import("@/models/User")).default;
    const enrichedProjects = await Promise.all(projects.map(async (project) => {
      const assignedByUser = await User.findOne({ employeeId: project.assignedBy });
      const assignedToUser = await User.findOne({ employeeId: project.assignedTo });
      
      return {
        ...project.toObject(),
        assignedBy: assignedByUser ? { employeeId: assignedByUser.employeeId, name: assignedByUser.name, email: assignedByUser.email } : null,
        assignedTo: assignedToUser ? { employeeId: assignedToUser.employeeId, name: assignedToUser.name, email: assignedToUser.email } : null
      };
    }));

    return NextResponse.json(enrichedProjects);
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
    
    // Get user details
    const User = (await import("@/models/User")).default;
    const assignedByUser = await User.findOne({ employeeId: project.assignedBy });
    const assignedToUser = await User.findOne({ employeeId: project.assignedTo });
    
    const enrichedProject = {
      ...project.toObject(),
      assignedBy: assignedByUser ? { employeeId: assignedByUser.employeeId, name: assignedByUser.name, email: assignedByUser.email } : null,
      assignedTo: assignedToUser ? { employeeId: assignedToUser.employeeId, name: assignedToUser.name, email: assignedToUser.email } : null
    };

    return NextResponse.json(enrichedProject, { status: 201 });
  } catch (err) {
    console.error("Project POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: update project (including accept/decline)
export async function PUT(req) {
  try {
    await connectMongoose();
    const body = await req.json();
    const { _id, action, responseReason, ...updates } = body;

    if (action === "accept" || action === "decline") {
      updates.assignmentStatus = action === "accept" ? "Accepted" : "Declined";
      updates.responseReason = responseReason || "";
      updates.respondedAt = new Date();
    }

    const project = await Project.findByIdAndUpdate(_id, updates, { new: true });
    
    // Get user details
    const User = (await import("@/models/User")).default;
    const assignedByUser = await User.findOne({ employeeId: project.assignedBy });
    const assignedToUser = await User.findOne({ employeeId: project.assignedTo });
    
    const enrichedProject = {
      ...project.toObject(),
      assignedBy: assignedByUser ? { employeeId: assignedByUser.employeeId, name: assignedByUser.name, email: assignedByUser.email } : null,
      assignedTo: assignedToUser ? { employeeId: assignedToUser.employeeId, name: assignedToUser.name, email: assignedToUser.email } : null
    };

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(enrichedProject);
  } catch (err) {
    console.error("Project PUT error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}