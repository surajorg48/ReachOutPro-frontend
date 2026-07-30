export interface ScraperSession {
  sessionId: string;
  status: string;
  total: number;
  done: number;
  results: ScraperResult[];
  startTime?: number;
}

export interface ScraperResult {
  url: string;
  companyName?: string;
  emails: EmailScore[];
  phones: string[];
  status: string;
  error?: string;
  selectedBestEmail?: string;
}

export interface EmailScore {
  email: string;
  score: number;
  source_url?: string;
}

export interface DiscoverResult {
  name: string;
  website?: string;
  domain?: string;
  category?: string;
  phone?: string;
  address?: string;
  rating?: number;
  source?: string;
}

export interface DiscoverHistory {
  id: number;
  query: string;
  result_count: number;
  results: DiscoverResult[];
  created_at: string;
}
