import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import User from '@/lib/models/user';
import { verifyAuth } from '@/lib/auth/middleware';
import { logAudit } from '@/lib/services/auditService';

export async function GET(req) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== 'super-admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const hrs = await User.find({ 
      $or: [{ department: "HR" }, { role: "hr" }] 
    }).select("-password");

    return NextResponse.json({ success: true, data: hrs });
  } catch (error) {
    console.error('HR GET Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const adminUser = await verifyAuth(req);
    if (!adminUser || adminUser.role !== 'super-admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { userId, email, permissions, assignedJobs } = await req.json();

    let user;
    if (userId) {
      user = await User.findById(userId);
    } else if (email) {
      user = await User.findOne({ email });
    }

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (user.role === "user") {
      user.role = "employee";
    }
    user.department = "HR";
    user.permissions = permissions || user.permissions;
    user.assignedJobs = assignedJobs || user.assignedJobs;

    await user.save();

    await logAudit({
      actor: adminUser.userId,
      action: "ASSIGN",
      resourceEntity: "User",
      resourceId: user._id,
      changes: { role: "hr", permissions, assignedJobs },
      ip: req.headers.get('x-forwarded-for') || '0.0.0.0',
      userAgent: req.headers.get('user-agent') || 'N/A'
    });

    return NextResponse.json({ success: true, message: "User promoted to HR role", data: user });
  } catch (error) {
    console.error('HR POST Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
