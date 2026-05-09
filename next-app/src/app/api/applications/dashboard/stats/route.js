import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Application from '@/lib/models/application';
import Job from '@/lib/models/job';
import Certificate from '@/lib/models/certificate';
import OfferLetter from '@/lib/models/offerLetter';
import { verifyAuth } from '@/lib/auth/middleware';
import mongoose from 'mongoose';

export async function GET(req) {
  try {
    const user = await verifyAuth(req);
    if (!user || (user.role !== 'admin' && user.role !== 'hr' && user.role !== 'super-admin')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateRange = searchParams.get('dateRange') || 'all';

    await connectDB();

    let dateMatch = {};
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate = new Date();
      if (dateRange === 'today') {
        startDate.setHours(0, 0, 0, 0);
      } else if (dateRange === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (dateRange === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      }
      dateMatch.createdAt = { $gte: startDate };
    }

    const [
      appStats,
      totalJobsCount,
      certificatesCount,
      offersCount,
      recentApps
    ] = await Promise.all([
      Application.aggregate([{ $match: dateMatch }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      Job.countDocuments({ isActive: true }),
      Certificate.countDocuments(),
      OfferLetter.countDocuments(),
      Application.find(dateMatch)
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('jobId', 'title company slug')
        .populate('userId', 'name email')
        .lean()
    ]);

    let totalApplications = 0;
    const statusCounts = {};
    let offersGenerated = 0;

    appStats.forEach(stat => {
      totalApplications += stat.count;
      statusCounts[stat._id] = stat.count;
      if (stat._id === 'offered' || stat._id === 'Offer Sent' || stat._id === 'Offer Accepted') {
         offersGenerated += stat.count;
      }
    });

    const conversionRate = totalApplications > 0 
      ? ((offersGenerated / totalApplications) * 100).toFixed(1)
      : 0;

    return NextResponse.json({
      totalApplications,
      statusCounts,
      conversionRate,
      activeJobs: totalJobsCount,
      certificatesIssued: certificatesCount,
      offersGenerated: offersCount,
      recentApplicationsList: recentApps
    });

  } catch (error) {
    console.error('Stats API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
