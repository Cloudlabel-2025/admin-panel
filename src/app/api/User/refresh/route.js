import { NextResponse } from "next/server";
import { verifyRefreshToken, generateTokens } from "../../../utilis/authMiddleware";

export async function POST(req) {
  try {
    const { refreshToken } = await req.json();
    
    if (!refreshToken) {
      return NextResponse.json({ error: "Refresh token required" }, { status: 400 });
    }
    
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
    }
    
    const payload = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      employeeId: decoded.employeeId
    };
    
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(payload);
    
    return NextResponse.json({
      token: accessToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}