// CSV transformers for converting raw CSV data to domain entities
import type {
  Brand,
  Contact,
  RevenueRow,
  BrandCsvRow,
  ContactCsvRow,
  RevenueCsvRow,
  CsvImportResult,
  CsvImportError,
  BrandStatus,
  BrandPhase,
  ContactLevel,
} from '@/types/domain'
import {
  deriveContactLabel,
  normalizeAgencyAlignment,
  normalizeDisposition,
  normalizeInfluence,
} from '@/lib/contactLabeling'

// Utility functions
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

const slugify = (value: string): string =>
  value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

function parseNumber(value: string | undefined): number | null {
  if (!value || value.trim() === '') return null
  const parsed = parseFloat(value.replace(/[,$]/g, ''))
  return isNaN(parsed) ? null : parsed
}

// Revenue imports can come in as exact dollars or as millions with decimal notation (e.g. 1.2 = $1.2M)
// Detect the latter so we can support both formats without duplicating parsing logic downstream.
function parseRevenueValue(raw: string | undefined): number | null {
  const parsed = parseNumber(raw)
  if (parsed === null) return null
  const normalized = raw?.trim() ?? ''
  const hasDecimal = normalized.includes('.') || normalized.toLowerCase().includes('e')
  const looksLikeMillions = hasDecimal && parsed >= 0 && parsed < 10_000
  return looksLikeMillions ? parsed * 1_000_000 : parsed
}

function parseBoolean(value: string | undefined): boolean {
  if (!value) return false
  const normalized = value.toLowerCase().trim()
  return normalized === 'true' || normalized === 'yes' || normalized === '1' || normalized === 'y'
}

function normalizeString(value: string | undefined): string {
  return value?.trim() || ''
}

function safeJsonParse(jsonString: string): any {
  try {
    return JSON.parse(jsonString)
  } catch (error) {
    console.warn('Failed to parse JSON:', jsonString, error)
    return undefined
  }
}

function validateBrandStatus(status: string): BrandStatus {
  const normalized = status.toLowerCase().trim()
  switch (normalized) {
    case 'active':
      return 'Active'
    case 'in pipeline':
    case 'pipeline':
      return 'In Pipeline'
    case 'discontinued':
      return 'Discontinued'
    default:
      return 'In Pipeline' // Default for unknown statuses
  }
}

function validateBrandPhase(phase: string): BrandPhase {
  const normalized = phase.toLowerCase().trim()
  switch (normalized) {
    case 'preclinical':
      return 'Preclinical'
    case 'phase i':
    case 'phase 1':
      return 'Phase I'
    case 'phase ii':
    case 'phase 2':
      return 'Phase II'
    case 'phase iii':
    case 'phase 3':
      return 'Phase III'
    case 'approved':
      return 'Approved'
    default:
      return 'Unknown'
  }
}

function validateContactLevel(level: string): ContactLevel {
  const normalized = level.toLowerCase().trim()
  switch (normalized) {
    case 'c-suite':
    case 'c suite':
    case 'csuite':
      return 'C-Suite'
    case 'vp':
    case 'vice president':
      return 'VP'
    case 'director':
      return 'Director'
    case 'manager':
      return 'Manager'
    case 'individual contributor':
    case 'ic':
      return 'Individual Contributor'
    default:
      return 'Individual Contributor' // Default for unknown levels
  }
}

// Infer level from title if level missing
function inferLevelFromTitle(title: string): ContactLevel {
  const t = title.toLowerCase()
  // C-Suite and equivalents
  if (/(chief|cxo|cfo|ceo|coo|cio|cto|cmo|cdo|cco|cgo|cpo|president|founder|co[-\s]?founder|managing\s+partner|partner\b)/.test(t)) return 'C-Suite'
  // VP and SVP/EVP
  if (/(\bsvp\b|senior\s+vice\s+president|exec(?:utive)?\s+vp|evp\b)/.test(t)) return 'VP'
  if (/(\bvp\b|vice\s+president)/.test(t)) return 'VP'
  // Director and Head/Chair/MD (non-medical doctor context)
  if (/(sr\.?\s*director|senior\s+director|associate\s+director|assistant\s+director|managing\s+director|director\b|head\s+of|chair\b|chairperson)/.test(t)) return 'Director'
  // Manager and Lead/Principal often manager-level in corp contexts
  if (/(sr\.?\s*manager|senior\s+manager|associate\s+manager|assistant\s+manager|general\s+manager|gm\b|manager\b|lead\b|principal\b)/.test(t)) return 'Manager'
  return 'Individual Contributor'
}

