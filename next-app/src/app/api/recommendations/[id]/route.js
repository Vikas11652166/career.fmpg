import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Recommendation from '@/lib/models/recommendation';
import Application from '@/lib/models/application';
import User from '@/lib/models/user';
import { verifyAuth } from '@/lib/auth/middleware';

export async function PUT(req, { params }) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { status, adminNotes } = await req.json();

    if (user.role !== 'admin' && user.role !== 'super-admin' && user.role !== 'hr') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const recommendation = await Recommendation.findById(id).populate('recommender', 'name email');
    if (!recommendation) return NextResponse.json({ message: 'Recommendation not found' }, { status: 404 });

    recommendation.status = status;
    recommendation.adminNotes = adminNotes;
    recommendation.reviewedBy = user.userId;
    recommendation.reviewedAt = new Date();
    recommendation.updatedAt = new Date();

    await recommendation.save();

    // Sync with application if selected
    if (status === 'selected' && recommendation.applicationId) {
      await Application.findByIdAndUpdate(recommendation.applicationId, {
        isReferred: true,
        referrerEmployeeId: recommendation.recommenderId,
        referralMessage: recommendation.recommendationMessage,
        recommendationId: recommendation._id
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Recommendation status updated successfully',
      data: recommendation
    });

  } catch (error) {
    console.error('Recommendation PUT Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await connectDB();
    
    const recommendation = await Recommendation.findById(id);
    if (!recommendation) return NextResponse.json({ message: 'Recommendation not found' }, { status: 404 });

    const isAdmin = user.role === 'admin' || user.role === 'super-admin';
    
    if (!isAdmin && recommendation.recommender.toString() !== user.userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    if (!isAdmin && recommendation.status !== 'pending') {
      return NextResponse.json({ message: 'Only pending recommendations can be deleted' }, { status: 400 });
    }

    await Recommendation.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Recommendation deleted successfully'
    });

  } catch (error) {
    console.error('Recommendation DELETE Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
