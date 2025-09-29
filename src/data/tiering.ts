// Company tiering logic and configuration
import type { CompanyTier, CompanyState } from '@/types/domain'

// Re-export CompanyTier for convenience
export type { CompanyTier } from '@/types/domain'

// Configuration constants for tiering thresholds
export const TIERING_CONFIG = {
  TIER_1: {
    MIN_REVENUE_USD: 20_000_000_000,
    MIN_LATE_STAGE_ASSETS: 10,
    MIN_LAUNCHES_LAST_5Y: 5,
    MIN_COUNTRIES_SERVED: 50,
  },
  PLATFORM_BUILDERS: {
    MIN_MODALITY_SHARE: 0.70,
    MAX_REVENUE_USD: 2_000_000_000,
  },
  TA_SPECIALISTS: {
    MIN_TA_SHARE: 0.60,
    MIN_LATE_STAGE_ASSETS: 2,
    MIN_MARKETED_PRODUCTS: 2,
  },
  MID_TIER: {
    MIN_REVENUE_USD: 2_000_000_000,
    MAX_REVENUE_USD: 20_000_000_000,
  },
} as const

// Seed list for known Big Pharma companies (Tier 1)
// Currently set to match the existing dataset - only 1 company should be Tier 1
export const SEED_BIG_PHARMA = new Set([
  'abbvie', // Only AbbVie should be Tier 1 based on current data
  // Add more as needed when enrichment data is available
])

// Company enrichment data interface (flexible - use what exists)
export interface CompanyEnrichmentData {
  annual_revenue_usd?: number | null
  market_cap_usd?: number | null // Currently unused but kept for future use
  countries_served_count?: number | null
  marketed_products_count?: number | null
  launches_last_5y?: number | null
  late_stage_assets_count?: number | null
  nda_maa_within_24m?: boolean | null
  primary_modality_share?: number | null // 0-1
  primary_ta_share?: number | null // 0-1
  is_global_big_pharma?: boolean | null
}

// Tiering logic with precedence order - simplified to work with available data
export function determineCompanyTier(
  company: CompanyState,
  enrichmentData: CompanyEnrichmentData = {}
): CompanyTier {
  const {
    is_global_big_pharma,
  } = enrichmentData

  // 1. Tier 1 (Big Pharma) - highest precedence
  if (is_global_big_pharma === true || SEED_BIG_PHARMA.has(company.slug.toLowerCase())) {
    return 'TIER_1'
  }

  // Calculate total revenue from brand revenue data
  const totalRevenue = company.revenueRows.reduce((sum, row) => {
    return sum + (row.wwSales || 0)
  }, 0)

  // Calculate average annual revenue (assuming 5-year span)
  const avgAnnualRevenue = totalRevenue / 5

  // Count brands and therapeutic areas
  const brandCount = company.brands.length
  const therapeuticAreas = new Set(company.brands.map(b => b.therapeuticArea).filter(Boolean))
  const taCount = therapeuticAreas.size

  // 2. Tier 1 (Big Pharma) - based on revenue and scale
  if (
    avgAnnualRevenue >= TIERING_CONFIG.TIER_1.MIN_REVENUE_USD &&
    brandCount >= 10
  ) {
    return 'TIER_1'
  }

  // 3. First Launchers - companies with few brands and low revenue
  if (
    brandCount <= 3 &&
    avgAnnualRevenue < 500_000_000
  ) {
    return 'FIRST_LAUNCHERS'
  }

  // 4. Therapeutic Area Specialists - focused on 1-2 TAs
  if (
    taCount <= 2 &&
    brandCount >= 3 &&
    avgAnnualRevenue >= 500_000_000
  ) {
    return 'TA_SPECIALISTS'
  }

  // 5. Mid-Tier - established companies with moderate revenue
  if (
    avgAnnualRevenue >= TIERING_CONFIG.MID_TIER.MIN_REVENUE_USD &&
    avgAnnualRevenue < TIERING_CONFIG.MID_TIER.MAX_REVENUE_USD &&
    brandCount >= 3
  ) {
    return 'MID_TIER'
  }

  // 6. Focused Platform Builders - smaller companies with focused portfolios
  if (
    brandCount >= 2 &&
    avgAnnualRevenue < TIERING_CONFIG.PLATFORM_BUILDERS.MAX_REVENUE_USD
  ) {
    return 'PLATFORM_BUILDERS'
  }

  // 7. Unclassified (default)
  return 'UNCLASSIFIED'
}

// Helper function to get tier display name
export function getTierDisplayName(tier: CompanyTier): string {
  switch (tier) {
    case 'TIER_1':
      return 'Tier 1'
    case 'FIRST_LAUNCHERS':
      return 'First Launchers'
    case 'PLATFORM_BUILDERS':
      return 'Focused Platform Builders'
    case 'TA_SPECIALISTS':
      return 'Therapeutic Area Specialists'
    case 'MID_TIER':
      return 'Mid-Tier'
    case 'UNCLASSIFIED':
      return 'Unclassified'
    default:
      return 'Unknown'
  }
}

// Helper function to check if company needs enrichment
export function needsEnrichment(_company: CompanyState, enrichmentData: CompanyEnrichmentData = {}): boolean {
  const {
    annual_revenue_usd,
    marketed_products_count,
    late_stage_assets_count,
    primary_modality_share,
    primary_ta_share,
  } = enrichmentData

  // Check if key fields are missing that would help with tiering
  return (
    annual_revenue_usd == null ||
    marketed_products_count == null ||
    late_stage_assets_count == null ||
    primary_modality_share == null ||
    primary_ta_share == null
  )
}

// Backfill function to update all company tiers
export function backfillCompanyTiers(
  companies: Record<string, CompanyState>,
  enrichmentDataMap: Record<string, CompanyEnrichmentData> = {}
): Record<string, CompanyState> {
  const updatedCompanies = { ...companies }

  for (const [slug, company] of Object.entries(companies)) {
    const enrichmentData = enrichmentDataMap[slug] || {}
    const newTier = determineCompanyTier(company, enrichmentData)
    
    if (company.tier !== newTier) {
      updatedCompanies[slug] = {
        ...company,
        tier: newTier,
        updatedAt: new Date(),
      }
    }
  }

  return updatedCompanies
}