// Brand transformers
export function transformBrandCsvRow(
  row: BrandCsvRow,
  rowIndex: number
): { brand: Brand; revenueRows: RevenueRow[]; errors: CsvImportError[] } {
  const errors: CsvImportError[] = []
  const now = new Date()

  // Validate required fields
  if (!row.brand?.trim()) {
    errors.push({
      row: rowIndex + 1,
      column: 'brand',
      value: row.brand || '',
      message: 'Brand name is required',
    })
  }

  const brand: Brand = {
    id: generateId(),
    name: normalizeString(row.brand),
    status: validateBrandStatus(row.status || ''),
    phase: validateBrandPhase(row.phase || ''),
    therapeuticArea: normalizeString(row.therapeutic_area),
    createdAt: now,
    updatedAt: now,
  }

  // Extract revenue data from column-per-year format
  const revenueRows: RevenueRow[] = []
  const revenueYears = [2026, 2027, 2028, 2029, 2030, 2031, 2032]

  for (const year of revenueYears) {
    const revenueKey = `revenue_${year}`
    const revenueValue = row[revenueKey as keyof BrandCsvRow]
    
    if (revenueValue && revenueValue.trim() !== '') {
      const revenue = parseNumber(revenueValue)
      if (revenue !== null) {
        revenueRows.push({
          id: generateId(),
          brandId: brand.id,
          year,
          wwSales: revenue, // Assume total revenue is WW sales
          usSales: null,
          createdAt: now,
          updatedAt: now,
        })
      } else {
        errors.push({
          row: rowIndex + 1,
          column: revenueKey,
          value: revenueValue,
          message: 'Invalid revenue value',
        })
      }
    }
  }

  return { brand, revenueRows, errors }
}

export function transformBrandsCsv(
  rows: BrandCsvRow[]
): CsvImportResult<{ brand: Brand; revenueRows: RevenueRow[] }> {
  const data: { brand: Brand; revenueRows: RevenueRow[] }[] = []
  const errors: CsvImportError[] = []

  for (let i = 0; i < rows.length; i++) {
    const result = transformBrandCsvRow(rows[i], i)
    data.push({ brand: result.brand, revenueRows: result.revenueRows })
    errors.push(...result.errors)
  }

  return {
    data,
    errors,
    totalRows: rows.length,
    successCount: data.length,
    errorCount: errors.length,
  }
}

