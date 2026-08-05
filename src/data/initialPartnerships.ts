import { Partnership } from '../types/partnership';

export const INITIAL_PARTNERSHIPS: Partnership[] = [
  {
    id: 'BMV-P01',
    partnerName: 'SC Ventures',
    category: 'Corporate Venture / Innovation',
    entity: 'Banque Misr',
    owner: 'ISV',
    scope: [
      'Venture-building methodology',
      'Venture sourcing and validation',
      'Access to selected SCV’s portfolio companies',
      'Product and technology expertise',
      'Commercialization support',
      'Access to SCV’s global venture ecosystem'
    ],
    documentType: 'MoU',
    documentStatus: 'Under Internal Review',
    stage: '2. Negotiation',
    priority: 'High',
    valueDrivers: {
      growthEngine: true,
      ventureClienting: true,
      startupFriendlyBank: true,
      ecosystemEngagement: true,
      investment: true
    },
    targetSignatureDate: '2026-10-30',
    expiryDate: '2027-10-30',
    renewalNoticeDays: 90,
    internalSPOC: 'Mina Armanious',
    partnerSPOC: 'Alex Tan (SCV Global Lead)',
    healthStatus: 'Green',
    notes: 'Priority relationship with SC Ventures global team. Joint venture builder framework under review.',
    isUserFilled: true
  },
  {
    id: 'BMV-P02',
    partnerName: 'Microsoft',
    category: 'Cloud / Technology',
    entity: 'Banque Misr',
    owner: 'ISV',
    scope: ['Ecosystem Engagement + AI launchpad'],
    documentType: 'MoU',
    documentStatus: 'Under Internal Review',
    stage: '2. Negotiation',
    priority: 'High',
    valueDrivers: {
      growthEngine: true,
      ventureClienting: false,
      startupFriendlyBank: false,
      ecosystemEngagement: true,
      investment: false
    },
    targetSignatureDate: '2026-11-15',
    expiryDate: '2027-11-15',
    renewalNoticeDays: 90,
    internalSPOC: 'Sherif Ahmed',
    partnerSPOC: 'Karem El-Din (Microsoft MEA)',
    healthStatus: 'Green',
    notes: 'Focus on enterprise AI launchpad for fintech accelerators.',
    isUserFilled: true
  },
  {
    id: 'BMV-P03',
    partnerName: 'Amazon Web Services (AWS)',
    category: 'Cloud / Technology',
    entity: 'Banque Misr',
    owner: 'ISV',
    scope: ['Ecosystem Engagement + AI launchpad'],
    documentType: 'MoU',
    documentStatus: 'Under Internal Review',
    stage: '2. Negotiation',
    priority: 'High',
    valueDrivers: {
      growthEngine: true,
      ventureClienting: true,
      startupFriendlyBank: false,
      ecosystemEngagement: true,
      investment: false
    },
    targetSignatureDate: '2026-11-30',
    expiryDate: '2027-11-30',
    renewalNoticeDays: 90,
    internalSPOC: 'Sherif Ahmed',
    partnerSPOC: 'Omar Mansour (AWS Startups)',
    healthStatus: 'Green',
    notes: 'Cloud credits & accelerator credits for portfolio startups.',
    isUserFilled: true
  },
  {
    id: 'BMV-P04',
    partnerName: 'Allianz — Bancassurance Contract',
    category: 'Insurance / Bancassurance',
    entity: 'Banque Misr',
    owner: 'ISV',
    scope: ['Bancassurance Agreement'],
    documentType: 'Bancassurance Agreement',
    documentStatus: 'Under Internal Review',
    stage: '3. Internal Approvals',
    priority: 'High',
    valueDrivers: {
      growthEngine: true,
      ventureClienting: false,
      startupFriendlyBank: false,
      ecosystemEngagement: false,
      investment: true
    },
    targetSignatureDate: '2026-09-30',
    expiryDate: '2029-09-30',
    renewalNoticeDays: 90,
    internalSPOC: 'Hassan Mahmoud',
    partnerSPOC: 'Julia Meyer (Allianz Egypt)',
    healthStatus: 'Amber',
    notes: 'Exclusive distribution terms currently undergoing legal validation.',
    isUserFilled: true
  },
  {
    id: 'BMV-P05',
    partnerName: 'Allianz X — MoU',
    category: 'Insurance / Bancassurance',
    entity: 'Banque Misr',
    owner: 'ISV',
    scope: ['SMEs, Agri, Trade & Supply Chain, Cyber security products exploration'],
    documentType: 'MoU',
    documentStatus: 'Internal Draft',
    stage: '1. Exploration',
    priority: 'High',
    valueDrivers: {
      growthEngine: true,
      ventureClienting: false,
      startupFriendlyBank: false,
      ecosystemEngagement: false,
      investment: true
    },
    targetSignatureDate: '2026-12-15',
    expiryDate: '2027-12-15',
    renewalNoticeDays: 90,
    internalSPOC: 'Hassan Mahmoud',
    partnerSPOC: 'Marcus Vance (Allianz X Munich)',
    healthStatus: 'Green',
    notes: 'Strategic investment side-letter and co-innovation in insurtech.',
    isUserFilled: true
  },
  {
    id: 'BMV-P06',
    partnerName: 'Antler — LP / Fund Investment',
    category: 'Venture Capital / Fund',
    entity: 'MFI',
    owner: 'ISV',
    scope: ['Foundry program'],
    documentType: 'Limited Partnership Agreement',
    documentStatus: 'Under Internal Review',
    stage: '3. Internal Approvals',
    priority: 'High',
    valueDrivers: {
      growthEngine: true,
      ventureClienting: false,
      startupFriendlyBank: true,
      ecosystemEngagement: true,
      investment: true
    },
    targetSignatureDate: '2026-10-15',
    expiryDate: '2031-10-15',
    renewalNoticeDays: 120,
    internalSPOC: 'Mina Armanious',
    partnerSPOC: 'Jonathan Bell (Antler MENA)',
    healthStatus: 'Green',
    notes: 'LP commitment to Antler East Africa & Egypt early stage fund.',
    isUserFilled: true
  },
  {
    id: 'BMV-P08',
    partnerName: 'Endeavor',
    category: 'Startup Ecosystem',
    entity: 'Banque Misr',
    owner: 'ISV',
    scope: ['Co-Funding + Ecosystem Engagement'],
    documentType: 'None (Exploration)',
    documentStatus: 'Internal Draft',
    stage: '1. Exploration',
    priority: 'High',
    valueDrivers: {
      growthEngine: true,
      ventureClienting: false,
      startupFriendlyBank: false,
      ecosystemEngagement: true,
      investment: true
    },
    targetSignatureDate: '2027-01-30',
    expiryDate: '2028-01-30',
    renewalNoticeDays: 90,
    internalSPOC: 'Tarek Zaki',
    partnerSPOC: 'Noha El-Sherbiny (Endeavor Egypt)',
    healthStatus: 'Green',
    notes: 'High-impact scaleup support and deal referral pipeline.',
    isUserFilled: true
  },
  {
    id: 'BMV-P09',
    partnerName: 'Entlaq',
    category: 'Startup Ecosystem',
    entity: 'Banque Misr',
    owner: 'ISV',
    scope: ['Ecosystem Engagement , round tables'],
    documentType: 'MoU',
    documentStatus: 'Under Internal Review',
    stage: '1. Exploration',
    priority: 'High',
    valueDrivers: {
      growthEngine: true,
      ventureClienting: false,
      startupFriendlyBank: false,
      ecosystemEngagement: true,
      investment: false
    },
    targetSignatureDate: '2026-11-30',
    expiryDate: '2027-11-30',
    renewalNoticeDays: 90,
    internalSPOC: 'Tarek Zaki',
    partnerSPOC: 'Mohamed Ezzat (Entlaq)',
    healthStatus: 'Green',
    notes: 'Egyptian tech ecosystem roundtables and report co-publishing.',
    isUserFilled: true
  },
  {
    id: 'BMV-P10',
    partnerName: 'Afreximbank',
    category: 'DFI / Multilateral',
    entity: 'Banque Misr',
    owner: 'ISV',
    scope: ['Use Case Development + Trade'],
    documentType: 'None (Exploration)',
    documentStatus: 'Not Drafted',
    stage: '1. Exploration',
    priority: 'High',
    valueDrivers: {
      growthEngine: false,
      ventureClienting: false,
      startupFriendlyBank: false,
      ecosystemEngagement: false,
      investment: false
    },
    targetSignatureDate: '2027-03-31',
    expiryDate: '2028-03-31',
    renewalNoticeDays: 90,
    internalSPOC: 'Amr Fouad',
    partnerSPOC: 'Kofi Mensah (Afreximbank)',
    healthStatus: 'Amber',
    notes: 'Cross-border trade finance digitisation exploring joint sandbox.',
    isUserFilled: true
  },
  {
    id: 'BMV-P11',
    partnerName: 'American University in Cairo (AUC)',
    category: 'Academic / Research',
    entity: 'Banque Misr',
    owner: 'ISV',
    scope: ['AUC Venture Lab (TBD)'],
    documentType: 'None (Exploration)',
    documentStatus: 'Not Drafted',
    stage: '1. Exploration',
    priority: 'High',
    valueDrivers: {
      growthEngine: true,
      ventureClienting: false,
      startupFriendlyBank: false,
      ecosystemEngagement: true,
      investment: false
    },
    targetSignatureDate: '2026-12-31',
    expiryDate: '2027-12-31',
    renewalNoticeDays: 90,
    internalSPOC: 'Dalia Kamel',
    partnerSPOC: 'Dr. Ayman Ismail (AUC V-Lab)',
    healthStatus: 'Green',
    notes: 'Sponsorship and mentorship in fintech acceleration cycles.',
    isUserFilled: true
  },
  {
    id: 'BMV-P12',
    partnerName: 'Baker McKenzie',
    category: 'Legal Advisory',
    entity: 'MFI',
    owner: 'ISV',
    scope: ['Legal Due Diligence of Antler Fund'],
    documentType: 'Engagement Letter',
    documentStatus: 'Under Internal Review',
    stage: '2. Negotiation',
    priority: 'High',
    valueDrivers: {
      growthEngine: true,
      ventureClienting: false,
      startupFriendlyBank: false,
      ecosystemEngagement: false,
      investment: false
    },
    targetSignatureDate: '2026-08-31',
    expiryDate: '2026-12-31',
    renewalNoticeDays: 30,
    internalSPOC: 'Mina Armanious',
    partnerSPOC: 'Ghada El-Sayed (Baker McKenzie)',
    healthStatus: 'Green',
    notes: 'Legal representation for fund subscription and LP review.',
    isUserFilled: true
  },
  {
    id: 'BMV-P13',
    partnerName: 'McKinsey & Company',
    category: 'Consulting / Advisory',
    entity: 'Banque Misr',
    owner: 'ISV',
    scope: ['Strategic Innovation Roadmap & Venture Architecture'],
    documentType: 'None (Exploration)',
    documentStatus: 'Not Drafted',
    stage: '1. Exploration',
    priority: 'Medium',
    valueDrivers: {
      growthEngine: false,
      ventureClienting: false,
      startupFriendlyBank: false,
      ecosystemEngagement: false,
      investment: false
    },
    targetSignatureDate: '2027-02-15',
    expiryDate: '2027-08-15',
    renewalNoticeDays: 60,
    internalSPOC: 'Amr Fouad',
    partnerSPOC: 'Tariq Hassan (McKinsey Cairo)',
    healthStatus: 'Green',
    notes: 'Initial scoping session for corporate venture studio evaluation.',
    isUserFilled: true
  },
  {
    id: 'PND-0014',
    partnerName: 'Startups Without Borders',
    category: 'Startup Ecosystem',
    entity: 'Banque Misr',
    owner: 'ISV',
    scope: ['Ecosystem Engagement'],
    documentType: 'None (Exploration)',
    documentStatus: 'Not Drafted',
    stage: '1. Exploration',
    priority: 'High',
    valueDrivers: {
      growthEngine: false,
      ventureClienting: false,
      startupFriendlyBank: false,
      ecosystemEngagement: true,
      investment: false
    },
    targetSignatureDate: '2026-11-10',
    expiryDate: '2027-11-10',
    renewalNoticeDays: 90,
    internalSPOC: 'Tarek Zaki',
    partnerSPOC: 'Valentina Primo (SWB)',
    healthStatus: 'Green',
    notes: 'Diaspora entrepreneurship hackathons & matchmaking events.',
    isUserFilled: true
  },
  {
    id: 'BMV-P18',
    partnerName: 'Thought Machine',
    category: 'Cloud / Technology',
    entity: 'Banque Misr',
    owner: 'ISV',
    scope: ['Technology Partner for BM (Financial infrastructure platform)'],
    documentType: 'None (Exploration)',
    documentStatus: 'Not Drafted',
    stage: '1. Exploration',
    priority: 'High',
    valueDrivers: {
      growthEngine: true,
      ventureClienting: false,
      startupFriendlyBank: false,
      ecosystemEngagement: false,
      investment: false
    },
    targetSignatureDate: '2027-01-15',
    expiryDate: '2028-01-15',
    renewalNoticeDays: 90,
    internalSPOC: 'Sherif Ahmed',
    partnerSPOC: 'Paul Higgins (Thought Machine UK)',
    healthStatus: 'Amber',
    notes: 'Next-Gen core banking engine technology trial.',
    isUserFilled: true
  },
  {
    id: 'BMV-P14',
    partnerName: 'BCGX',
    category: 'Consulting / Advisory',
    entity: 'Banque Misr',
    owner: 'ISV',
    scope: ['Venture Building Advisory & Market Scoping'],
    documentType: 'None (Exploration)',
    documentStatus: 'Not Drafted',
    stage: '1. Exploration',
    priority: 'Low',
    valueDrivers: {
      growthEngine: false,
      ventureClienting: false,
      startupFriendlyBank: false,
      ecosystemEngagement: false,
      investment: false
    },
    targetSignatureDate: '2027-04-01',
    expiryDate: '2027-10-01',
    renewalNoticeDays: 60,
    internalSPOC: 'Amr Fouad',
    partnerSPOC: 'Karim Helal (BCG Cairo)',
    healthStatus: 'Green',
    notes: 'Advisory engagement scoping phase.',
    isUserFilled: true
  },
  {
    id: 'PND-0001',
    partnerName: 'VMS',
    category: 'Startup Ecosystem',
    entity: 'MFI',
    owner: 'ISV',
    scope: ['International Expansion Programme + Ecosystem Engagement'],
    documentType: 'MoU',
    documentStatus: 'Cleared for Signature',
    stage: '4. Signature',
    priority: 'Low',
    valueDrivers: {
      growthEngine: false,
      ventureClienting: false,
      startupFriendlyBank: true,
      ecosystemEngagement: true,
      investment: false
    },
    targetSignatureDate: '2026-08-20',
    expiryDate: '2027-08-20',
    renewalNoticeDays: 90,
    internalSPOC: 'Tarek Zaki',
    partnerSPOC: 'Rami Al-Ghamdi (VMS Saudi)',
    healthStatus: 'Green',
    notes: 'Saudi-Egypt corridor startup bridge program.',
    isUserFilled: true
  },
  {
    id: 'PND-0002',
    partnerName: 'TKH',
    category: 'Startup Ecosystem',
    entity: 'Banque Misr',
    owner: 'ISV',
    scope: ['Innovation Hub · business cases'],
    documentType: 'MoU',
    documentStatus: 'Cleared for Signature',
    stage: '0. On Hold',
    priority: 'Medium',
    valueDrivers: {
      growthEngine: true,
      ventureClienting: false,
      startupFriendlyBank: false,
      ecosystemEngagement: true,
      investment: false
    },
    targetSignatureDate: '2026-12-31',
    expiryDate: '2027-12-31',
    renewalNoticeDays: 90,
    internalSPOC: 'Dalia Kamel',
    partnerSPOC: 'Khaled Osman (TKH Knowledge Hub)',
    healthStatus: 'Red',
    notes: 'On hold pending university governance approval.',
    isUserFilled: true
  },
  {
    id: 'PND-0004',
    partnerName: 'MSMEDA',
    category: 'Startup Ecosystem',
    entity: 'Banque Misr',
    owner: 'ISV',
    scope: ['Co-investment · Startup friendly bank · startup label'],
    documentType: 'MoU',
    documentStatus: 'Under Internal Review',
    stage: '3. Internal Approvals',
    priority: 'High',
    valueDrivers: {
      growthEngine: true,
      ventureClienting: false,
      startupFriendlyBank: true,
      ecosystemEngagement: true,
      investment: false
    },
    targetSignatureDate: '2026-09-15',
    expiryDate: '2028-09-15',
    renewalNoticeDays: 90,
    internalSPOC: 'Hassan Mahmoud',
    partnerSPOC: 'Nevine Gamea (MSMEDA Lead)',
    healthStatus: 'Green',
    notes: 'SME Micro-finance facility and national startup registration label integration.',
    isUserFilled: true
  },
  {
    id: 'PND-0005',
    partnerName: 'Global 500',
    category: 'Startup Ecosystem',
    entity: 'Banque Misr',
    owner: 'ISV',
    scope: ['Ecosystem Engagement'],
    documentType: 'MoU',
    documentStatus: 'Cleared for Signature',
    stage: '4. Signature',
    priority: 'Medium',
    valueDrivers: {
      growthEngine: true,
      ventureClienting: false,
      startupFriendlyBank: true,
      ecosystemEngagement: true,
      investment: false
    },
    targetSignatureDate: '2026-08-30',
    expiryDate: '2027-08-30',
    renewalNoticeDays: 90,
    internalSPOC: 'Mina Armanious',
    partnerSPOC: 'Amal Dokhan (500 Global MENA)',
    healthStatus: 'Green',
    notes: 'Cleared for executive signature next week.',
    isUserFilled: true
  },
  {
    id: 'PND-0008',
    partnerName: 'Keheilan',
    category: 'Venture Capital / Fund',
    entity: 'MFI',
    owner: 'ISV',
    scope: ['Co-investment · venture clienting · innovation'],
    documentType: 'MoU',
    documentStatus: 'Under Internal Review',
    stage: '3. Internal Approvals',
    priority: 'Low',
    valueDrivers: {
      growthEngine: false,
      ventureClienting: false,
      startupFriendlyBank: false,
      ecosystemEngagement: false,
      investment: false
    },
    targetSignatureDate: '2026-10-31',
    expiryDate: '2027-10-31',
    renewalNoticeDays: 90,
    internalSPOC: 'Mina Armanious',
    partnerSPOC: 'Faisal Keheilan (Keheilan VC)',
    healthStatus: 'Amber',
    notes: 'Under review by risk committee.',
    isUserFilled: true
  }
];

