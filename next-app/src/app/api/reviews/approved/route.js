import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Review from '@/lib/models/review';

export async function GET(req) {
  try {
    await connectDB();
    const reviews = await Review.find({ status: 'approved' }).sort({ createdAt: -1 }).limit(10);
    return NextResponse.json({ reviews });
  } catch (error) {
    return NextResponse.json({ reviews: [] });
  }
}
