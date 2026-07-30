export interface EmailLog {
  id: number;
  campaign_id: number;
  contact_id: number;
  company_id: number;
  recipient_email: string;
  recipient_name?: string;
  company_name?: string;
  subject?: string;
  status: string;
  sent_at?: string;
  error_msg?: string;
  gmail_message_id?: string;
}

export interface EmailLogStats {
  sent: number;
  failed: number;
  pending: number;
  today: number;
}

export interface EmailLogsResponse {
  logs: EmailLog[];
  total: number;
}
