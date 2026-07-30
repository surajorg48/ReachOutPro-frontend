export interface ResumeInfo {
  name?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  summary?: string;
  skills: string[];
  experience: string[];
  education: string[];
  projects: string[];
  suggestedBullets?: string[];
}

export interface ResumeParseResult {
  markdown: string;
  info: ResumeInfo;
  emailTemplate: string;
}
