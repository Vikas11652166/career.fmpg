import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Recommendation from '@/lib/models/recommendation';
import User from '@/lib/models/user';
import Application from '@/lib/models/application';
import { verifyAuth } from '@/lib/auth/middleware';
import bcrypt from 'bcryptjs';

export async function GET(req) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search');
    const type = searchParams.get('type'); // 'all' or 'mine'

    let query = {};
    
    // Authorization check
    if (type === 'all') {
      if (user.role !== 'admin' && user.role !== 'super-admin' && user.role !== 'hr') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }
      if (status) query.status = status;
      if (search) {
        query.$or = [
          { recommendedUserName: { $regex: search, $options: 'i' } },
          { recommendedUserEmail: { $regex: search, $options: 'i' } },
          { recommenderId: { $regex: search, $options: 'i' } }
        ];
      }
    } else {
      // Default to 'mine'
      query.recommender = user.userId;
      if (status) query.status = status;
    }

    const skip = (page - 1) * limit;

    const recommendations = await Recommendation.find(query)
      .populate('recommender', 'name email employeeId department position')
      .populate('recommendedUser', 'name email status')
      .populate('reviewedBy', 'name')
      .populate('jobId', 'title department location')
      .populate('applicationId', 'status createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Recommendation.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalCount: total
        }
      }
    });
  } catch (error) {
    console.error('Recommendations GET Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { recommendedUserEmail, recommendedUserName, jobId, recommendationMessage } = await req.json();

    // Verify recommender
    const recommender = await User.findById(user.userId);
    if (!recommender || recommender.status !== 'active') {
      return NextResponse.json({ message: 'Only active employees can make recommendations' }, { status: 403 });
    }

    // Check existing application
    const existingApplication = await Application.findOne({
      email: recommendedUserEmail,
      jobId: jobId
    });

    if (!existingApplication) {
      return NextResponse.json({ message: 'No application found for this candidate and job. Candidates must apply first.' }, { status: 400 });
    }

    if (existingApplication.userId && existingApplication.userId.toString() === user.userId.toString()) {
      return NextResponse.json({ message: 'You cannot recommend your own application' }, { status: 400 });
    }

    if (existingApplication.recommendationId) {
      return NextResponse.json({ message: 'This application already has a recommendation' }, { status: 400 });
    }

    // Find or create recommended user
    let recommendedUser = await User.findOne({ email: recommendedUserEmail });
    if (!recommendedUser) {
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedTempPassword = await bcrypt.hash(tempPassword, 10);
      
      recommendedUser = new User({
        name: recommendedUserName,
        email: recommendedUserEmail,
        password: hashedTempPassword,
        status: 'active'
      });
      await recommendedUser.save();
    }

    const newRecommendation = new Recommendation({
      recommender: user.userId,
      recommenderId: recommender.employeeId || 'N/A',
      recommendedUser: recommendedUser._id,
      recommendedUserEmail,
      recommendedUserName,
      recommendationMessage,
      jobId: jobId,
      applicationId: existingApplication._id
    });

    await newRecommendation.save();

    // Update application
    existingApplication.recommendationId = newRecommendation._id;
    existingApplication.isReferred = true;
    existingApplication.referrerEmployeeId = recommender.employeeId;
    existingApplication.referralMessage = recommendationMessage;
    await existingApplication.save();

    return NextResponse.json({
      success: true,
      message: 'Recommendation submitted successfully',
      data: newRecommendation
    }, { status: 201 });

  } catch (error) {
    console.error('Recommendations POST Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
