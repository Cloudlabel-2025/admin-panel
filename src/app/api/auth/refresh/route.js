import jwt from 'jsonwebtoken';

export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { refreshToken } = await req.json();
    
    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token required' }, { status: 401 });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Generate new access token
    const newToken = jwt.sign(
      { 
        userId: decoded.userId, 
        email: decoded.email, 
        role: decoded.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    return NextResponse.json({ token: newToken }, { status: 200 });
  } catch (error) {
    console.error('Token refresh error:', error);
    if (error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Refresh token expired', expired: true }, { status: 401 });
    }
    return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
  }
}
