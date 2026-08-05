export type PartnershipStage =
  | '0. On Hold'
  | '1. Exploration'
  | '2. Negotiation'
  | '3. Internal Approvals'
  | '4. Signature';

export type PriorityLevel = 'High' | 'Medium' | 'Low';

export type DocumentType =
  | 'MoU'
  | 'Bancassurance Agreement'
  | 'Limited Partnership Agreement'
  | 'Engagement Letter'
  | 'None (Exploration)'
  | 'Contract';

export type DocumentStatus =
  | 'Under Internal Review'
  | 'Internal Draft'
  | 'Cleared for Signature'
  | 'Not Drafted'
  | 'Signed & Active';

export type EntityType = 'Banque Misr' | 'MFI';

export type PartnerCategory =
  | 'Corporate Venture / Innovation'
  | 'Cloud / Technology'
  | 'Insurance / Bancassurance'
  | 'Venture Capital / Fund'
  | 'Startup Ecosystem'
  | 'DFI / Multilateral'
  | 'Academic / Research'
  | 'Legal Advisory'
  | 'Consulting / Advisory';

export type HealthStatus = 'Green' | 'Amber' | 'Red' | 'Completed';

export interface StrategicValueDrivers {
  growthEngine: boolean; // Growth & Value Creation Engine
  ventureClienting: boolean; // Next Growth Horizon - Venture Clienting
  startupFriendlyBank: boolean; // Next Growth Horizon - Start Up friendly Bank
  ecosystemEngagement: boolean; // Ecosystem Engagement
  investment: boolean; // Investment
}

export interface Partnership {
  id: string; // Unique ID (e.g., BMV-P01, PND-0001)
  partnerName: string; // Partner / Organization
  category: PartnerCategory;
  entity: EntityType;
  owner: string; // Owner / Responsible (e.g. ISV)
  scope: string[]; // Scope / Purpose points
  documentType: DocumentType;
  documentStatus: DocumentStatus;
  stage: PartnershipStage;
  priority: PriorityLevel;
  valueDrivers: StrategicValueDrivers;
  targetSignatureDate?: string; // YYYY-MM-DD
  expiryDate?: string; // YYYY-MM-DD
  renewalNoticeDays?: number; // Default 90
  internalSPOC?: string; // Internal Single Point of Contact
  partnerSPOC?: string; // Partner Single Point of Contact
  healthStatus?: HealthStatus;
  notes?: string;
  isUserFilled?: boolean; // For formula vs filled legend
}

export interface FilterState {
  search: string;
  category: string;
  entity: string;
  stage: string;
  documentStatus: string;
  priority: string;
  healthStatus: string;
  valueDriver: string;
}
