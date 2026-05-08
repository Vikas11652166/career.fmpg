import connectDB from '@/lib/db/connect';
import Application from '@/lib/models/application';
import Job from '@/lib/models/job';
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';

export async function GET(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    
    const applications = await Application.find({ userId: user.userId })
      .populate('jobId', 'title slug company location status')
      .sort({ createdAt: -1 });

    return NextResponse.json(applications);
  } catch (error) {
    console.error('My Applications API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
