import connectMongoose from "../../../utilis/connectMongoose";
import User from "../../../../models/User";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { generateTokens } from "../../../utilis/authMiddleware";

export async function POST(req) {
  try {
    await connectMongoose();

    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    // Check for super admin credentials from environment
    if (email === process.env.SUPER_ADMIN_EMAIL && password === process.env.SUPER_ADMIN_PASSWORD) {
      const payload = {
        userId: "super-admin",
        email: process.env.SUPER_ADMIN_EMAIL,
        role: "super-admin",
        employeeId: "ADMIN001"
      };
      
      const { accessToken, refreshToken } = generateTokens(payload);
      
      return NextResponse.json({
        message: "Super Admin login successful",
        token: accessToken,
        refreshToken,
        user: {
          employeeId: "ADMIN001",
          name: "Super Admin",
          email: process.env.SUPER_ADMIN_EMAIL,
          role: "super-admin"
        }
      });
    }

    // Regular user authentication
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 400 });
    }

    const payload = {
      userId: user._id,
      email: user.email,
      role: "employee",
      employeeId: user.employeeId
    };
    
    const { accessToken, refreshToken } = generateTokens(payload);

    return NextResponse.json({
      message: "Login successful",
      token: accessToken,
      refreshToken,
      user: {
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: "employee"
      }
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
