import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import path from 'path';

class ResumeParserService {
  constructor() {
    this.patterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
      phone: /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b|(?:\+91|91)?\s?[6-9]\d{9}/gi,
    };
  }

  async parseResume(fileBuffer, mimeType, originalName) {
    try {
      let rawText = '';
      const fileExtension = path.extname(originalName).toLowerCase();

      if (fileExtension === '.pdf' || mimeType === 'application/pdf') {
        const data = await pdfParse(fileBuffer);
        rawText = data.text;
      } else if (['.doc', '.docx'].includes(fileExtension) || mimeType.includes('word')) {
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        rawText = result.value;
      } else {
        throw new Error(`Unsupported file format: ${fileExtension}`);
      }

      if (!rawText) throw new Error('Could not extract text');

      return {
        success: true,
        data: this.parseResumeText(rawText)
      };
    } catch (error) {
      console.error('Resume parsing error:', error);
      return { success: false, error: error.message };
    }
  }

  parseResumeText(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    const emailMatch = text.match(this.patterns.email);
    const phoneMatch = text.match(this.patterns.phone);

    return {
      personalInfo: {
        name: this.extractName(lines),
        email: emailMatch ? emailMatch[0] : '',
        phone: phoneMatch ? phoneMatch[0] : '',
      },
      skills: this.extractSkills(text),
      education: '', // Simplified for now
      experience: '' // Simplified for now
    };
  }

  extractName(lines) {
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      if (line.length > 2 && line.length < 50 && !line.includes('@')) {
        return line;
      }
    }
    return '';
  }

  extractSkills(text) {
    // Simplified skill extraction
    const commonSkills = ['React', 'Node.js', 'Python', 'Java', 'Javascript', 'Next.js', 'MongoDB', 'SQL'];
    return commonSkills.filter(skill => new RegExp(`\\b${skill}\\b`, 'i').test(text)).join(', ');
  }
}

export const resumeParserService = new ResumeParserService();