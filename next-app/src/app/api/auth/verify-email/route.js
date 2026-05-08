import connectDB from '@/lib/db/connect';
import User from '@/lib/models/user';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { otp, email } = await request.json();
    await connectDB();

    const user = await User.findOne({ 
      email,
      verificationToken: otp,
      verificationExpire: { $gt: Date.now() }
    });

    if (!user) {
      return NextResponse.json({ message: 'Invalid or expired verification code' }, { status: 400 });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpire = undefined;

    await user.save();

    return NextResponse.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email Verification API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
