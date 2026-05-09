import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Application from '@/lib/models/application';
import { verifyAuth } from '@/lib/auth/middleware';

export async function GET(req) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectDB();

    // Find applications that don't have recommendations yet and are not submitted by the current user
    const applications = await Application.find({
      status: { $in: ['pending', 'under_review'] }, // Only pending/under review applications
      recommendationId: { $exists: false }, // No existing recommendation
      userId: { $ne: user.userId } // Exclude applications submitted by the current user
    })
    .populate("jobId", "title company location department")
    .select("_id fullName email jobId status createdAt userId")
    .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('Applications for Recommendation GET Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
