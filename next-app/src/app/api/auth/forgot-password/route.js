import connectDB from '@/lib/db/connect';
import User from '@/lib/models/user';
import { NextResponse } from 'next/server';
import { sendPasswordResetOTP } from '@/lib/services/emailService';

// Helper function to generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export async function POST(req) {
  try {
    const { email } = await req.json();
    await connectDB();

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: "User not found with this email" }, { status: 404 });
    }

    // Generate OTP for password reset
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.passwordResetOTP = otp;
    user.passwordResetOTPExpiry = otpExpiry;
    await user.save();

    // Send password reset email
    try {
      await sendPasswordResetOTP(email, otp, user.name);
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      return NextResponse.json({ message: "Failed to send password reset email" }, { status: 500 });
    }

    return NextResponse.json({ message: "Password reset OTP sent to your email" });
  } catch (error) {
    console.error("ForgotPassword error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
