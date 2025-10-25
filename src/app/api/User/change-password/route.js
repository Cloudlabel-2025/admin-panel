import connectMongoose from "../../../utilis/connectMongoose";
import User from "../../../../models/User";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function PATCH(req) {
  try {
    await connectMongoose();
    const { email, currentPassword, newPassword } = await req.json();

    if (!email || !currentPassword || !newPassword)
      return NextResponse.json({ error: "Email, current password and new password required" }, { status: 400 });

    const user = await User.findOne({ email });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid)
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
