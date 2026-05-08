import connectDB from '@/lib/db/connect';
import User from '@/lib/models/user';
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const user = await verifyAuth(request);
    if (!user || user.role !== 'super-admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (id === user.userId) {
      return NextResponse.json({ message: 'You cannot delete your own account' }, { status: 400 });
    }

    await connectDB();
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Admin Delete User API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
