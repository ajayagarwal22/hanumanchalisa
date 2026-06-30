export interface ContactLinks {
  linkedin: string | null;
  github: string | null;
  website: string | null;
}

export interface CandidateProfile {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  headline: string | null;
  summary: string | null;
  links: ContactLinks;
  skills: string[];
  titles: string[];
  years_experience: number | null;
  resume_filename: string | null;
  resume_text?: string | null;
  raw_resume_excerpt?: string | null;
  updated_at?: string;
}

export interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string | null;
  url: string;
  posted_at: string | null;
  description: string | null;
  source: string;
}

export interface ScoredJob {
  job: JobPosting;
  score: number;
  matched_skills: string[];
  missing_skills: string[];
  reasons: string[];
}

export interface FormField {
  name: string;
  label: string;
  type: string;
  value: unknown;
  options: string[];
  required: boolean;
  confidence: number;
  from_memory: boolean;
}

export interface AnswerRecord {
  key: string;
  question: string;
  type: string;
  options: string[];
  value: unknown;
  updated_at: string;
  uses: number;
}

export type ApplicationStatus =
  | "draft"
  | "awaiting_approval"
  | "approved"
  | "submitted"
  | "rejected"
  | "failed";

export interface Application {
  id: string;
  job: JobPosting;
  fields: FormField[];
  cover_letter: string | null;
  status: ApplicationStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  submission_log: string[];
}
