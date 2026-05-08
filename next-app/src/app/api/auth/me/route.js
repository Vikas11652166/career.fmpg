import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import User from '@/lib/models/user';
import { verifyAuth } from '@/lib/auth/middleware';

export async function GET(req) {
  try {
    const decoded = await verifyAuth(req);
    if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
