import connectDB from '@/lib/db/connect';
import Application from '@/lib/models/application';
import Job from '@/lib/models/job';
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { uploadFile } from '@/lib/config/cloudinary';
import { recaptchaService } from '@/lib/services/recaptchaService';

export async function POST(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const formData = await request.formData();
    
    const recaptchaToken = formData.get('recaptchaToken');
    const remoteIP = request.headers.get('x-forwarded-for') || request.ip;
    
    // Verify reCAPTCHA
    const recaptchaVerification = await recaptchaService.verifyToken(recaptchaToken, remoteIP);
    if (!recaptchaVerification.success) {
      return NextResponse.json({ 
        message: recaptchaVerification.error || 'reCAPTCHA verification failed' 
      }, { status: 400 });
    }

    const jobId = formData.get('jobId');
    const fullName = formData.get('fullName');
    const email = formData.get('email');
    const phone = formData.get('phone');
    const experience = formData.get('experience');
    const education = formData.get('education');
    const skills = formData.get('skills');
    const coverLetter = formData.get('coverLetter');
    const resume = formData.get('resume');
    const coverLetterFile = formData.get('coverLetterFile');
    const questionAnswersRaw = formData.get('questionAnswers');

    // Referral fields
    const isReferred = formData.get('isReferred') === 'true';
    const referrerEmployeeId = formData.get('referrerEmployeeId');
    const referrerName = formData.get('referrerName');
    const referrerEmail = formData.get('referrerEmail');
    const referralMessage = formData.get('referralMessage');

    let questionAnswers = [];
    if (questionAnswersRaw) {
      try {
        questionAnswers = JSON.parse(questionAnswersRaw);
      } catch (e) {
        console.error('Failed to parse questionAnswers:', e);
      }
    }

    if (!jobId || !fullName || !email) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Phone validation
    if (!phone) {
      return NextResponse.json({ message: 'Phone number is required' }, { status: 400 });
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return NextResponse.json({ message: 'Invalid phone number format' }, { status: 400 });
    }

    // Check for existing application
    const existing = await Application.findOne({
      userId: user.userId,
      jobId: jobId,
      status: { $ne: 'rejected' }
    });

    if (existing) {
      return NextResponse.json({ message: 'Already applied for this position' }, { status: 400 });
    }

    // Handle resume upload
    let resumeData = {};
    if (resume && resume.size > 0) {
      try {
        const buffer = Buffer.from(await resume.arrayBuffer());
        const uploadResult = await uploadFile(buffer, 'resumes', 'raw', resume.name);
        resumeData = {
          resumeUrl: uploadResult.secure_url,
          cloudinaryPublicId: uploadResult.public_id
        };
      } catch (uploadError) {
        console.error('Resume upload failed:', uploadError);
        return NextResponse.json({ message: 'Resume upload failed' }, { status: 500 });
      }
    }

    // Handle cover letter upload
    let coverLetterData = {};
    if (coverLetterFile && coverLetterFile.size > 0) {
      try {
        const buffer = Buffer.from(await coverLetterFile.arrayBuffer());
        const uploadResult = await uploadFile(buffer, 'cover-letters', 'raw', coverLetterFile.name);
        coverLetterData = {
          coverLetterUrl: uploadResult.secure_url,
          coverLetterPublicId: uploadResult.public_id
        };
      } catch (uploadError) {
        console.error('Cover letter upload failed:', uploadError);
        return NextResponse.json({ message: 'Cover letter upload failed' }, { status: 500 });
      }
    }

    const application = new Application({
      jobId,
      userId: user.userId,
      fullName,
      email,
      phone: cleanPhone,
      experience,
      education,
      skills: typeof skills === 'string' ? skills.split(',').map(s => s.trim()).filter(s => s) : (Array.isArray(skills) ? skills : []),
      coverLetter,
      questionAnswers,
      isReferred,
      referrerEmployeeId,
      referrerName,
      referrerEmail,
      referralMessage,
      ...resumeData,
      ...coverLetterData
    });

    await application.save();
    return NextResponse.json({ message: 'Application submitted successfully', applicationId: application._id }, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'admin' && user.role !== 'super-admin' && user.role !== 'hr')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const jobId = searchParams.get('jobId');

    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (jobId && jobId !== 'undefined' && jobId !== 'null' && jobId !== 'all') filter.jobId = jobId;
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Application.countDocuments(filter);
    const applications = await Application.find(filter)
      .populate('jobId', 'title company department')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      applications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('GET Applications API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
