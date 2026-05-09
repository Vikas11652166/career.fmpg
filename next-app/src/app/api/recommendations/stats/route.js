import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Recommendation from '@/lib/models/recommendation';
import { verifyAuth } from '@/lib/auth/middleware';

export async function GET(req) {
  try {
    const user = await verifyAuth(req);
    if (!user || (user.role !== 'admin' && user.role !== 'super-admin' && user.role !== 'hr')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const stats = await Recommendation.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          reviewed: { $sum: { $cond: [{ $eq: ['$status', 'reviewed'] }, 1, 0] } },
          selected: { $sum: { $cond: [{ $eq: ['$status', 'selected'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } }
        }
      }
    ]);

    const topRecommenders = await Recommendation.aggregate([
      {
        $group: {
          _id: '$recommender',
          count: { $sum: 1 },
          selectedCount: { $sum: { $cond: [{ $eq: ['$status', 'selected'] }, 1, 0] } }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'recommender'
        }
      },
      { $unwind: '$recommender' },
      {
        $project: {
          name: '$recommender.name',
          employeeId: '$recommender.employeeId',
          totalRecommendations: '$count',
          selectedRecommendations: '$selectedCount'
        }
      },
      { $sort: { totalRecommendations: -1 } },
      { $limit: 10 }
    ]);

    return NextResponse.json({
      success: true,
      data: {
        stats: stats[0] || { total: 0, pending: 0, reviewed: 0, selected: 0, rejected: 0 },
        topRecommenders
      }
    });

  } catch (error) {
    console.error('Recommendation Stats Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
