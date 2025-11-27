import { NextResponse } from "next/server";


import connectMongoose from "@/app/utilis/connectMongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    await connectMongoose();
    const { email, otp, newPassword } = await req.json();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log('Stored OTP:', user.resetOTP, 'Received OTP:', otp, 'Match:', user.resetOTP === otp);

    // Verify OTP
    if (!user.resetOTP || user.resetOTP.trim() !== otp.trim()) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    // Check OTP expiry
    if (new Date() > new Date(user.resetOTPExpiry)) {
      return NextResponse.json({ error: "OTP expired" }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password and clear OTP
    user.password = hashedPassword;
    user.resetOTP = undefined;
    user.resetOTPExpiry = undefined;
    await user.save();

    return NextResponse.json({ 
      success: true, 
      message: "Password reset successfully" 
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
