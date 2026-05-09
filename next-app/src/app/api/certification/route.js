import connectDB from '@/lib/db/connect';
import Certificate from '@/lib/models/certificate';
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';

export async function GET(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const isAdmin = user.role === 'admin' || user.role === 'super-admin';
    const isHR = user.department?.toUpperCase() === 'HR' || user.department === 'General Management/Administration';

    if (!isAdmin && !isHR) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search');

    const filter = {};
    if (search) {
      filter.$or = [
        { candidateName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { certificateId: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Certificate.countDocuments(filter);
    const certificates = await Certificate.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      certificates,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('GET Certificates API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const isAdmin = user.role === 'admin' || user.role === 'super-admin';
    const isHR = user.department?.toUpperCase() === 'HR' || user.department === 'General Management/Administration';

    if (!isAdmin && !isHR) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const certData = await request.json();

    // Generate unique Certificate ID
    const count = await Certificate.countDocuments();
    const certificateId = `FMPG-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    
    const certificate = new Certificate({
      ...certData,
      certificateId,
      issuedBy: user.userId,
      issuedAt: new Date()
    });

    await certificate.save();
    return NextResponse.json({ message: 'Certificate issued successfully', certificate }, { status: 201 });

  } catch (error) {
    console.error('POST Certificates API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
