import connectDB from '@/lib/db/connect';
import Job from '@/lib/models/job';
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const isAdminView = searchParams.get('admin') === 'true';
    
    if (isAdminView) {
      const user = await verifyAuth(request);
      if (!user || (user.role !== 'admin' && user.role !== 'hr' && user.role !== 'super-admin')) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }

      // Fetch all jobs for admin with application counts
      const jobs = await Job.aggregate([
        { $sort: { createdAt: -1 } },
        {
          $lookup: {
            from: 'applications',
            localField: '_id',
            foreignField: 'jobId',
            as: 'applications'
          }
        },
        {
          $addFields: {
            applicationCount: { $size: '$applications' }
          }
        },
        {
          $project: {
            applications: 0 // Don't return full applications here
          }
        }
      ]);
      return NextResponse.json(jobs);
    }

    // Regular view: only active jobs
    const jobs = await Job.find({ isActive: true }).sort({ createdAt: -1 });
    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Jobs GET Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
export async function POST(request) {
  try {
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'admin' && user.role !== 'hr' && user.role !== 'super-admin')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const data = await request.json();
    
    const job = new Job({
      ...data,
      postedBy: user.userId
    });

    await job.save();
    return NextResponse.json({ message: 'Job created successfully', job }, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
