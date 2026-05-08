import connectDB from '@/lib/db/connect';
import Job from '@/lib/models/job';
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';

export async function GET(request) {
  try {
    await connectDB();
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
    if (!user || (user.role !== 'admin' && user.role !== 'hr')) {
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
