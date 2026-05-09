import connectDB from '@/lib/db/connect';
import Review from '@/lib/models/review';
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';

export async function GET(request) {
  try {
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'admin' && user.role !== 'super-admin' && user.role !== 'employee')) {
       // Check if HR
       const isHR = user.department?.toUpperCase() === 'HR' || user.department === 'General Management/Administration';
       if (!isHR) {
         return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
       }
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const status = searchParams.get('status');
    const rating = searchParams.get('rating');
    const reviewerType = searchParams.get('reviewerType');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (rating && rating !== 'all') filter.rating = parseInt(rating);
    if (reviewerType && reviewerType !== 'all') filter.reviewerType = reviewerType;

    const total = await Review.countDocuments(filter);
    const reviews = await Review.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      reviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Reviews All API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
