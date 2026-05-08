import connectDB from '@/lib/db/connect';
import Certificate from '@/lib/models/certificate';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    await connectDB();

    // Support both MongoDB ID and the formatted certificateId (e.g., FMPG-2026-0001)
    const certificate = await Certificate.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(id) ? id : new mongoose.Types.ObjectId() },
        { certificateId: id }
      ]
    }).populate('issuedBy', 'name');

    if (!certificate) {
      return NextResponse.json({ message: 'Certificate not found' }, { status: 404 });
    }

    return NextResponse.json({ certificate });
  } catch (error) {
    console.error('Verify Certificate API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
