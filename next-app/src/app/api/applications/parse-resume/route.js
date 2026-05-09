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

    // Even if success is false, we want to return a 200 with empty fields if possible
    // to avoid the frontend crashing/stuck in loading.
    const data = result.data || {
      personalInfo: { name: '', email: '', phone: '', location: '' },
      skills: [],
      education: [],
      experience: []
    };

    // Helper to format education
    const formatEducation = (eduArray) => {
      if (!Array.isArray(eduArray)) return '';
      return eduArray.map(edu => {
        let str = '';
        if (edu.degree) str += `${edu.degree}`;
        if (edu.institution) str += ` at ${edu.institution}`;
        if (edu.year) str += ` (${edu.year})`;
        return str.trim() || edu.rawText || '';
      }).filter(Boolean).join('\n');
    };

    // Helper to format experience
    const formatExperience = (expArray) => {
      if (!Array.isArray(expArray)) return '';
      return expArray.map(exp => {
        let str = '';
        if (exp.title) str += `${exp.title}`;
        if (exp.company) str += ` at ${exp.company}`;
        if (exp.duration) str += ` [${exp.duration}]`;
        return str.trim() || exp.rawText || '';
      }).filter(Boolean).join('\n');
    };

    // Map to the format the frontend expects
    const formattedData = {
      fullName: data.personalInfo?.name || '',
      email: data.personalInfo?.email || '',
      phone: data.personalInfo?.phone || '',
      skills: Array.isArray(data.skills) ? data.skills.join(', ') : (data.skillsText || ''),
      education: formatEducation(data.education) || data.educationText || '',
      experience: formatExperience(data.experience) || data.experienceText || '',
      parsingWarning: result.warning || null
    };

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Parse Resume API Error:', error);
    // Return empty data instead of 500 to keep the UI functional
    return NextResponse.json({
      fullName: '',
      email: '',
      phone: '',
      skills: '',
      education: '',
      experience: '',
      error: 'Parsing interface failure'
    }, { status: 200 }); // Still return 200 so frontend doesn't catch it as a hard error
  }
}
