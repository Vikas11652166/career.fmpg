import connectDB from '@/lib/db/connect';
import User from '@/lib/models/user';
import { NextResponse } from 'next/server';
import { sendEmailVerificationOTP } from '@/lib/services/emailService';

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
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (user.isEmailVerified) {
      return NextResponse.json({ message: "Email already verified" }, { status: 400 });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.emailVerificationOTP = otp;
    user.emailVerificationOTPExpiry = otpExpiry;
    await user.save();

    // Send verification email
    try {
      await sendEmailVerificationOTP(email, otp, user.name);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      return NextResponse.json({ message: "Failed to send verification email" }, { status: 500 });
    }

    return NextResponse.json({ message: "Verification OTP sent successfully" });
  } catch (error) {
    console.error("ResendOTP error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
