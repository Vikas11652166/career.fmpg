import connectDB from '@/lib/db/connect';
import User from '@/lib/models/user';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { email, otp, newPassword } = await req.json();
    await connectDB();

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ message: "Email, OTP, and new password are required" }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (!user.passwordResetOTP || user.passwordResetOTP !== otp) {
      return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
    }

    if (new Date() > user.passwordResetOTPExpiry) {
      return NextResponse.json({ message: "OTP has expired" }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear OTP
    user.password = hashedPassword;
    user.passwordResetOTP = null;
    user.passwordResetOTPExpiry = null;
    await user.save();

    return NextResponse.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("ResetPassword error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
