import mammoth from "mammoth";
import path from "path";

export interface IResumeParsedData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
  };
  phoneNumber: string;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    year: string;
    startYear?: string;
    endYear?: string;
    duration: string;
    grade?: string;
    rawText: string;
  }>;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    location?: string;
    startYear?: string;
    endYear?: string;
    description: string;
    rawText: string;
  }>;
  skills: string[];
  projects: Array<{
    title: string;
    description?: string;
    link?: string;
    technologies?: string;
  }>;
  yearsOfExperience: number;
  educationText: string;
  experienceText: string;
  skillsText: string;
  projectsText: string;
}

class ResumeParserService {
  private sectionHeaders: Record<string, string[]>;
  private patterns: Record<string, RegExp>;

  constructor() {
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

    this.patterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
      phone: /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b|(?:\+91|91)?\s?[6-9]\d{9}/gi,
      linkedin: /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/gi,
      github: /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+/gi,
      website: /(?:https?:\/\/)?(?:www\.)?[\w.-]+\.[a-z]{2,}(?:\/[\w.-]*)*\/?/gi
    };
  }

  async parseResume(fileBuffer: Buffer, mimeType: string, originalName: string): Promise<{ success: boolean; data: IResumeParsedData | null; error?: string; rawText?: string }> {
    try {
      console.log(`Starting resume parsing in Next.js for file: ${originalName}`);
      let rawText = '';
      const fileExtension = path.extname(originalName).toLowerCase();

      if (fileExtension === '.pdf' || mimeType === 'application/pdf') {
        rawText = await this.extractTextFromPDF(fileBuffer);
      } else if (['.doc', '.docx'].includes(fileExtension) || 
                 mimeType.includes('application/msword') || 
                 mimeType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
        rawText = await this.extractTextFromDOCX(fileBuffer);
      } else {
        throw new Error(`Unsupported file format: ${fileExtension}`);
      }

      if (!rawText || rawText.trim().length === 0) {
        throw new Error('Could not extract text from the resume file');
      }

      console.log(`Extracted text length: ${rawText.length} characters`);
      const parsedData = await this.parseResumeTextWithAI(rawText);

      return {
        success: true,
        data: parsedData,
        rawText: rawText.substring(0, 1000)
      };
    } catch (error: any) {
      console.error('Resume parsing service error:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  private async parseResumeTextWithAI(text: string): Promise<IResumeParsedData> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey === "your_openrouter_api_key_here") {
      console.log("OpenRouter API key not configured, falling back to classic regex parser.");
      return this.parseResumeText(text);
    }

    const systemPrompt = "You are a professional resume parsing engine. Your job is to extract candidate details from raw resume text and output a strict, valid JSON object matching the requested schema. Do not return any extra chat commentary or markdown formatting tags around the JSON.";
    
    const prompt = `Please parse the following raw candidate resume text and extract its fields into a strict JSON object:

\"\"\"
${text}
\"\"\"

The returned JSON object MUST exactly match the following TypeScript interface schema:
interface IResumeParsedData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
  };
  phoneNumber: string; // duplicate candidate phone number here
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    year: string;
    startYear?: string;
    endYear?: string;
    duration: string;
    grade?: string;
    rawText: string;
  }>;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    location?: string;
    startYear?: string;
    endYear?: string;
    description: string;
    rawText: string;
  }>;
  skills: string[];
  projects: Array<{
    title: string;
    description?: string;
    link?: string;
    technologies?: string;
  }>;
  yearsOfExperience: number;
  educationText: string;
  experienceText: string;
  skillsText: string;
  projectsText: string;
}

Guidelines:
1. Ensure email, phone, and name are properly extracted. If missing, leave as empty strings.
2. In 'educationText', 'experienceText', 'skillsText', and 'projectsText', provide the raw text blocks extracted for those respective sections.
3. Clean the phone number to be standard format (e.g. without spaces, dashes, or country codes if possible, or just raw cleaned digit strings).
4. Do not include markdown code block syntax (like \`\`\`json) in the response. Return ONLY a single raw JSON string starting with { and ending with }.`;

    const candidateModels = [
      "google/gemini-2.5-flash",
      "openai/gpt-oss-120b:free",
      "openrouter/free"
    ];

    for (const model of candidateModels) {
      try {
        console.log(`Calling OpenRouter AI (${model}) for resume parsing...`);
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": "https://fmpg.in",
            "X-Title": "FMPG Careers Portal"
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: prompt }
            ],
            temperature: 0.1,
            max_tokens: 2500
          })
        });

        if (!response.ok) {
          throw new Error(`OpenRouter API response error: ${response.status} ${response.statusText}`);
        }

        const resData = await response.json();
        if (resData.error) {
          throw new Error(`OpenRouter returned error: ${resData.error.message || JSON.stringify(resData.error)}`);
        }

        const rawJson = resData.choices?.[0]?.message?.content?.trim() || "";
        if (!rawJson) {
          throw new Error("Empty completion returned from model");
        }

        // Clean up markdown block wrapping if present
        const cleanJson = rawJson.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
        const parsed: IResumeParsedData = JSON.parse(cleanJson);
        
        console.log(`AI resume parsing completed successfully using ${model}!`);
        return parsed;
      } catch (err: any) {
        console.warn(`Failed to parse resume with OpenRouter AI model ${model}: ${err.message || err}`);
        // Continue to the next model in the candidateModels list
      }
    }

    console.warn("All OpenRouter AI models failed, falling back to heuristic parser...");
    return this.parseResumeText(text);
  }

  private async extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
      // Lazy load pdf-parse to prevent build-time module evaluation
      const pdfParse = require("pdf-parse");
      const parse = pdfParse.default || pdfParse;
      const data = await parse(buffer);
      return data.text;
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract text from PDF file');
    }
  }

  private async extractTextFromDOCX(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      console.error('DOCX extraction error:', error);
      throw new Error('Failed to extract text from DOCX file');
    }
  }

  private parseResumeText(text: string): IResumeParsedData {
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
        name,
        email,
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

  private normalizeText(text: string): string {
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

  private extractPhoneNumber(text: string): string {
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

  private cleanPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      cleaned = cleaned.substring(2);
    }
    if (cleaned.startsWith('1') && cleaned.length === 11) {
      cleaned = cleaned.substring(1);
    }
    return cleaned;
  }

  private extractName(lines: string[]): string {
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      const words = firstLine.split(/\s+/);
      
      for (let i = 0; i < Math.min(6, words.length - 1); i++) {
        const nameCandidate = words.slice(i, i + 2).join(' ');
        if (nameCandidate.includes('@') || nameCandidate.includes('+') || 
            nameCandidate.includes('|') || nameCandidate.includes('http')) continue;
        
        const nameParts = nameCandidate.split(' ');
        if (nameParts.length === 2 && 
            nameParts.every(part => /^[A-Z][a-z]+$/.test(part))) {
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
        const capitalizedWords = words.filter(word => 
          /^[A-Z]/.test(word) || word === word.toUpperCase()
        );
        if (capitalizedWords.length >= words.length * 0.5) {
          return line;
        }
      }
    }
    return '';
  }

  private extractLocation(text: string, lines: string[]): string {
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

  private identifySections(lines: string[]): Record<string, { start: number; end: number }> {
    const sections: Record<string, { start: number; end: number }> = {
      education: { start: -1, end: -1 },
      experience: { start: -1, end: -1 },
      skills: { start: -1, end: -1 },
      projects: { start: -1, end: -1 },
      certifications: { start: -1, end: -1 }
    };

    const sectionStarts: Array<{ type: string; index: number }> = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lowerLine = line.toLowerCase();
      
      if (sections.education.start === -1) {
        if (lowerLine === 'education' || lowerLine === 'educational background' || lowerLine === 'academic background' || lowerLine === 'qualifications' || lowerLine === 'academic' || line.match(/^EDUCATION$/i)) {
          sections.education.start = i;
          sectionStarts.push({ type: 'education', index: i });
        }
      }
      if (sections.experience.start === -1) {
        if (lowerLine === 'experience' || lowerLine === 'work experience' || lowerLine === 'professional experience' || lowerLine === 'employment history' || lowerLine === 'work' || lowerLine === 'employment' || line.match(/^EXPERIENCE$/i)) {
          sections.experience.start = i;
          sectionStarts.push({ type: 'experience', index: i });
        }
      }
      if (sections.skills.start === -1) {
        if (lowerLine === 'skills' || lowerLine === 'technical skills' || lowerLine === 'core competencies' || lowerLine === 'competencies' || lowerLine === 'key skills' || lowerLine === 'expertise' || line.match(/^SKILLS$/i)) {
          sections.skills.start = i;
          sectionStarts.push({ type: 'skills', index: i });
        }
      }
      if (sections.projects.start === -1) {
        if (lowerLine === 'projects' || lowerLine === 'personal projects' || lowerLine === 'key projects' || lowerLine === 'portfolio' || line.match(/^PROJECTS$/i)) {
          sections.projects.start = i;
          sectionStarts.push({ type: 'projects', index: i });
        }
      }
      if (sections.certifications.start === -1) {
        if (lowerLine === 'certifications' || lowerLine === 'certificates' || lowerLine === 'awards' || line.match(/^CERTIFICATIONS$/i) || line.match(/^CERTIFICATES$/i) || line.match(/^AWARDS$/i)) {
          sections.certifications.start = i;
          sectionStarts.push({ type: 'certifications', index: i });
        }
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

  private extractEducation(sections: Record<string, { start: number; end: number }>, lines: string[]): any[] {
    const education: any[] = [];

    if (sections.education.start !== -1) {
      const educationLines = lines.slice(sections.education.start + 1, sections.education.end + 1);
      let collectedLines: string[] = [];
      
      for (let i = 0; i < educationLines.length; i++) {
        const line = educationLines[i].trim();
        if (!line || line.length < 2) continue;
        
        collectedLines.push(line);
        
        const institutionMatch = line.match(/\b(university|college|institute|school|academy|uit|eth|punjab|jnv|sheohar)\b/i);
        const degreeMatch = line.match(/\b(bachelor|master|phd|doctorate|diploma|certificate|b\.?\s?[asce]|m\.?\s?[asce]|mba|bba|be|btech|mtech|ms|ma|ba|bsc|msc|engineering|degree|secondary|senior|matric|post-matric)\b/i);
        const yearMatch = line.match(/\b(19|20)\d{2}\b/g);
        const dateRangeMatch = line.match(/\b(19|20)\d{2}\s*[-–—]\s*(19|20)\d{2}|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(19|20)\d{2}|\b(19|20)\d{2}\s*\|\s*\w+/i);
        
        const isEducationBoundary = institutionMatch || 
                                  (degreeMatch && (yearMatch || dateRangeMatch)) ||
                                  (i === educationLines.length - 1);
        
        if (isEducationBoundary || i === educationLines.length - 1) {
          if (collectedLines.length > 0) {
            const combinedText = collectedLines.join(' ');
            const entryInstitutionMatch = combinedText.match(/\b([A-Z][A-Z,.\s]*(?:university|college|institute|school|academy|uit|eth|punjab|jnv|sheohar)[A-Z,.\s]*)\b/i);
            const entryDegreeMatch = combinedText.match(/\b(bachelor\s+of\s+engineering|secondary\s+education|senior\s+secondary|bachelor|master|phd|doctorate|diploma|certificate|b\.?\s?[asce]|m\.?\s?[asce]|mba|bba|be|btech|mtech|ms|ma|ba|bsc|msc|engineering|degree|matric|post-matric)\b/i);
            const entryFieldMatch = combinedText.match(/\b(computer\s+science|electrical|mechanical|civil|information\s+technology|it|cse|ece|eee|class\s+\d+)\b/i);
            const entryYearMatches = combinedText.match(/\b(19|20)\d{2}\b/g);
            const entryDateRangeMatch = combinedText.match(/\b(19|20)\d{2}\s*[-–—]\s*(19|20)\d{2}|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(19|20)\d{2}|\b(19|20)\d{2}\s*\|\s*\w+/i);
            const entryGradeMatch = combinedText.match(/(\d+\.?\d*)%|gpa:?\s*(\d+\.?\d*)|cgpa:?\s*(\d+\.?\d*)/i);
            
            const entry: any = {
              institution: entryInstitutionMatch ? entryInstitutionMatch[0].trim() : '',
              degree: entryDegreeMatch ? entryDegreeMatch[0].trim() : '',
              field: entryFieldMatch ? entryFieldMatch[0].trim() : '',
              year: '',
              startYear: '',
              endYear: '',
              duration: entryDateRangeMatch ? entryDateRangeMatch[0].trim() : '',
              grade: entryGradeMatch ? (entryGradeMatch[1] || entryGradeMatch[2] || entryGradeMatch[3]) : '',
              rawText: combinedText.trim()
            };
            
            if (entryYearMatches && entryYearMatches.length > 0) {
              if (entryYearMatches.length === 1) {
                entry.year = entryYearMatches[0];
                entry.endYear = entryYearMatches[0];
              } else if (entryYearMatches.length >= 2) {
                entry.startYear = entryYearMatches[0];
                entry.endYear = entryYearMatches[entryYearMatches.length - 1];
                entry.year = entry.endYear;
              }
            }
            
            if (entry.institution || entry.degree || entry.year) {
              education.push(entry);
            }
            
            if (i < educationLines.length - 1 && institutionMatch) {
              collectedLines = [line];
            } else {
              collectedLines = [];
            }
          }
        }
      }
    }

    if (education.length === 0) {
      const degreePatterns = [
        /\b(bachelor\s+of\s+engineering|secondary\s+education|senior\s+secondary|bachelor|master|phd|doctorate|diploma|certificate|b\.?\s?[asce]|m\.?\s?[asce]|mba|bba|be|btech|mtech|ms|ma|ba|bsc|msc|engineering|degree|matric|post-matric)\b/i
      ];
      const institutionPatterns = [
        /\b([A-Z][A-Z,.\s]*(?:university|college|institute|school|academy|uit|eth|punjab|jnv|sheohar)[A-Z,.\s]*)\b/i
      ];

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.length < 5) continue;

        const hasDegree = degreePatterns.some(pattern => pattern.test(trimmedLine));
        const hasInstitution = institutionPatterns.some(pattern => pattern.test(trimmedLine));
        const yearMatch = trimmedLine.match(/\b(19|20)\d{2}\b/);
        const gradeMatch = trimmedLine.match(/(\d+\.?\d*)%|gpa:?\s*(\d+\.?\d*)|cgpa:?\s*(\d+\.?\d*)/i);

        if (hasDegree || hasInstitution || (yearMatch && gradeMatch)) {
          education.push({
            institution: hasInstitution ? trimmedLine : '',
            degree: hasDegree ? trimmedLine : '',
            year: yearMatch ? yearMatch[0] : '',
            grade: gradeMatch ? (gradeMatch[1] || gradeMatch[2] || gradeMatch[3]) : '',
            rawText: trimmedLine
          });
        }
      }
    }
    return education.slice(0, 5);
  }

  private extractExperience(sections: Record<string, { start: number; end: number }>, lines: string[]): any[] {
    const experience: any[] = [];

    if (sections.experience.start !== -1) {
      const experienceLines = lines.slice(sections.experience.start + 1, sections.experience.end + 1);
      let collectedLines: string[] = [];
      
      for (let i = 0; i < experienceLines.length; i++) {
        const line = experienceLines[i].trim();
        if (!line || line.length < 2) continue;
        
        collectedLines.push(line);
        
        const jobTitleMatch = line.match(/\b(software\s+engineer|web\s+developer|full\s+stack|frontend|backend|developer|engineer|analyst|manager|consultant|designer|architect|lead|senior|junior|intern|trainee)\b/i);
        const companyMatch = line.match(/\b([A-Z][A-Za-z\s&.,-]*(?:inc|ltd|llc|corp|corporation|company|technologies|tech|solutions|systems|services|pvt|private|limited))\b/i);
        const dateRangeMatch = line.match(/\b(19|20)\d{2}\s*[-–—]\s*(?:(19|20)\d{2}|present|current)|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(19|20)\d{2}/i);
        
        const isExperienceBoundary = jobTitleMatch || companyMatch || dateRangeMatch || (i === experienceLines.length - 1);
        
        if (isExperienceBoundary || i === experienceLines.length - 1) {
          if (collectedLines.length > 0) {
            const combinedText = collectedLines.join(' ');
            const entryJobTitleMatch = combinedText.match(/\b(software\s+engineer|web\s+developer|full\s+stack|frontend|backend|developer|engineer|analyst|manager|consultant|designer|architect|lead|senior|junior|intern|trainee)\b/i);
            const entryCompanyMatch = combinedText.match(/\b([A-Z][A-Za-z\s&.,-]*(?:inc|ltd|llc|corp|corporation|company|technologies|tech|solutions|systems|services|pvt|private|limited))\b/i);
            const entryDateRangeMatch = combinedText.match(/\b(19|20)\d{2}\s*[-–—]\s*(?:(19|20)\d{2}|present|current)|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(19|20)\d{2}/i);
            const entryYearMatches = combinedText.match(/\b(19|20)\d{2}\b/g);
            const locationMatch = combinedText.match(/\b([A-Z][a-z]+,\s*[A-Z][a-z]+|\w+,\s*\w+)\b/);
            
            const entry: any = {
              title: entryJobTitleMatch ? entryJobTitleMatch[0].trim() : '',
              company: entryCompanyMatch ? entryCompanyMatch[0].trim() : '',
              duration: entryDateRangeMatch ? entryDateRangeMatch[0].trim() : '',
              location: locationMatch ? locationMatch[0].trim() : '',
              startYear: '',
              endYear: '',
              description: combinedText.trim(),
              rawText: combinedText.trim()
            };
            
            if (entryYearMatches && entryYearMatches.length > 0) {
              if (entryYearMatches.length === 1) {
                entry.startYear = entryYearMatches[0];
                entry.endYear = entryYearMatches[0];
              } else if (entryYearMatches.length >= 2) {
                entry.startYear = entryYearMatches[0];
                entry.endYear = entryYearMatches[entryYearMatches.length - 1];
              }
            }
            
            if (entry.title || entry.company || entry.duration) {
              experience.push(entry);
            }
            
            if (i < experienceLines.length - 1 && (jobTitleMatch || companyMatch)) {
              collectedLines = [line];
            } else {
              collectedLines = [];
            }
          }
        }
      }
    }

    if (experience.length === 0) {
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.length < 10) continue;

        const jobTitleMatch = trimmedLine.match(/\b(software\s+engineer|web\s+developer|developer|engineer|analyst|manager|consultant)\b/i);
        const companyMatch = trimmedLine.match(/\b([A-Z][A-Za-z\s&.,-]*(?:inc|ltd|llc|corp|corporation|company|technologies|tech|solutions|systems|services))\b/i);
        const dateMatch = trimmedLine.match(/\b(19|20)\d{2}\s*[-–—]\s*(?:(19|20)\d{2}|present)/i);

        if ((jobTitleMatch && dateMatch) || (companyMatch && dateMatch)) {
          experience.push({
            title: jobTitleMatch ? jobTitleMatch[0] : '',
            company: companyMatch ? companyMatch[0] : '',
            duration: dateMatch ? dateMatch[0] : '',
            description: trimmedLine,
            rawText: trimmedLine
          });
        }
      }
    }
    return experience.slice(0, 5);
  }

  private extractSkills(sections: Record<string, { start: number; end: number }>, lines: string[], fullText: string): string[] {
    const skills = new Set<string>();

    if (sections.skills.start !== -1) {
      const skillsLines = lines.slice(sections.skills.start + 1, sections.skills.end + 1);
      for (const line of skillsLines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        const skillItems = trimmedLine.split(/[,;|•\-\*\n\t]/);
        for (const skill of skillItems) {
          const cleanSkill = skill.trim().replace(/[^\w\s\.\+\#\-]/g, '');
          if (cleanSkill.length > 1 && cleanSkill.length < 30) {
            skills.add(cleanSkill);
          }
        }
      }
    }

    // Comprehensive technical database match
    const technicalSkills = [
      'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust',
      'swift', 'kotlin', 'scala', 'r', 'matlab', 'perl', 'shell', 'bash', 'powershell',
      'html', 'css', 'sass', 'scss', 'less', 'bootstrap', 'tailwind', 'material-ui', 'bulma',
      'react', 'angular', 'vue', 'svelte', 'ember', 'backbone', 'jquery', 'alpine.js',
      'next.js', 'nuxt.js', 'gatsby', 'astro', 'webpack', 'vite', 'parcel', 'rollup',
      'node.js', 'express', 'nestjs', 'fastify', 'koa', 'django', 'flask', 'fastapi',
      'spring', 'hibernate', 'struts', 'laravel', 'symfony', 'codeigniter', 'rails',
      'asp.net', '.net', 'entity framework',
      'mysql', 'postgresql', 'sqlite', 'oracle', 'sql server', 'mongodb', 'cassandra',
      'redis', 'elasticsearch', 'neo4j', 'firebase', 'supabase', 'dynamodb', 'couchdb',
      'aws', 'azure', 'gcp', 'heroku', 'vercel', 'netlify', 'cloudflare',
      'docker', 'kubernetes', 'jenkins', 'gitlab ci', 'github actions', 'circleci',
      'terraform', 'ansible', 'chef', 'puppet', 'vagrant',
      'git', 'github', 'gitlab', 'bitbucket', 'svn', 'mercurial',
      'jira', 'confluence', 'trello', 'asana', 'notion', 'slack', 'teams',
      'jest', 'cypress', 'selenium', 'mocha', 'chai', 'jasmine', 'karma', 'pytest',
      'junit', 'testng', 'mockito', 'postman', 'insomnia',
      'react native', 'flutter', 'ionic', 'xamarin', 'cordova', 'phonegap',
      'android', 'ios', 'xcode', 'android studio',
      'pandas', 'numpy', 'scipy', 'scikit-learn', 'tensorflow', 'keras', 'pytorch',
      'jupyter', 'anaconda', 'tableau', 'power bi', 'qlik', 'd3.js', 'plotly',
      'linux', 'ubuntu', 'centos', 'windows', 'macos', 'unix',
      'vim', 'emacs', 'vscode', 'intellij', 'eclipse', 'sublime', 'atom',
      'rest api', 'graphql', 'soap', 'microservices', 'serverless', 'websockets',
      'oauth', 'jwt', 'ssl', 'https', 'tcp/ip', 'http', 'dns', 'cdn',
      'agile', 'scrum', 'kanban', 'waterfall', 'devops', 'ci/cd', 'tdd', 'bdd'
    ];

    const lowerText = fullText.toLowerCase();
    for (const skill of technicalSkills) {
      const skillRegex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (skillRegex.test(lowerText)) {
        skills.add(skill);
      }
    }

    const skillPatterns = [
      /\b[\w\.\+\#\-]+\s*(programming|development|framework|library|tool|technology|language|database|platform)\b/i,
      /\b(proficient|experienced|expert|skilled|familiar)\s+(?:in|with)\s+([\w\s,]+)/i
    ];

    for (const line of lines) {
      for (const pattern of skillPatterns) {
        const match = line.match(pattern);
        if (match) {
          const extractedSkills = match[0].split(/[,\s]+/).filter(s => s.length > 2 && s.length < 20);
          extractedSkills.forEach(skill => skills.add(skill.trim()));
        }
      }
    }

    return Array.from(skills).slice(0, 50);
  }

  private extractProjects(sections: Record<string, { start: number; end: number }>, lines: string[]): any[] {
    const projects: any[] = [];

    if (sections.projects.start !== -1) {
      const projectLines = lines.slice(sections.projects.start + 1, sections.projects.end + 1);
      let currentProject: any = {};
      let descriptionLines: string[] = [];

      for (const line of projectLines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        const isProjectTitle = (
          trimmedLine.match(/^[•◦\-\*]\s*[A-Z][a-zA-Z\s\-()]+:?/) ||
          trimmedLine.match(/^[A-Z][a-zA-Z\s\-()]+\s*:/) ||
          (trimmedLine.match(/^[A-Z][a-zA-Z\s\-()]+$/) && trimmedLine.length < 80 && !trimmedLine.includes('http'))
        );

        if (isProjectTitle) {
          if (Object.keys(currentProject).length > 0) {
            currentProject.description = descriptionLines.join(' ');
            projects.push(currentProject);
            descriptionLines = [];
          }
          let title = trimmedLine
            .replace(/^[•◦\-\*]\s*/, '')
            .replace(/\s*:$/, '')
            .trim();
            
          currentProject = { title };
          continue;
        }

        if (trimmedLine.includes('http') || trimmedLine.includes('github') || trimmedLine.includes('demo')) {
          if (currentProject.title) {
            currentProject.link = trimmedLine;
          }
          continue;
        }

        if (trimmedLine.toLowerCase().includes('tools:') || 
            trimmedLine.toLowerCase().includes('technologies:') ||
            trimmedLine.toLowerCase().includes('tech stack:')) {
          if (currentProject.title) {
            currentProject.technologies = trimmedLine;
          }
          continue;
        }

        if (currentProject.title) {
          descriptionLines.push(trimmedLine);
        }
      }

      if (Object.keys(currentProject).length > 0) {
        currentProject.description = descriptionLines.join(' ');
        projects.push(currentProject);
      }
    }

    if (projects.length === 0) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.toLowerCase().includes('project') && (line.includes(':') || line.includes('app') || line.includes('system'))) {
          const project: any = {
            title: line,
            description: '',
            technologies: '',
            link: ''
          };
          
          for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
            const nextLine = lines[j].trim();
            if (nextLine.length > 10 && !nextLine.toLowerCase().includes('project')) {
              project.description = nextLine;
              break;
            }
          }
          projects.push(project);
        }
      }
    }
    return projects.slice(0, 10);
  }

  private calculateYearsOfExperience(experience: any[]): number {
    let totalMonths = 0;
    const currentYear = new Date().getFullYear();

    for (const exp of experience) {
      if (exp.duration) {
        const yearMatches = exp.duration.match(/\b(19|20)\d{2}\b/g);
        if (yearMatches && yearMatches.length >= 2) {
          const startYear = parseInt(yearMatches[0]);
          const endYear = parseInt(yearMatches[1]);
          totalMonths += (endYear - startYear) * 12;
        } else if (yearMatches && yearMatches.length === 1 && exp.duration.toLowerCase().includes('present')) {
          const startYear = parseInt(yearMatches[0]);
          totalMonths += (currentYear - startYear) * 12;
        }
      }
    }
    return Math.round(totalMonths / 12 * 10) / 10;
  }

  private getSectionText(section: { start: number; end: number }, lines: string[]): string {
    if (section.start === -1) return '';
    const sectionLines = lines.slice(section.start + 1, section.end + 1);
    return sectionLines.join('\n').trim();
  }
}

export const resumeParserService = new ResumeParserService();
export default resumeParserService;