// Helper calculations corresponding to PDF formulas:
export function calculateClearancePercentage(partnership: Partnership): number {
  const drivers = partnership.valueDrivers;
  const count = Object.values(drivers).filter(Boolean).length;
  // Each active driver out of 5 gives 20% clearance weight
  return (count / 5) * 100;
}

export function calculateDaysToExpiry(expiryDateStr?: string): number | null {
  if (!expiryDateStr) return null;
  const expiry = new Date(expiryDateStr);
  const today = new Date('2026-08-05'); // Baseline date from PDF header (05 Aug 2026)
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getRenewalAlert(daysToExpiry: number | null, noticeDays: number = 90): {
  alert: boolean;
  statusText: string;
  badgeColor: string;
} {
  if (daysToExpiry === null) {
    return { alert: false, statusText: 'No Date Set', badgeColor: 'bg-slate-100 text-slate-600' };
  }
  if (daysToExpiry <= 0) {
    return { alert: true, statusText: 'Expired', badgeColor: 'bg-red-100 text-red-800 border-red-200' };
  }
  if (daysToExpiry <= noticeDays) {
    return { alert: true, statusText: `Alert (${daysToExpiry}d left)`, badgeColor: 'bg-amber-100 text-amber-800 border-amber-200' };
  }
  return { alert: false, statusText: `Active (${daysToExpiry}d)`, badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
}
