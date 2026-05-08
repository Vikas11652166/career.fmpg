import connectDB from '@/lib/db/connect';
import User from '@/lib/models/user';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email } = await request.json();
    await connectDB();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: 'If a user with that email exists, a reset code has been sent.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = otp; // For simplicity in this audit, using token field for OTP
    user.resetPasswordExpire = Date.now() + 600000; // 10 minutes

    await user.save();

    // In a real app, send OTP via email here
    console.log(`OTP for ${email}: ${otp}`);

    return NextResponse.json({ message: 'Reset code sent to email' });
  } catch (error) {
    console.error('Forgot Password API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
