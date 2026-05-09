import connectDB from '@/lib/db/connect';
import Review from '@/lib/models/review';
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';

export async function PUT(request, { params }) {
  try {
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'admin' && user.role !== 'super-admin' && user.role !== 'employee')) {
       // Check if HR
       const isHR = user.department?.toUpperCase() === 'HR' || user.department === 'General Management/Administration';
       if (!isHR) {
         return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
       }
    }

    const { id, action } = await params;
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

    await connectDB();
    const body = await request.json();
    const { moderatorNotes, rejectionReason } = body;

    const updateData = {
      status: action === 'approve' ? 'approved' : 'rejected',
      moderatorNotes: moderatorNotes || '',
    };

    if (action === 'approve') {
      updateData.approvedBy = user._id;
      updateData.approvedAt = new Date();
    } else {
      updateData.rejectedBy = user._id;
      updateData.rejectedAt = new Date();
      updateData.rejectionReason = rejectionReason || 'No reason provided';
    }

    const review = await Review.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!review) {
      return NextResponse.json({ message: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: `Review ${action === 'approve' ? 'sanctioned' : 'suppressed'} successfully`,
      review
    });

  } catch (error) {
    console.error('Review Action API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
