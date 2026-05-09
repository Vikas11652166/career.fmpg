import connectDB from '@/lib/db/connect';
import Review from '@/lib/models/review';
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';

export async function POST(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();

    const review = await Review.create({
      userId: user.userId,
      userEmail: body.userEmail || user.email,
      userName: body.userName || user.name,
      rating: body.rating,
      title: body.title,
      content: body.content,
      pros: body.pros,
      cons: body.cons,
      advice: body.advice,
      department: body.department,
      position: body.position,
      workType: body.workType,
      employmentDuration: body.employmentDuration,
      isAnonymous: body.isAnonymous || false,
      reviewerType: body.reviewerType || (user.role === 'employee' ? 'employee' : 'offer_recipient'),
      status: 'pending'
    });

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully',
      review
    });

  } catch (error) {
    console.error('Submit Review API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
