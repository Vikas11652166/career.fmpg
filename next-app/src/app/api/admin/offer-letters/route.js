import connectDB from '@/lib/db/connect';
import OfferLetter from '@/lib/models/offerLetter';
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
    const search = searchParams.get('search');

    const filter = {};
    if (search) {
      filter.$or = [
        { candidateName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await OfferLetter.countDocuments(filter);
    const offerLetters = await OfferLetter.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      offerLetters,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Admin Offer Letters GET API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
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
    const offerData = await request.json();

    // Generate unique Offer Letter ID
    const count = await OfferLetter.countDocuments();
    const offerLetterId = `OL-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    
    const offerLetter = new OfferLetter({
      ...offerData,
      offerLetterId, // Ensure this field exists in model if needed
      issuedBy: user.userId || user._id,
      issuedOn: new Date()
    });

    await offerLetter.save();
    return NextResponse.json({ message: 'Offer letter issued successfully', offerLetter }, { status: 201 });

  } catch (error) {
    console.error('POST Offer Letters API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
