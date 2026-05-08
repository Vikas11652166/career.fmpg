import connectDB from '@/lib/db/connect';
import Notification from '@/lib/models/notification';
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';

export async function GET(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;

    const query = { userId: user.userId };
    if (unreadOnly) query.isRead = false;

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ userId: user.userId, isRead: false });
    
    const notifications = await Notification.find(query)
      .populate('relatedJobId', 'title slug')
      .populate('relatedApplicationId', 'status')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        unreadCount
      }
    });
  } catch (error) {
    console.error('Notifications GET API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(request.url);
    const markAll = searchParams.get('markAll') === 'true';

    if (markAll) {
      await Notification.updateMany(
        { userId: user.userId, isRead: false },
        { $set: { isRead: true, readAt: new Date() } }
      );
      return NextResponse.json({ message: 'All marked as read' });
    }

    const { id } = await request.json();
    if (!id) return NextResponse.json({ message: 'Notification ID required' }, { status: 400 });

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: user.userId },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    );

    if (!notification) return NextResponse.json({ message: 'Notification not found' }, { status: 404 });

    return NextResponse.json(notification);
  } catch (error) {
    console.error('Notifications PATCH API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ message: 'Notification ID required' }, { status: 400 });

    const notification = await Notification.findOneAndDelete({ _id: id, userId: user.userId });
    if (!notification) return NextResponse.json({ message: 'Notification not found' }, { status: 404 });

    return NextResponse.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Notifications DELETE API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
