import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import AuditLog from '@/lib/models/auditLog';
import { verifyAuth } from '@/lib/auth/middleware';

export async function GET(req) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== 'super-admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const logs = await AuditLog.find({ action: { $in: ["UPDATE_PERMISSIONS", "ASSIGN", "REVOKE"] } })
      .populate("actor", "name email")
      .populate("resourceId", "name email")
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    console.error('HR Audit Logs GET Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
