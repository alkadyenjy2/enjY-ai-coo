import { Project } from '../types';

export interface CanonicalPortfolioProject extends Project {
  repositoryUrl?: string;
  sourceNotes?: string;
  blockers: string[];
  evidenceStatus: 'verified' | 'blocked' | 'not_checked';
  kpisVerified: false;
}

const inheritedCoreCapabilities = [
  'JARVIS Intent Policy Gate',
  'Human Approval + Duplicate Guard',
  'Evidence-first Verification',
  'Audit Trail + Recovery',
];

const commonRules = [
  'NO EVIDENCE = NO SUCCESS',
  'Prefer existing tools and free/local paths before new subscriptions',
  'Keep production writes behind authorization and verification gates',
];

/**
 * Canonical project inventory from docs/MASTER_PORTFOLIO_CONTEXT.md.
 * This is a source-backed portfolio register, not live runtime telemetry.
 * All KPI counts are intentionally marked unverified until read from each project's source of truth.
 */
export const canonicalPortfolioProjects: CanonicalPortfolioProject[] = [
  {
    id: 'portfolio-jarvis', name: 'JARVIS / ENJY AI COO',
    objective: 'Operate the portfolio end-to-end: inspect blockers, reuse tools/templates, execute authorized work, verify outcomes, recover failures, and report evidence.',
    targetUsers: 'Portfolio owner / operations lead', status: 'blocked',
    inheritedCoreCapabilities,
    projectWorkflows: ['approval-gated execution', 'health audit', 'evidence verification'],
    projectTools: ['GitHub', 'Supabase', 'Telegram', 'Gmail', 'Browser Use', 'model gateway'],
    projectRules: [...commonRules, 'No second orchestrator or backend replacement', 'Do not claim success from offline fallback'],
    createdAt: '2026-10-10T00:00:00.000Z', kpis: { tasksCompleted: 0, automationsActive: 0, lessonsRecorded: 0 }, kpisVerified: false,
    repositoryUrl: 'https://github.com/alkadyenjy2/enjY-ai-coo', evidenceStatus: 'not_checked',
    blockers: ['PR #43 is still draft; authenticated production E2E and verified free-first model routing remain unproven', 'Vercel is not the only allowed host; alternative deployment must be connected and health-checked'],
  },
  {
    id: 'portfolio-side-hustle', name: 'Side Hustle Hub / IdeaCollector',
    objective: 'Capture, organize, score, and retrieve real side-hustle ideas with durable personal persistence.',
    targetUsers: 'Portfolio owner', status: 'blocked', inheritedCoreCapabilities,
    projectWorkflows: ['idea capture', 'deduplication', 'retrieval'], projectTools: ['GitHub', 'Railway', 'Vercel'],
    projectRules: [...commonRules, 'Never fabricate idea records', 'Keep Side Hustle separate from JARVIS'],
    createdAt: '2026-10-10T00:00:00.000Z', kpis: { tasksCompleted: 0, automationsActive: 0, lessonsRecorded: 0 }, kpisVerified: false,
    repositoryUrl: 'https://github.com/alkadyenjy2/saved-ideas-dashboard', evidenceStatus: 'not_checked',
    blockers: ['Previous production URL was behind Vercel Deployment Protection; current public access and persistence need live verification'],
  },
  {
    id: 'portfolio-rizkaha', name: 'RIZKAHA / FLOURISH',
    objective: 'Career growth, CV support, and opportunity discovery for women, with secure user-specific persistence.',
    targetUsers: 'Women pursuing career growth', status: 'blocked', inheritedCoreCapabilities,
    projectWorkflows: ['profile', 'CV/career support', 'opportunity tracking'], projectTools: ['Firebase', 'Firestore'],
    projectRules: [...commonRules, 'Firebase/Firestore is canonical; do not migrate to Supabase'],
    createdAt: '2026-10-10T00:00:00.000Z', kpis: { tasksCompleted: 0, automationsActive: 0, lessonsRecorded: 0 }, kpisVerified: false,
    sourceNotes: 'Canonical repository URL is not confirmed in the current portfolio source.', evidenceStatus: 'not_checked',
    blockers: ['Authenticated user persistence has not been fully verified', 'Canonical repository mapping needs confirmation from existing source records'],
  },
  {
    id: 'portfolio-za-media', name: 'ZA Media AI Growth Engine',
    objective: 'Qualify real leads, assemble evidence packs, and support growth/revenue operations.',
    targetUsers: 'Media and growth operators', status: 'blocked', inheritedCoreCapabilities,
    projectWorkflows: ['lead intake', 'qualification', 'evidence pack', 'reply tracking'], projectTools: ['GitHub', 'Convex', 'Meta', 'Notion'],
    projectRules: [...commonRules, 'Convex ONLY for runtime data', 'PRODUCTION_OUTBOUND_FROZEN = true', 'No outbound until explicit authorization and evidence gates pass'],
    createdAt: '2026-10-10T00:00:00.000Z', kpis: { tasksCompleted: 0, automationsActive: 0, lessonsRecorded: 0 }, kpisVerified: false,
    repositoryUrl: 'https://github.com/alkadyenjy2/za-media-ai-growth-engine', evidenceStatus: 'not_checked',
    blockers: ['Meta app secret / verify token / page token remain sensitive integration dependencies', 'Canonical Convex health and webhook need fresh production verification'],
  },
  {
    id: 'portfolio-ze', name: 'ZE Outsource',
    objective: 'Managed outsourcing acquisition: discover, qualify, deduplicate, match, contact compliantly, track replies, and report.',
    targetUsers: 'US and Gulf-region outsourcing buyers', status: 'blocked', inheritedCoreCapabilities,
    projectWorkflows: ['lead discovery', 'qualification', 'email/DM outreach', 'dedup', 'matching', 'reply tracking'], projectTools: ['Supabase', 'Make', 'Apollo', 'Firecrawl', 'Browser Use', 'AgentMail', 'Resend'],
    projectRules: [...commonRules, 'Markets: USA, Saudi Arabia, UAE, Qatar, Bahrain; Egypt excluded', 'Email and DMs only; no cold calls', 'No outreach until consent/DNC, dedup, approval, and idempotency pass'],
    createdAt: '2026-10-10T00:00:00.000Z', kpis: { tasksCompleted: 0, automationsActive: 0, lessonsRecorded: 0 }, kpisVerified: false,
    sourceNotes: 'Canonical repository URL is not confirmed in the current portfolio source; verify before linking or writing.', evidenceStatus: 'not_checked',
    blockers: ['Make quota previously exceeded its 1,000-execution allowance', 'Lead uniqueness and DNC/approval gates need fresh verification before outreach'],
  },
  {
    id: 'portfolio-short-drama', name: 'Short Drama World',
    objective: 'Produce episodic short drama, track assets and renders, and publish only with platform receipts.',
    targetUsers: 'Short-form drama audience and production operator', status: 'blocked', inheritedCoreCapabilities,
    projectWorkflows: ['episode production', 'rendering', 'asset tracking', 'publishing evidence'], projectTools: ['GitHub', 'Railway', 'video generation/rendering providers'],
    projectRules: [...commonRules, 'Never mark an episode published without a platform receipt'],
    createdAt: '2026-10-10T00:00:00.000Z', kpis: { tasksCompleted: 0, automationsActive: 0, lessonsRecorded: 0 }, kpisVerified: false,
    repositoryUrl: 'https://github.com/alkadyenjy2/alkadyenjy2-short-drama-video-agent', evidenceStatus: 'not_checked',
    blockers: ['Provider credentials, durable DB status, and publishing receipts were previously missing or unverified', 'EP02-10 of THE ENVELOPE require rerender verification'],
  },
  {
    id: 'portfolio-scholarship', name: 'Scholarship OS / Hidden Scholarships',
    objective: 'Help Egyptian and Arab/MENA students aged 17–28 discover, match, prepare, apply for, and track scholarships.',
    targetUsers: 'Egyptian and Arab/MENA Bachelor/Master applicants aged 17–28', status: 'blocked', inheritedCoreCapabilities,
    projectWorkflows: ['profile', 'discover', 'match', 'eligibility', 'prepare', 'apply', 'track', 'follow up'], projectTools: ['GitHub', 'Supabase', 'OCR', 'official .edu/.gov/.org sources'],
    projectRules: [...commonRules, 'No source means do not publish', 'Evidence quote + last_verified_at within 30 days + confidence required', 'No ads before $500 MRR'],
    createdAt: '2026-10-10T00:00:00.000Z', kpis: { tasksCompleted: 0, automationsActive: 0, lessonsRecorded: 0 }, kpisVerified: false,
    repositoryUrl: 'https://github.com/alkadyenjy2/Scholarship-AI-Agent-Team', evidenceStatus: 'not_checked',
    blockers: ['OCR secrets and Supabase access remain blockers', 'Several UI components were not database-backed; live research coverage needs evidence'],
  },
  {
    id: 'portfolio-nilecare', name: 'NileCare',
    objective: 'Coordinate medical travel, provider discovery, and logistics without diagnosing or treating patients.',
    targetUsers: 'People coordinating medical travel', status: 'blocked', inheritedCoreCapabilities,
    projectWorkflows: ['provider discovery', 'trip coordination', 'logistics tracking'], projectTools: ['GitHub', 'Neon', 'Vercel'],
    projectRules: [...commonRules, 'Coordination only; no diagnosis or treatment', 'Do not use Paymob'],
    createdAt: '2026-10-10T00:00:00.000Z', kpis: { tasksCompleted: 0, automationsActive: 0, lessonsRecorded: 0 }, kpisVerified: false,
    repositoryUrl: 'https://github.com/alkadyenjy2/NileCare', evidenceStatus: 'not_checked',
    blockers: ['Production database tables were previously empty; authenticated persistence needs fresh verification'],
  },
  {
    id: 'portfolio-roofing', name: 'Roofing AI Operations / Dialer',
    objective: 'Operate roofing lead workflows, authenticated dashboard/metrics, and an AI-assisted dialer with call controls and audit evidence.',
    targetUsers: 'Roofing operators and sales teams', status: 'blocked', inheritedCoreCapabilities,
    projectWorkflows: ['lead intake', 'qualification', 'AI-agent calling', 'human handoff', 'call result verification'], projectTools: ['GitHub', 'Supabase', 'Netlify-compatible serverless function', 'Retell AI'],
    projectRules: [...commonRules, 'Never bypass Supabase Auth or RLS', 'No real calls until agent, consent/DNC, ownership, and recording disclosures are verified', 'Keep Roofing separate from ZE Outsource'],
    createdAt: '2026-10-10T00:00:00.000Z', kpis: { tasksCompleted: 0, automationsActive: 0, lessonsRecorded: 0 }, kpisVerified: false,
    repositoryUrl: 'https://github.com/alkadyenjy2/roofing-ai-operations', evidenceStatus: 'not_checked',
    blockers: ['Vercel deployment is blocked by account/plan scope, not yet proven to be a code failure', 'Netlify CLI/account authentication is not verified', 'Retell workspace returned no visible agent IDs; Autocalls connector is forbidden/disabled', 'Dashboard metrics require a valid Supabase session'],
  },
];
