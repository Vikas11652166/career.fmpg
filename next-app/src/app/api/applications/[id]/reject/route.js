import connectDB from '@/lib/db/connect';
import Application from '@/lib/models/application';
import AuditLog from '@/lib/models/auditLog';
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'admin' && user.role !== 'super-admin')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { reason } = await request.json();

    // Create Audit Log
    try {
      await AuditLog.create({
        actor: user.userId,
        actorRole: user.role,
        action: 'REJECT',
        resourceEntity: 'Application',
        resourceId: id,
        changes: { 
          status: 'rejected',
          reason: reason
        },
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: request.headers.get('user-agent')
      });
    } catch (auditError) {
      console.error('Failed to log audit:', auditError);
    }

    return NextResponse.json({ message: 'Application rejected and candidate notified', application });

  } catch (error) {
    console.error('Reject Application API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
