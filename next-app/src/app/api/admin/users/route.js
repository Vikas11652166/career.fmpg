import connectDB from '@/lib/db/connect';
import User from '@/lib/models/user';
import Application from '@/lib/models/application';
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';

export async function GET(request) {
  try {
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'admin' && user.role !== 'super-admin')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const view = searchParams.get('view') || 'users';

    const filter = {};
    if (view === 'staff') {
      filter.role = { $in: ['admin', 'employee', 'super-admin'] };
    } else if (view === 'users') {
      filter.role = 'user';
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Application status filtering for users
    if (status && status !== 'all' && view === 'users') {
      if (status === 'Not Applied') {
        const usersWithApps = await Application.distinct('userId');
        filter._id = { $nin: usersWithApps };
      } else {
        const usersWithMatchingApp = await Application.aggregate([
          { $sort: { createdAt: -1 } },
          { $group: { _id: "$userId", latestStatus: { $first: "$status" } } },
          { $match: { latestStatus: status } }
        ]);
        const userIds = usersWithMatchingApp.map(item => item._id);
        filter._id = { $in: userIds };
      }
    } else if (status && status !== 'all') {
      filter.status = status;
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Fetch latest application status for each user
    const userIds = users.map(u => u._id);
    const latestApps = await Application.find({ userId: { $in: userIds } })
      .select('userId status createdAt')
      .sort({ createdAt: -1 });

    const latestAppByUserId = new Map();
    latestApps.forEach(app => {
      if (!latestAppByUserId.has(app.userId.toString())) {
        latestAppByUserId.set(app.userId.toString(), app.status);
      }
    });

    const usersWithMeta = users.map(u => {
      const uObj = u.toObject();
      return {
        ...uObj,
        applicationStatus: latestAppByUserId.get(u._id.toString()) || 'Not Applied'
      };
    });

    // Stats
    const statsAggregation = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: { $cond: [{ $eq: ["$role", "user"] }, 1, 0] } },
          totalAdmins: { $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] } },
          totalSuperAdmins: { $sum: { $cond: [{ $eq: ["$role", "super-admin"] }, 1, 0] } },
          totalEmployees: { $sum: { $cond: [{ $eq: ["$role", "employee"] }, 1, 0] } },
          activeUsers: { 
            $sum: { 
              $cond: [
                { $and: [{ $eq: ["$role", "user"] }, { $eq: ["$status", "active"] }] }, 
                1, 0
              ] 
            } 
          },
          activeStaff: {
            $sum: {
              $cond: [
                { $and: [{ $in: ["$role", ["admin", "employee", "super-admin"]] }, { $eq: ["$status", "active"] }] },
                1, 0
              ]
            }
          },
          formerEmployees: { $sum: { $cond: [{ $eq: ["$status", "former"] }, 1, 0] } },
          suspendedAccounts: { $sum: { $cond: [{ $eq: ["$status", "suspended"] }, 1, 0] } }
        }
      }
    ]);

    const stats = statsAggregation[0] || { 
      totalUsers: 0, 
      totalAdmins: 0, 
      totalSuperAdmins: 0, 
      totalEmployees: 0, 
      activeUsers: 0, 
      activeStaff: 0,
      formerEmployees: 0,
      suspendedAccounts: 0
    };

    return NextResponse.json({
      users: usersWithMeta,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      stats
    });

  } catch (error) {
    console.error('Admin Users API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