// Contact transformers
export function transformContactCsvRow(
  row: ContactCsvRow,
  rowIndex: number
): { contact: Contact; errors: CsvImportError[]; companySlug?: string; companyName?: string; groupKey: string } {
  const errors: CsvImportError[] = []
  const now = new Date()

  // Validate required fields
  if (!row.first_name?.trim()) {
    errors.push({
      row: rowIndex + 1,
      column: 'first_name',
      value: row.first_name || '',
      message: 'First name is required',
    })
  }

  if (!row.last_name?.trim()) {
    errors.push({
      row: rowIndex + 1,
      column: 'last_name',
      value: row.last_name || '',
      message: 'Last name is required',
    })
  }

  if (!row.email?.trim()) {
    errors.push({
      row: rowIndex + 1,
      column: 'email',
      value: row.email || '',
      message: 'Email is required',
    })
  }

  const disposition = normalizeDisposition((row as any).disposition_to_klick)
  const influenceLevel = normalizeInfluence((row as any).influence_level)
  const agencyAlignment = disposition === 'Negative'
    ? normalizeAgencyAlignment((row as any).agency_alignment)
    : undefined
  const derivedLabel = deriveContactLabel(disposition, influenceLevel)
  const rawCompanyName = (row.curr_company || (row as any).company || '').toString().trim()
  const explicitCompanySlug = ((row as any).company_slug || '').toString().trim()
  const normalizedCompanySlug = explicitCompanySlug
    ? slugify(explicitCompanySlug)
    : rawCompanyName
      ? slugify(rawCompanyName)
      : undefined
  const groupKey = normalizedCompanySlug || (rawCompanyName ? slugify(rawCompanyName) : `group-${rowIndex}`)

  const contact: Contact = {
    id: generateId(),
    firstName: normalizeString(row.first_name),
    lastName: normalizeString(row.last_name),
    email: normalizeString(row.email),
    title: normalizeString((row as any).curr_title || row.title),
    level: (row.level && row.level.trim())
      ? validateContactLevel(row.level)
      : inferLevelFromTitle(normalizeString(row.title)),
    functionalArea: normalizeString(row.functional_area) || 'Unknown',
    brand: row.brand && row.brand.trim() !== '' ? normalizeString(row.brand) : 'Unknown',
    therapeuticArea: row.therapeutic_area && row.therapeutic_area.trim() !== '' ? normalizeString(row.therapeutic_area) : 'Unknown',
    indication: (row as any).indication ? normalizeString((row as any).indication) : undefined,
    dispositionToKlick: disposition,
    influenceLevel,
    agencyAlignment,
    derivedLabel,
    known: parseBoolean(row.known),
    emailMismatch: row.email_mismatch ? normalizeString(row.email_mismatch) : undefined,
    targetId: row.target_id ? normalizeString(row.target_id) : undefined,
    targetName: row.target_name ? normalizeString(row.target_name) : undefined,
    positionId: row.position_id ? normalizeString(row.position_id) : undefined,
    currCompany: row.curr_company ? normalizeString(row.curr_company) : (rawCompanyName || undefined),
    startYear: row.start_year ? parseInt(row.start_year) || null : null,
    startMonth: row.start_month ? parseInt(row.start_month) || null : null,
    jobDesc: row.job_desc ? normalizeString(row.job_desc) : undefined,
    seniorityLevel: row.seniority_level ? normalizeString(row.seniority_level) : undefined,
    seniorityLevelDesc: row.seniority_level_desc ? normalizeString(row.seniority_level_desc) : undefined,
    fa: row.fa ? normalizeString(row.fa) : undefined,
    functionalGroup: row.functional_group ? normalizeString(row.functional_group) : undefined,
    linkedinHeadline: row.linkedin_headline ? normalizeString(row.linkedin_headline) : undefined,
    linkedinSummary: row.linkedin_summary ? normalizeString(row.linkedin_summary) : undefined,
    location: row.location ? normalizeString(row.location) : undefined,
    latitude: row.latitude ? parseFloat(row.latitude) : null,
    longitude: row.longitude ? parseFloat(row.longitude) : null,
    followerCount: row.follower_count ? parseInt(row.follower_count) : null,
    linkedinUrl: row.linkedin_url ? normalizeString(row.linkedin_url) : undefined,
    linkedinPublicId: row.linkedin_public_id ? normalizeString(row.linkedin_public_id) : undefined,
    linkedinId: row.linkedin_id ? normalizeString(row.linkedin_id) : undefined,
    leadId: row.lead_id ? normalizeString(row.lead_id) : undefined,
    contactId: row.contact_id ? normalizeString(row.contact_id) : undefined,
    genomeCrmcontactId: row.genome_crmcontact_id ? normalizeString(row.genome_crmcontact_id) : undefined,
    lastEmailDate: row.last_email_date ? normalizeString(row.last_email_date) : undefined,
    lastKlickster: row.last_klickster ? normalizeString(row.last_klickster) : undefined,
    linkedinLastPulled: row.linkedin_last_pulled ? normalizeString(row.linkedin_last_pulled) : undefined,
    
    // Enhanced LinkedIn Rich Data
    photoUrl: row.photo_url ? normalizeString(row.photo_url) : undefined,
    emailCount: row.email_count ? parseInt(row.email_count) : undefined,
    meetingCount: row.meeting_count ? parseInt(row.meeting_count) : undefined,
    totalActivity: row.total_activity ? parseInt(row.total_activity) : undefined,
    latestMeetingDate: row.latest_meeting_date ? normalizeString(row.latest_meeting_date) : undefined,
    asOfDate: row.as_of_date ? normalizeString(row.as_of_date) : undefined,
    companyCount: row.company_count ? parseInt(row.company_count) : undefined,
    domain: row.domain ? row.domain.split(',').map(d => d.trim()) : undefined,
    
    // Rich LinkedIn Profile Data (parse JSON strings)
    education: row.education ? safeJsonParse(row.education) : undefined,
    positions: row.positions ? safeJsonParse(row.positions) : undefined,
    skills: row.skills ? safeJsonParse(row.skills) : undefined,
    certifications: row.certifications ? safeJsonParse(row.certifications) : undefined,
    languages: row.languages ? safeJsonParse(row.languages) : undefined,
    recommendationsGiven: row.recommendations_given ? safeJsonParse(row.recommendations_given) : undefined,
    recommendationsReceived: row.recommendations_received ? safeJsonParse(row.recommendations_received) : undefined,
    frequencyData: row.frequency_data ? safeJsonParse(row.frequency_data) : undefined,
    tags: row.tags ? safeJsonParse(row.tags) : undefined,
    
    createdAt: now,
    updatedAt: now,
    isIrrelevant: false,
  }

  return {
    contact,
    errors,
    companySlug: normalizedCompanySlug,
    companyName: rawCompanyName || undefined,
    groupKey,
  }
}

