export interface Campaign {
  id: number;
  name: string;
  subject: string;
  template_content?: string;
  template_path?: string;
  resume_path?: string;
  position: string;
  status: string;
  created_at: string;
  updated_at: string;
  stats?: CampaignStats;
}

export interface CampaignStats {
  sent: number;
  pending: number;
  failed: number;
}
