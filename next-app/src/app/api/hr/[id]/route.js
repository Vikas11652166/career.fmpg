import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import User from '@/lib/models/user';
import { verifyAuth } from '@/lib/auth/middleware';
import { logAudit } from '@/lib/services/auditService';

export async function PUT(req, { params }) {
  try {
    const adminUser = await verifyAuth(req);
    if (!adminUser || adminUser.role !== 'super-admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { permissions, assignedJobs } = await req.json();

    await connectDB();
    const hr = await User.findById(id);
    if (!hr) return NextResponse.json({ message: "HR user not found" }, { status: 404 });

    if (hr.department !== "HR" && hr.role !== "hr") {
      return NextResponse.json({ message: "User is not in the HR department" }, { status: 400 });
    }

    const previousState = {
      permissions: hr.permissions,
      assignedJobs: hr.assignedJobs
    };

    hr.permissions = { ...hr.permissions, ...permissions };
    if (assignedJobs) hr.assignedJobs = assignedJobs;

    await hr.save();

    await logAudit({
      actor: adminUser.userId,
      action: "UPDATE_PERMISSIONS",
      resourceEntity: "User",
      resourceId: hr._id,
      changes: {
        from: previousState,
        to: { permissions: hr.permissions, assignedJobs: hr.assignedJobs }
      },
      ip: req.headers.get('x-forwarded-for') || '0.0.0.0',
      userAgent: req.headers.get('user-agent') || 'N/A'
    });

    return NextResponse.json({ success: true, message: "Permissions updated successfully", data: hr });
  } catch (error) {
    console.error('HR PUT Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const adminUser = await verifyAuth(req);
    if (!adminUser || adminUser.role !== 'super-admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    const user = await User.findById(id);
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    if (user.department !== "HR" && user.role !== "hr") {
      return NextResponse.json({ message: "User is not in the HR department" }, { status: 400 });
    }

    const previousState = {
      role: user.role,
      permissions: user.permissions,
      assignedJobs: user.assignedJobs
    };

    if (user.role === "hr") user.role = "employee";
    user.department = "General Management/Administration";
    user.permissions = {
      canGenerateCertificate: false,
      canGenerateOfferLetter: false,
      canCreateJob: false,
      canViewApplicants: false,
      canManageReviews: false,
      canManageEmployees: false,
      canManageRecommendations: false,
      canAccessDashboard: false
    };
    user.assignedJobs = [];

    await user.save();

    await logAudit({
      actor: adminUser.userId,
      action: "REVOKE",
      resourceEntity: "User",
      resourceId: user._id,
      changes: {
        from: previousState,
        to: { role: user.role, permissions: user.permissions, assignedJobs: [] }
      },
      ip: req.headers.get('x-forwarded-for') || '0.0.0.0',
      userAgent: req.headers.get('user-agent') || 'N/A'
    });

    return NextResponse.json({ success: true, message: "HR role revoked successfully" });
  } catch (error) {
    console.error('HR DELETE Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
