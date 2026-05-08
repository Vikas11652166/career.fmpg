import connectDB from '@/lib/db/connect';
import Job from '@/lib/models/job';
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    await connectDB();
    
    let job;
    // Check if id is a valid MongoDB ObjectId
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    
    if (isObjectId) {
      job = await Job.findById(id);
    } else {
      job = await Job.findOne({ slug: id });
    }

    if (!job) return NextResponse.json({ message: 'Job not found' }, { status: 404 });
    return NextResponse.json(job);
  } catch (error) {
    console.error('Job Detail API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'admin' && user.role !== 'hr')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const data = await request.json();

    const job = await Job.findByIdAndUpdate(id, { $set: data }, { new: true });
    if (!job) return NextResponse.json({ message: 'Job not found' }, { status: 404 });

    return NextResponse.json({ message: 'Job updated successfully', job });
  } catch (error) {
    console.error('Job Update API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'admin' && user.role !== 'hr')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const job = await Job.findByIdAndDelete(id);
    if (!job) return NextResponse.json({ message: 'Job not found' }, { status: 404 });

    return NextResponse.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Job Delete API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
