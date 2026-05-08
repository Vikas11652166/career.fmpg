import connectDB from '@/lib/db/connect';
import OfferLetter from '@/lib/models/offerLetter';
import Application from '@/lib/models/application';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    const { slug } = await params;
    const { rejectionReason } = await request.json();
    await connectDB();

    const offerLetter = await OfferLetter.findOne({ applicationId: slug });
    if (!offerLetter) {
      return NextResponse.json({ message: 'Offer not found' }, { status: 404 });
    }

    offerLetter.status = 'Rejected';
    offerLetter.rejectionReason = rejectionReason;
    offerLetter.rejectedAt = new Date();
    await offerLetter.save();

    await Application.findByIdAndUpdate(offerLetter.applicationId, {
      $set: { status: 'Offer Rejected', updatedAt: new Date() }
    });

    return NextResponse.json({ message: 'Offer rejected successfully' });
  } catch (error) {
    console.error('Contract Reject API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
