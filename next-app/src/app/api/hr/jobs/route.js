import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Job from '@/lib/models/job';
import { verifyAuth } from '@/lib/auth/middleware';

export async function GET(req) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== 'super-admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const jobs = await Job.find({ isActive: true }).select("title company _id department location");

    return NextResponse.json({ success: true, data: jobs });
  } catch (error) {
    console.error('HR Jobs GET Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
