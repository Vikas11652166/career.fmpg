import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import User from '@/lib/models/user';
import bcrypt from 'bcryptjs';
import { sendEmailVerificationOTP } from '@/lib/services/emailService';
import { logAudit } from '@/lib/services/auditService';

// Helper function to generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export async function POST(req) {
  try {
    await connectDB();
    const { name, email, password, phoneNumber, role } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return NextResponse.json({ message: 'User already exists with this email' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate OTP for email verification
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = new User({
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      role: role || 'user',
      emailVerificationOTP: otp,
      emailVerificationOTPExpiry: otpExpiry,
      status: 'active'
    });

    const savedUser = await user.save();
    
    // Send verification email
    try {
      await sendEmailVerificationOTP(email, otp, name);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
    }
    
    // Log the account creation action
    try {
      await logAudit({
        req: { ...req, user: savedUser }, // provide temporary user context for audit
        action: "CREATE",
        resourceEntity: "User",
        resourceId: savedUser._id,
        changes: {
          newData: { name, email, role: role || "user" }
        }
      });
    } catch (auditError) {
      console.error("Failed to log audit (register):", auditError);
    }

    return NextResponse.json({ 
      message: 'User created successfully. Please check your email for verification code.',
      userId: savedUser._id,
      requiresVerification: true
    }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
