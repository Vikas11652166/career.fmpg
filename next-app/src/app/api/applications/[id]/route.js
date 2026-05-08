import connectDB from '@/lib/db/connect';
import Application from '@/lib/models/application';
import Job from '@/lib/models/job';
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const application = await Application.findById(id).populate('jobId').populate('userId', 'name email phoneNumber');
    if (!application) {
      return NextResponse.json({ message: 'Application not found' }, { status: 404 });
    }

    // Security check: Only admin, HR, or the applicant can view
    if (user.role !== 'admin' && user.role !== 'hr' && user.userId !== application.userId._id.toString()) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 0 }); // Next.js convention for forbidden is usually 403 but let's use 403
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error('Application Detail API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'admin' && user.role !== 'hr')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const data = await request.json();

    const application = await Application.findByIdAndUpdate(
      id,
      { 
        $set: { 
          ...data,
          updatedAt: Date.now()
        } 
      },
      { new: true }
    );

    if (!application) {
      return NextResponse.json({ message: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Application updated successfully', application });
  } catch (error) {
    console.error('Application Update API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
