/** Shared TypeScript types for Dhanveer Sales Intelligence OS */

export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "PROPOSAL_SENT"
  | "NEGOTIATION"
  | "WON"
  | "LOST";

export type LeadSource =
  | "GOOGLE_PLACES"
  | "WHATSAPP"
  | "MANUAL"
  | "REFERRAL"
  | "WEBSITE"
  | "OTHER";

export interface Lead {
  id: string;
  businessName: string;
  ownerName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  status: LeadStatus;
  source: LeadSource;
  notes?: string;
  assignedToId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  wonLeads: number;
  conversionRate: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