export interface ContactImportRecord {
  contact: Contact
  companySlug?: string
  companyName?: string
  groupKey: string
}

export function transformContactsCsv(rows: ContactCsvRow[]): CsvImportResult<ContactImportRecord> {
  const data: ContactImportRecord[] = []
  const errors: CsvImportError[] = []

  for (let i = 0; i < rows.length; i++) {
    const result = transformContactCsvRow(rows[i], i)
    data.push({
      contact: result.contact,
      companySlug: result.companySlug,
      companyName: result.companyName,
      groupKey: result.groupKey,
    })
    errors.push(...result.errors)
  }

  return {
    data,
    errors,
    totalRows: rows.length,
    successCount: data.length,
    errorCount: errors.length,
  }
}

// Revenue transformers
export function transformRevenueCsvRow(
  row: RevenueCsvRow,
  rowIndex: number
): { revenueRow: RevenueRow; errors: CsvImportError[] } {
  const errors: CsvImportError[] = []
  const now = new Date()

  // Validate required fields
  if (!row.brand?.trim()) {
    errors.push({
      row: rowIndex + 1,
      column: 'brand',
      value: row.brand || '',
      message: 'Brand name is required',
    })
  }

  if (!row.year?.trim()) {
    errors.push({
      row: rowIndex + 1,
      column: 'year',
      value: row.year || '',
      message: 'Year is required',
    })
  }

  const year = parseInt(row.year || '0')
  if (isNaN(year) || year < 2000 || year > 2100) {
    errors.push({
      row: rowIndex + 1,
      column: 'year',
      value: row.year || '',
      message: 'Invalid year value',
    })
  }

  const revenueRow: RevenueRow = {
    id: generateId(),
    // Temporarily store brand name here for mapping; replaced with ID later
    brandId: normalizeString(row.brand),
    year,
    wwSales: parseRevenueValue(row.ww_sales),
    usSales: parseRevenueValue(row.us_sales),
    createdAt: now,
    updatedAt: now,
  }

  return { revenueRow, errors }
}

export function transformRevenueCsv(rows: RevenueCsvRow[]): CsvImportResult<RevenueRow> {
  const data: RevenueRow[] = []
  const errors: CsvImportError[] = []

  for (let i = 0; i < rows.length; i++) {
    const result = transformRevenueCsvRow(rows[i], i)
    data.push(result.revenueRow)
    errors.push(...result.errors)
  }

  return {
    data,
    errors,
    totalRows: rows.length,
    successCount: data.length,
    errorCount: errors.length,
  }
}

// Brand mapping utility for revenue data
export function mapRevenueToBrands(
  revenueRows: RevenueRow[],
  existingBrands: Brand[]
): { mappedRevenue: RevenueRow[]; unmappedBrands: string[] } {
  const mappedRevenue: RevenueRow[] = []
  const unmappedBrands = new Set<string>()

  for (const revenueRow of revenueRows) {
    // Find matching brand by case-insensitive name match
    const matchingBrand = existingBrands.find(
      brand => brand.name.toLowerCase() === revenueRow.brandId.toLowerCase()
    )

    if (matchingBrand) {
      mappedRevenue.push({
        ...revenueRow,
        brandId: matchingBrand.id,
      })
    } else {
      unmappedBrands.add(revenueRow.brandId)
    }
  }

  return {
    mappedRevenue,
    unmappedBrands: Array.from(unmappedBrands),
  }
}

// Create brand shells for unmapped revenue data (name-only)
export function createBrandShells(unmappedBrands: string[]): Brand[] {
  const now = new Date()
  
  return unmappedBrands.map(brandName => ({
    id: generateId(),
    name: brandName,
    status: 'In Pipeline' as BrandStatus,
    phase: 'Unknown' as BrandPhase,
    therapeuticArea: 'Unknown',
    createdAt: now,
    updatedAt: now,
  }))
}

// Create brand shells with additional info (molecule, indication, therapeutic area)
export function createBrandShellsWithInfo(
  brandInfos: { name: string; therapeuticArea?: string; molecule?: string; indication?: string }[]
): Brand[] {
  const now = new Date()
  return brandInfos.map(info => ({
    id: generateId(),
    name: info.name,
    status: 'In Pipeline' as BrandStatus,
    phase: 'Unknown' as BrandPhase,
    therapeuticArea: info.therapeuticArea || 'Unknown',
    molecule: info.molecule,
    indication: info.indication,
    createdAt: now,
    updatedAt: now,
  }))
}
