import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import connectMongoose from "@/app/utilis/connectMongoose";
import User from "@/models/User";

export async function POST(req) {
  try {
    await connectMongoose();
    const { email } = await req.json();

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set OTP expiry to 10 minutes
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.findOneAndUpdate(
      { email },
      { resetOTP: otp, resetOTPExpiry: otpExpiry },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Log OTP to console (in production, send via email)
    console.log(`OTP for ${email}: ${otp}`);
    console.log('OTP saved:', user.resetOTP);

    return NextResponse.json({ 
      success: true, 
      message: "OTP sent successfully. Check console for OTP.",
      otp: otp // Remove this in production
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
