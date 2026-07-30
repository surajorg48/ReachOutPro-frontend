export interface Company {
  id: number;
  name: string;
  website?: string;
  industry?: string;
  city?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  best_email?: string;
  hr_name?: string;
  hr_phone?: string;
  email_score?: number;
  contacts_json?: string;
  contacts?: Contact[];
}

export interface Contact {
  id: number;
  company_id: number;
  email: string;
  name?: string;
  role?: string;
  phone?: string;
  score: number;
  source_url?: string;
  created_at: string;
}

export interface CompaniesResponse {
  companies: Company[];
  total: number;
}

export interface CompanyStats {
  total: number;
  pending: number;
  contacted: number;
  sentToday: number;
  totalSent: number;
  totalFailed: number;
  totalEmails: number;
}
