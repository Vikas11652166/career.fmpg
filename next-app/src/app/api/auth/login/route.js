import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import User from '@/lib/models/user';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authConfig, getCookieMaxAge, isProduction } from '@/lib/config/authConfig';
import { logAudit } from '@/lib/services/auditService';

export async function POST(req) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 400 });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return NextResponse.json({ 
        message: "Please verify your email before logging in", 
        requiresVerification: true,
        userId: user._id
      }, { status: 403 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      authConfig.jwtSecret, 
      { expiresIn: authConfig.jwtExpiresIn }
    );

    // Audit log
    try {
      await logAudit({
        req: { ...req, user: user },
        action: "LOGIN",
        resourceEntity: "User",
        resourceId: user._id,
        changes: { action: "Successful login" }
      });
    } catch (auditError) {
      console.error("Failed to log login action:", auditError);
    }

    const response = NextResponse.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        employeeId: user.employeeId,
        department: user.department,
        position: user.position,
        permissions: user.permissions || {},
        assignedJobs: user.assignedJobs || []
      }
    });

    // Set cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: isProduction(),
      sameSite: 'strict',
      maxAge: getCookieMaxAge() / 1000, // Next.js cookies expect seconds
      path: '/',
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
