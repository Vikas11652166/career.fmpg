import connectDB from '@/lib/db/connect';
import User from '@/lib/models/user';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { email, otp, newPassword } = await request.json();
    await connectDB();

    const user = await User.findOne({ 
      email,
      resetPasswordToken: otp,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return NextResponse.json({ message: 'Invalid or expired reset code' }, { status: 400 });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    // Clear reset fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    return NextResponse.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset Password API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
