import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';

class ResumeParserService {
  constructor() {
    // Common section headers and their variations
    this.sectionHeaders = {
      personal: [
        'personal information', 'personal details', 'contact information', 
        'contact details', 'about me', 'profile', 'summary', 'objective'
      ],
      education: [
        'education', 'educational background', 'academic background', 
        'qualifications', 'degrees', 'schooling', 'academics'
      ],
      experience: [
        'experience', 'work experience', 'professional experience', 
        'employment history', 'career history', 'work history', 
        'professional background', 'employment', 'career'
      ],
      skills: [
        'skills', 'technical skills', 'core competencies', 'competencies',
        'expertise', 'technologies', 'proficiencies', 'abilities',
        'technical expertise', 'key skills'
      ],
      projects: [
        'projects', 'personal projects', 'key projects', 'notable projects',
        'project experience', 'portfolio', 'achievements'
      ],
      certifications: [
        'certifications', 'certificates', 'licenses', 'credentials',
        'professional certifications', 'awards'
      ]
    };

    // Common patterns for extracting contact information
    this.patterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
      phone: /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b|(?:\+91|91)?\s?[6-9]\d{9}/gi,
      linkedin: /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/gi,
      github: /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+/gi,
      website: /(?:https?:\/\/)?(?:www\.)?[\w.-]+\.[a-z]{2,}(?:\/[\w.-]*)*\/?/gi
    };
  }

  /**
   * Main function to parse resume from buffer
   */
  async parseResume(fileBuffer, mimeType, originalName) {
    try {
      console.log(`Starting resume parsing for file: ${originalName} (${fileBuffer.length} bytes)`);
      
      let rawText = '';
      const fileExtension = path.extname(originalName).toLowerCase();

      // Extract text based on file type
      try {
        if (fileExtension === '.pdf' || mimeType === 'application/pdf') {
          rawText = await this.extractTextFromPDF(fileBuffer);
        } else if (['.doc', '.docx'].includes(fileExtension) || 
                   mimeType.includes('application/msword') || 
                   mimeType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
          rawText = await this.extractTextFromDOCX(fileBuffer);
        } else {
          console.warn(`Unsupported file format: ${fileExtension}`);
        }
      } catch (extractionError) {
        console.error('Text extraction failed:', extractionError);
      }

      if (!rawText || rawText.trim().length === 0) {
        console.warn('Could not extract text from the resume file. Returning empty profile.');
        return {
          success: true, 
          warning: 'Text extraction failed or file is empty',
          data: this.getDefaultParsedData(),
          rawText: ''
        };
      }

      console.log(`Extracted text length: ${rawText.length} characters`);

      // Parse the extracted text
      const parsedData = this.parseResumeText(rawText);

      return {
        success: true,
        data: parsedData,
        rawText: rawText.substring(0, 1000)
      };

    } catch (error) {
      console.error('Critical resume parsing error:', error);
      return {
        success: false,
        error: error.message,
        data: this.getDefaultParsedData()
      };
    }
  }

  getDefaultParsedData() {
    return {
      personalInfo: { name: '', email: '', phone: '', location: '' },
      phoneNumber: '',
      education: [],
      experience: [],
      skills: [],
      projects: [],
      yearsOfExperience: 0,
      educationText: '',
      experienceText: '',
      skillsText: '',
      projectsText: ''
    };
  }

  async extractTextFromPDF(buffer) {
    try {
      const data = await pdfParse(buffer);
      return data.text || '';
    } catch (error) {
      console.error('PDF extraction error:', error);
      return '';
    }
  }

  async extractTextFromDOCX(buffer) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    } catch (error) {
      console.error('DOCX extraction error:', error);
      return '';
    }
  }

  parseResumeText(text) {
    const normalizedText = this.normalizeText(text);
    const lines = normalizedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    const phoneNumber = this.extractPhoneNumber(normalizedText);
    const emailMatch = normalizedText.match(this.patterns.email);
    const email = emailMatch ? emailMatch[0] : '';
    const name = this.extractName(lines);
    const sections = this.identifySections(lines);

    const education = this.extractEducation(sections, lines);
    const experience = this.extractExperience(sections, lines);
    const skills = this.extractSkills(sections, lines, normalizedText);
    const projects = this.extractProjects(sections, lines);
    const yearsOfExperience = this.calculateYearsOfExperience(experience);

    return {
      personalInfo: {
        name: name,
        email: email,
        phone: phoneNumber,
        location: this.extractLocation(normalizedText, lines)
      },
      phoneNumber,
      education,
      experience,
      skills,
      projects,
      yearsOfExperience,
      educationText: this.getSectionText(sections.education, lines),
      experienceText: this.getSectionText(sections.experience, lines),
      skillsText: this.getSectionText(sections.skills, lines),
      projectsText: this.getSectionText(sections.projects, lines)
    };
  }

  normalizeText(text) {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\t/g, ' ')
      .replace(/\b(OBJECTIVE|SUMMARY|EXPERIENCE|EDUCATION|SKILLS|PROJECTS|CERTIFICATIONS|AWARDS)\b/gi, '\n$1\n')
      .replace(/•/g, '\n•')
      .replace(/◦/g, '\n◦')
      .replace(/\b(19|20)\d{2}\s*-/g, '\n$&')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();
  }

  extractPhoneNumber(text) {
    const phonePatterns = [
      /(?:\+91|91)[-.\s]?[6-9]\d{9}/g,
      /[6-9]\d{9}/g,
      /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g,
      /(?:\+\d{1,3}[-.\s]?)?\d{10,}/g
    ];

    for (const pattern of phonePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        const validNumbers = matches
          .map(num => this.cleanPhoneNumber(num))
          .filter(num => num.length >= 10 && num.length <= 15)
          .sort((a, b) => b.length - a.length);
        
        if (validNumbers.length > 0) {
          return validNumbers[0];
        }
      }
    }
    return '';
  }

  extractName(lines) {
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      const words = firstLine.split(/\s+/);
      for (let i = 0; i < Math.min(6, words.length - 1); i++) {
        const nameCandidate = words.slice(i, i + 2).join(' ');
        if (nameCandidate.includes('@') || nameCandidate.includes('+') || 
            nameCandidate.includes('|') || nameCandidate.includes('http')) continue;
        const nameParts = nameCandidate.split(' ');
        if (nameParts.length === 2 && nameParts.every(part => /^[A-Z][a-z]+$/.test(part))) {
          return nameCandidate;
        }
      }
    }
    
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i].trim();
      if (line.length < 2 || line.length > 60) continue;
      if (this.patterns.email.test(line) || this.patterns.phone.test(line)) continue;
      if (line.includes('http') || line.includes('www.')) continue;
      const lowerLine = line.toLowerCase();
      if (['resume', 'cv', 'curriculum vitae', 'profile', 'contact', 'objective', 'summary'].some(word => lowerLine.includes(word))) continue;
      if (line.includes('+') || line.includes('@') || line.includes('|')) continue;
      const words = line.split(/\s+/).filter(word => word.length > 0);
      if (words.length >= 1 && words.length <= 4) {
        const capitalizedWords = words.filter(word => /^[A-Z]/.test(word) || word === word.toUpperCase());
        if (capitalizedWords.length >= words.length * 0.5) return line;
      }
    }
    return '';
  }

  cleanPhoneNumber(phone) {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('91') && cleaned.length === 12) cleaned = cleaned.substring(2);
    if (cleaned.startsWith('1') && cleaned.length === 11) cleaned = cleaned.substring(1);
    return cleaned;
  }

  extractLocation(text, lines) {
    const locationPatterns = [
      /([A-Z][a-z]+,\s*[A-Z]{2})/g,
      /([A-Z][a-z]+\s*,\s*[A-Z][a-z]+)/g,
    ];
    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match) return match[0];
    }
    return '';
  }

  identifySections(lines) {
    const sections = {
      education: { start: -1, end: -1 },
      experience: { start: -1, end: -1 },
      skills: { start: -1, end: -1 },
      projects: { start: -1, end: -1 },
      certifications: { start: -1, end: -1 }
    };

    const sectionStarts = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lowerLine = line.toLowerCase();
      
      if (sections.education.start === -1 && this.sectionHeaders.education.some(h => lowerLine.includes(h))) {
        sections.education.start = i;
        sectionStarts.push({ type: 'education', index: i });
      }
      if (sections.experience.start === -1 && this.sectionHeaders.experience.some(h => lowerLine.includes(h))) {
        sections.experience.start = i;
        sectionStarts.push({ type: 'experience', index: i });
      }
      if (sections.skills.start === -1 && this.sectionHeaders.skills.some(h => lowerLine.includes(h))) {
        sections.skills.start = i;
        sectionStarts.push({ type: 'skills', index: i });
      }
      if (sections.projects.start === -1 && this.sectionHeaders.projects.some(h => lowerLine.includes(h))) {
        sections.projects.start = i;
        sectionStarts.push({ type: 'projects', index: i });
      }
    }

    sectionStarts.sort((a, b) => a.index - b.index);
    for (let i = 0; i < sectionStarts.length; i++) {
      const current = sectionStarts[i];
      const next = sectionStarts[i + 1];
      sections[current.type].end = next ? next.index - 1 : lines.length - 1;
    }
    return sections;
  }

  extractEducation(sections, lines) {
    const education = [];
    if (sections.education.start !== -1) {
      const educationLines = lines.slice(sections.education.start + 1, sections.education.end + 1);
      let collectedLines = [];
      for (let i = 0; i < educationLines.length; i++) {
        const line = educationLines[i].trim();
        if (!line || line.length < 2) continue;
        collectedLines.push(line);
        const institutionMatch = line.match(/\b(university|college|institute|school|academy)\b/i);
        const isEducationBoundary = institutionMatch || i === educationLines.length - 1;
        if (isEducationBoundary || i === educationLines.length - 1) {
          if (collectedLines.length > 0) {
            const combinedText = collectedLines.join(' ');
            const entryInstitutionMatch = combinedText.match(/\b([A-Z][A-Z,.\s]*(?:university|college|institute|school|academy)[A-Z,.\s]*)\b/i);
            const entryDegreeMatch = combinedText.match(/\b(bachelor|master|phd|diploma|btech|mtech|be|me|bsc|msc|mba)\b/i);
            const entryYearMatches = combinedText.match(/\b(19|20)\d{2}\b/g);
            const entry = {
              institution: entryInstitutionMatch ? entryInstitutionMatch[0].trim() : '',
              degree: entryDegreeMatch ? entryDegreeMatch[0].trim() : '',
              year: entryYearMatches ? entryYearMatches[entryYearMatches.length-1] : '',
              rawText: combinedText.trim()
            };
            if (entry.institution || entry.degree || entry.year) education.push(entry);
            collectedLines = institutionMatch ? [line] : [];
          }
        }
      }
    }
    return education.slice(0, 5);
  }

  extractExperience(sections, lines) {
    const experience = [];
    if (sections.experience.start !== -1) {
      const experienceLines = lines.slice(sections.experience.start + 1, sections.experience.end + 1);
      let collectedLines = [];
      for (let i = 0; i < experienceLines.length; i++) {
        const line = experienceLines[i].trim();
        if (!line || line.length < 2) continue;
        collectedLines.push(line);
        const jobTitleMatch = line.match(/\b(software engineer|developer|manager|analyst|engineer)\b/i);
        const isExperienceBoundary = jobTitleMatch || i === experienceLines.length - 1;
        if (isExperienceBoundary || i === experienceLines.length - 1) {
          if (collectedLines.length > 0) {
            const combinedText = collectedLines.join(' ');
            const entryJobTitleMatch = combinedText.match(/\b(software engineer|developer|manager|analyst|engineer)\b/i);
            const entryYearMatches = combinedText.match(/\b(19|20)\d{2}\b/g);
            const entry = {
              title: entryJobTitleMatch ? entryJobTitleMatch[0].trim() : '',
              duration: combinedText.match(/\b(19|20)\d{2}\s*[-–—]\s*(?:(19|20)\d{2}|present|current)/i)?.[0] || '',
              description: combinedText.trim(),
              rawText: combinedText.trim()
            };
            if (entry.title || entry.duration) experience.push(entry);
            collectedLines = jobTitleMatch ? [line] : [];
          }
        }
      }
    }
    return experience.slice(0, 5);
  }

  extractSkills(sections, lines, fullText) {
    const skills = new Set();
    const technicalSkills = [
      'javascript', 'typescript', 'python', 'java', 'react', 'angular', 'vue', 'next.js', 'node.js', 'express', 'mongodb', 'mysql', 'postgresql', 'aws', 'docker', 'kubernetes', 'git', 'html', 'css', 'tailwind', 'bootstrap', 'redux', 'graphql', 'rest api'
    ];
    const lowerText = fullText.toLowerCase();
    for (const skill of technicalSkills) {
      const skillRegex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (skillRegex.test(lowerText)) skills.add(skill);
    }
    
    if (sections.skills.start !== -1) {
        const skillsText = lines.slice(sections.skills.start + 1, sections.skills.end + 1).join(', ');
        const potentialSkills = skillsText.split(/[,|•]/).map(s => s.trim()).filter(s => s.length > 1 && s.length < 30);
        potentialSkills.forEach(s => {
            if (s.length > 2) skills.add(s);
        });
    }

    return Array.from(skills).slice(0, 50);
  }

  extractProjects(sections, lines) {
    const projects = [];
    if (sections.projects.start !== -1) {
      const projectLines = lines.slice(sections.projects.start + 1, sections.projects.end + 1);
      let currentProject = {};
      for (const line of projectLines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        const isProjectTitle = trimmedLine.length < 50 && (trimmedLine.match(/^[•◦\-\*]/) || trimmedLine.match(/^[A-Z]/));
        if (isProjectTitle) {
          if (currentProject.title) projects.push(currentProject);
          currentProject = { title: trimmedLine.replace(/^[•◦\-\*]\s*/, '').trim() };
        } else if (currentProject.title) {
          currentProject.description = (currentProject.description || '') + ' ' + trimmedLine;
        }
      }
      if (currentProject.title) projects.push(currentProject);
    }
    return projects.slice(0, 10);
  }

  calculateYearsOfExperience(experience) {
    let totalMonths = 0;
    const currentYear = new Date().getFullYear();
    for (const exp of experience) {
      const yearMatches = exp.duration?.match(/\b(19|20)\d{2}\b/g);
      if (yearMatches?.length >= 2) {
        totalMonths += (parseInt(yearMatches[1]) - parseInt(yearMatches[0])) * 12;
      } else if (yearMatches?.length === 1 && exp.duration.toLowerCase().includes('present')) {
        totalMonths += (currentYear - parseInt(yearMatches[0])) * 12;
      }
    }
    return Math.round(totalMonths / 12 * 10) / 10;
  }

  getSectionText(section, lines) {
    if (section.start === -1) return '';
    return lines.slice(section.start + 1, section.end + 1).join('\n').trim();
  }
}

export const resumeParserService = new ResumeParserService();