import { NextResponse } from 'next/server';
import { resumeParserService } from '@/lib/services/resumeParserService';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('resume');

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await resumeParserService.parseResume(
      buffer,
      file.type,
      file.name
    );

    if (!result.success) {
      return NextResponse.json({ message: result.error }, { status: 500 });
    }

    // Map to the format the frontend expects (based on api.js logic)
    const formattedData = {
      fullName: result.data.personalInfo.name,
      email: result.data.personalInfo.email,
      phone: result.data.personalInfo.phone,
      skills: result.data.skills,
      education: result.data.education,
      experience: result.data.experience
    };

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Parse Resume API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
