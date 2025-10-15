import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
}

export function generateTokens(payload) {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
  
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN
  });
  
  return { accessToken, refreshToken };
}

export function requireAuth(handler) {
  return async (req, ...args) => {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "Access token required" }, { status: 401 });
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }
    
    req.user = decoded;
    return handler(req, ...args);
  };
}

export function requireRole(roles) {
  return (handler) => {
    return requireAuth(async (req, ...args) => {
      const userRole = req.user.role;
      
      if (!roles.includes(userRole)) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
      }
      
      return handler(req, ...args);
    });
  };
}