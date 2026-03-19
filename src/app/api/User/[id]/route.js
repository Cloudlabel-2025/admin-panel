import connectMongoose from "@/app/utilis/connectMongoose";
import User from "../../../../models/User";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

// Verify JWT token and extract user info
function verifyToken(request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "") || 
                request.cookies.get("token")?.value ||
                request.headers.get("cookie")?.split("token=")[1]?.split(";")[0];
  
  if (!token) {
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const extractedToken = authHeader.substring(7);
      if (extractedToken) {
        try {
          return jwt.verify(extractedToken, process.env.JWT_SECRET);
        } catch (error) {
          return null;
        }
      }
    }
    return null;
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function PUT(request, { params }) {
  try {
    await connectMongoose();
    
    // Verify admin access
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const adminRoles = ["super-admin", "Super-admin", "admin", "developer", "Team-Lead", "Team-admin"];
    if (!adminRoles.includes(user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id } = params;
    const { isTerminated } = await request.json();

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { isTerminated },
      { new: true, select: "employeeId name email role isTerminated" }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      message: `User ${isTerminated ? 'deactivated' : 'activated'} successfully`, 
      user: updatedUser 
    });
  } catch (err) {
    console.error("User update error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectMongoose();
    
    // Verify admin access
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const adminRoles = ["super-admin", "Super-admin", "admin", "developer"];
    if (!adminRoles.includes(user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id } = params;

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("User delete error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}