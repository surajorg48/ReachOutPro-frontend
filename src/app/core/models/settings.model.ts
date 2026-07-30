export interface AppSettings {
  sender_email: string;
  test_email: string;
  send_delay_ms: string;
  resume_path: string;
  applicant_name: string;
  applicant_phone: string;
  applicant_linkedin: string;
  applicant_github: string;
  gmailConnected: boolean;
  credentialsUploaded: boolean;
  gmail_accounts?: GmailAccount[];
  active_account?: { id: number };
}

export interface GmailAccount {
  id: number;
  email: string;
  label?: string;
  is_active: boolean;
  isConnected: boolean;
  connected_at?: string;
}
