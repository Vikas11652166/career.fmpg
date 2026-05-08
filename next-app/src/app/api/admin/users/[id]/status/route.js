import connectDB from '@/lib/db/connect';
import User from '@/lib/models/user';
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'admin' && user.role !== 'super-admin')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { status } = await request.json();

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(id, { status }, { new: true }).select('-password');
    if (!updatedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User status updated successfully', user: updatedUser });

  } catch (error) {
    console.error('Admin Update User Status API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
