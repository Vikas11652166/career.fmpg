import connectDB from '@/lib/db/connect';
import User from '@/lib/models/user';
import AuditLog from '@/lib/models/auditLog';
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const user = await verifyAuth(request);
    if (!user || user.role !== 'super-admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { permissions } = await request.json();

    const updatedUser = await User.findByIdAndUpdate(id, { permissions }, { new: true }).select('-password');
    if (!updatedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Create Audit Log
    try {
      await AuditLog.create({
        actor: user.userId,
        actorRole: user.role,
        action: 'UPDATE_PERMISSIONS',
        resourceEntity: 'User',
        resourceId: id,
        changes: { permissions },
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: request.headers.get('user-agent')
      });
    } catch (auditError) {
      console.error('Failed to log audit:', auditError);
    }

    return NextResponse.json({ message: 'Permissions updated successfully', user: updatedUser });

  } catch (error) {
    console.error('Admin Update Permissions API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
