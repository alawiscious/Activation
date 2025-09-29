import type {
  AgencyAlignment,
  DerivedContactLabel,
  DispositionToKlick,
  InfluenceLevel,
} from '@/types/domain'

export const DISPOSITION_OPTIONS: DispositionToKlick[] = ['Positive', 'Neutral', 'Negative', 'Unknown']
export const INFLUENCE_LEVEL_OPTIONS: InfluenceLevel[] = ['Decision Maker', 'Influencer', 'Gatekeeper', 'Blocker', 'Unknown']
export const AGENCY_ALIGNMENT_OPTIONS: AgencyAlignment[] = ['Havas', '21Grams', 'McCann', 'Unknown', 'Other']

const DERIVED_LABEL_MATRIX: Record<DispositionToKlick, Record<InfluenceLevel, DerivedContactLabel>> = {
  Positive: {
    'Decision Maker': 'Champion',
    Influencer: 'Advocate',
    Gatekeeper: 'Supporter',
    Blocker: 'Converted Blocker',
    Unknown: 'Unknown',
  },
  Neutral: {
    'Decision Maker': 'Potential Swing',
    Influencer: 'Steady Influence',
    Gatekeeper: 'Guarded Neutral',
    Blocker: 'Passive Blocker',
    Unknown: 'Unknown',
  },
  Negative: {
    'Decision Maker': 'Detractor',
    Influencer: 'Adversary',
    Gatekeeper: 'Obstacle',
    Blocker: 'Roadblock',
    Unknown: 'Unknown',
  },
  Unknown: {
    'Decision Maker': 'Unknown',
    Influencer: 'Unknown',
    Gatekeeper: 'Unknown',
    Blocker: 'Unknown',
    Unknown: 'Unknown',
  },
}

const LABEL_PALETTE: Record<DerivedContactLabel, { background: string; border: string; badgeBackground: string; badgeText: string }> = {
  Champion: {
    background: 'rgba(29, 78, 216, 0.12)',
    border: 'rgba(29, 78, 216, 0.4)',
    badgeBackground: 'rgba(29, 78, 216, 0.16)',
    badgeText: '#1d4ed8',
  },
  Advocate: {
    background: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(59, 130, 246, 0.35)',
    badgeBackground: 'rgba(59, 130, 246, 0.18)',
    badgeText: '#3b82f6',
  },
  Supporter: {
    background: 'rgba(96, 165, 250, 0.12)',
    border: 'rgba(96, 165, 250, 0.35)',
    badgeBackground: 'rgba(96, 165, 250, 0.18)',
    badgeText: '#60a5fa',
  },
  'Converted Blocker': {
    background: 'rgba(147, 197, 253, 0.14)',
    border: 'rgba(147, 197, 253, 0.38)',
    badgeBackground: 'rgba(147, 197, 253, 0.2)',
    badgeText: '#2563eb',
  },
  'Potential Swing': {
    background: 'rgba(16, 185, 129, 0.14)',
    border: 'rgba(16, 185, 129, 0.35)',
    badgeBackground: 'rgba(16, 185, 129, 0.2)',
    badgeText: '#0f766e',
  },
  'Steady Influence': {
    background: 'rgba(52, 211, 153, 0.16)',
    border: 'rgba(52, 211, 153, 0.35)',
    badgeBackground: 'rgba(52, 211, 153, 0.2)',
    badgeText: '#047857',
  },
  'Guarded Neutral': {
    background: 'rgba(110, 231, 183, 0.16)',
    border: 'rgba(110, 231, 183, 0.35)',
    badgeBackground: 'rgba(110, 231, 183, 0.22)',
    badgeText: '#047857',
  },
  'Passive Blocker': {
    background: 'rgba(167, 243, 208, 0.18)',
    border: 'rgba(167, 243, 208, 0.38)',
    badgeBackground: 'rgba(167, 243, 208, 0.25)',
    badgeText: '#065f46',
  },
  Adversary: {
    background: 'rgba(248, 113, 113, 0.16)',
    border: 'rgba(248, 113, 113, 0.38)',
    badgeBackground: 'rgba(248, 113, 113, 0.22)',
    badgeText: '#b91c1c',
  },
  Detractor: {
    background: 'rgba(239, 68, 68, 0.18)',
    border: 'rgba(239, 68, 68, 0.45)',
    badgeBackground: 'rgba(239, 68, 68, 0.24)',
    badgeText: '#991b1b',
  },
  Obstacle: {
    background: 'rgba(251, 113, 133, 0.18)',
    border: 'rgba(251, 113, 133, 0.42)',
    badgeBackground: 'rgba(251, 113, 133, 0.24)',
    badgeText: '#be123c',
  },
  Roadblock: {
    background: 'rgba(244, 63, 94, 0.2)',
    border: 'rgba(244, 63, 94, 0.48)',
    badgeBackground: 'rgba(244, 63, 94, 0.28)',
    badgeText: '#9f1239',
  },
  Unknown: {
    background: 'rgba(156, 163, 175, 0.1)',
    border: 'rgba(156, 163, 175, 0.3)',
    badgeBackground: 'rgba(156, 163, 175, 0.15)',
    badgeText: '#6b7280',
  },
}

export const DEFAULT_DISPOSITION: DispositionToKlick = 'Unknown'
export const DEFAULT_INFLUENCE_LEVEL: InfluenceLevel = 'Unknown'

export function deriveContactLabel(
  disposition: DispositionToKlick,
  influenceLevel: InfluenceLevel,
): DerivedContactLabel {
  return DERIVED_LABEL_MATRIX[disposition][influenceLevel]
}

export function normalizeDisposition(value?: string | null): DispositionToKlick {
  if (!value) return DEFAULT_DISPOSITION
  const normalized = value.trim().toLowerCase()
  if (normalized.startsWith('pos')) return 'Positive'
  if (normalized.startsWith('neg')) return 'Negative'
  if (normalized.startsWith('neut')) return 'Neutral'
  if (normalized.startsWith('unk')) return 'Unknown'
  return DEFAULT_DISPOSITION
}

export function normalizeInfluence(value?: string | null): InfluenceLevel {
  if (!value) return DEFAULT_INFLUENCE_LEVEL
  const normalized = value.trim().toLowerCase()
  if (normalized.startsWith('dec')) return 'Decision Maker'
  if (normalized.startsWith('inf')) return 'Influencer'
  if (normalized.startsWith('gate')) return 'Gatekeeper'
  if (normalized.startsWith('bloc')) return 'Blocker'
  if (normalized.startsWith('unk')) return 'Unknown'
  return DEFAULT_INFLUENCE_LEVEL
}

export function normalizeAgencyAlignment(value?: string | null): AgencyAlignment {
  if (!value) return 'Unknown'
  const normalized = value.trim().toLowerCase()
  if (normalized.includes('havas')) return 'Havas'
  if (normalized.includes('21grams') || normalized.includes('21 grams')) return '21Grams'
  if (normalized.includes('mccann')) return 'McCann'
  if (normalized.includes('other')) return 'Other'
  if (normalized.includes('unknown')) return 'Unknown'
  return 'Other'
}

export function getLabelPalette(label: DerivedContactLabel) {
  return LABEL_PALETTE[label]
}

export function formatDerivedLabel(
  label: DerivedContactLabel,
  disposition: DispositionToKlick,
  agencyAlignment?: AgencyAlignment,
): string {
  if (disposition === 'Negative' && agencyAlignment && agencyAlignment !== 'Unknown') {
    return `${label} (${agencyAlignment})`
  }
  return label
}
