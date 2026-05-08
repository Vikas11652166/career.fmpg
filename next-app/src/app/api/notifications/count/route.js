import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Notification from '@/lib/models/notification';
import { verifyAuth } from '@/lib/auth/middleware';

export async function GET(req) {
  try {
    const decoded = await verifyAuth(req);
    if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const count = await Notification.countDocuments({ 
      recipient: decoded.userId, 
      isRead: false 
    });

    return NextResponse.json({ unreadCount: count });
  } catch (error) {
    return NextResponse.json({ unreadCount: 0 });
  }
}
