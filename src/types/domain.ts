// Core domain types for Pharma Visual Pivot

export type DispositionToKlick = 'Positive' | 'Neutral' | 'Negative' | 'Unknown'
export type InfluenceLevel = 'Decision Maker' | 'Influencer' | 'Gatekeeper' | 'Blocker' | 'Unknown'
export type AgencyAlignment = 'Havas' | '21Grams' | 'McCann' | 'Unknown' | 'Other'
export type CompanyTier = 'TIER_1' | 'FIRST_LAUNCHERS' | 'PLATFORM_BUILDERS' | 'TA_SPECIALISTS' | 'MID_TIER' | 'UNCLASSIFIED'

// Contract management types
export type ContractScope = 'SERVICE_LINE' | 'THERAPEUTIC_AREA' | 'BRAND_SPECIFIC'
export type ContractStatus = 'ACTIVE' | 'EXPIRED' | 'EXPIRING_SOON' | 'TERMINATED'

export interface CompetitiveContract {
  id: string
  companySlug: string
  agencyName: string
  scope: ContractScope
  // For SERVICE_LINE scope
  serviceCategory?: ServiceCategory
  // For THERAPEUTIC_AREA scope
  therapeuticArea?: string
  // For BRAND_SPECIFIC scope
  brandId?: string
  startDate: Date
  expirationDate: Date
  status: ContractStatus
  description?: string
  createdAt: Date
  updatedAt: Date
}

// Fee-to-Revenue Ratio Management
export type ProductStage = 'PRE_LAUNCH_2Y' | 'PRE_LAUNCH_1Y' | 'LAUNCH' | 'POST_LAUNCH' | 'PRE_LOE' | 'LOE'

export interface FeeToRevenueRatio {
  id: string
  serviceCategory: ServiceCategory
  stage: ProductStage
  ratio: number // Fee as percentage of revenue (e.g., 0.05 = 5%)
  description?: string
  createdAt: Date
  updatedAt: Date
}

export interface ServiceFeeAnalysis {
  brandId: string
  serviceCategory: ServiceCategory
  currentRevenue: number
  estimatedFee: number
  feeToRevenueRatio: number
  stage: ProductStage
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  lastCalculated: Date
}
export type DerivedContactLabel =
  | 'Champion'
  | 'Advocate'
  | 'Supporter'
  | 'Converted Blocker'
  | 'Potential Swing'
  | 'Steady Influence'
  | 'Guarded Neutral'
  | 'Passive Blocker'
  | 'Adversary'
  | 'Detractor'
  | 'Obstacle'
  | 'Roadblock'
  | 'Unknown'

export interface Brand {
  id: string
  name: string
  status: 'Active' | 'In Pipeline' | 'Discontinued'
  phase: 'Preclinical' | 'Phase I' | 'Phase II' | 'Phase III' | 'Approved' | 'Unknown'
  therapeuticArea: string
  // Optional enrichment fields (from revenue CSV)
  molecule?: string
  indication?: string
  // Extended optional metadata from master file
  mechanismOfAction?: string
  technology?: string
  technologySubtypeClassifications?: string
  indicationMarketStatus?: string
  indicationBreakdown?: string
  // Service assignments per brand (agency by service)
  services?: Partial<Record<ServiceCategory, string>>
  servicesRevenue?: Partial<Record<ServiceCategory, number>>
  servicingAgency?: string
  competitor?: string
  createdAt: Date
  updatedAt: Date
}

export interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  title: string
  level: 'C-Suite' | 'VP' | 'Director' | 'Manager' | 'Individual Contributor'
  functionalArea: string
  brand?: string
  therapeuticArea?: string
  indication?: string
  known: boolean
  isIrrelevant?: boolean
  dispositionToKlick: DispositionToKlick
  influenceLevel: InfluenceLevel
  agencyAlignment?: AgencyAlignment
  derivedLabel: DerivedContactLabel
  // Richening fields (stored, many not displayed by default)
  emailMismatch?: string
  targetId?: string
  targetName?: string
  positionId?: string
  currCompany?: string
  startYear?: number | null
  startMonth?: number | null
  jobDesc?: string
  seniorityLevel?: string
  seniorityLevelDesc?: string
  fa?: string
  functionalGroup?: string
  linkedinHeadline?: string
  linkedinSummary?: string
  location?: string
  latitude?: number | null
  longitude?: number | null
  followerCount?: number | null
  linkedinUrl?: string
  linkedinPublicId?: string
  linkedinId?: string
  leadId?: string
  contactId?: string
  genomeCrmcontactId?: string
  lastEmailDate?: string
  lastKlickster?: string
  linkedinLastPulled?: string
  
  // Enhanced LinkedIn Rich Data
  photoUrl?: string
  emailCount?: number
  meetingCount?: number
  totalActivity?: number
  latestMeetingDate?: string
  asOfDate?: string
  companyCount?: number
  domain?: string[]
  
  // Rich LinkedIn Profile Data
  education?: Array<{
    id: number
    degreeName?: string
    endMonth: number
    endYear: number
    fieldOfStudy?: string
    lastUpdated: string
    linkedinUrl: string
    personId: number
    schoolLogo?: string
    schoolName: string
    startMonth: number
    startYear: number
  }>
  
  positions?: Array<{
    id: number
    agencyDepartmentId?: number
    companyLocation: string
    companyLogo: string
    companyName: string
    contractType?: string
    description: string
    endMonth?: number
    endYear?: number
    functionalAreaDesc?: string
    functionalAreaId?: number
    lastUpdated: string
    linkedinId: string
    linkedinUrl: string
    personId: number
    seniorityDesc?: string
    seniorityLevel?: number
    startMonth: number
    startYear: number
    title: string
  }>
  
  skills?: Array<{
    id: number
    skill: string
  }>
  
  certifications?: any[]
  languages?: any[]
  
  recommendationsGiven?: Array<{
    id: number
    recommenderName: string
    recommenderTitle: string
    recommenderCompany: string
    recommendationText: string
    relationshipType: string
    createdDate: string
  }>
  
  recommendationsReceived?: Array<{
    id: number
    recommenderName: string
    recommenderTitle: string
    recommenderCompany: string
    recommendationText: string
    relationshipType: string
    createdDate: string
  }>
  
  frequencyData?: Array<{
    cumulativeCount: string
    interactionType: string
    weekStart: string
    weeklyCount: number
  }>
  
  tags?: any[]
  createdAt: Date
  updatedAt: Date
}

export interface RevenueRow {
  id: string
  brandId: string
  year: number
  wwSales?: number | null
  usSales?: number | null
  createdAt: Date
  updatedAt: Date
}

// CSV Import types
export interface BrandCsvRow {
  brand: string
  status: string
  phase: string
  therapeutic_area: string
  revenue_2026?: string
  revenue_2027?: string
  revenue_2028?: string
  revenue_2029?: string
  revenue_2030?: string
  revenue_2031?: string
  revenue_2032?: string
  [key: string]: string | undefined
}

export interface ContactCsvRow {
  first_name: string
  last_name: string
  email: string
  title: string
  level: string
  functional_area: string
  brand?: string
  therapeutic_area?: string
  known: string
  company?: string
  company_slug?: string
  disposition_to_klick?: string
  influence_level?: string
  agency_alignment?: string
  // Richening columns (optional)
  email_mismatch?: string
  target_id?: string
  target_name?: string
  position_id?: string
  curr_company?: string
  start_year?: string
  start_month?: string
  job_desc?: string
  seniority_level?: string
  seniority_level_desc?: string
  fa?: string
  functional_group?: string
  linkedin_headline?: string
  linkedin_summary?: string
  location?: string
  latitude?: string
  longitude?: string
  follower_count?: string
  linkedin_url?: string
  linkedin_public_id?: string
  linkedin_id?: string
  lead_id?: string
  contact_id?: string
  genome_crmcontact_id?: string
  last_email_date?: string
  last_klickster?: string
  linkedin_last_pulled?: string
  
  // Enhanced LinkedIn Rich Data columns
  photo_url?: string
  email_count?: string
  meeting_count?: string
  total_activity?: string
  latest_meeting_date?: string
  as_of_date?: string
  company_count?: string
  domain?: string
  
  // Rich LinkedIn Profile Data (JSON strings for complex data)
  education?: string
  positions?: string
  skills?: string
  certifications?: string
  languages?: string
  recommendations_given?: string
  recommendations_received?: string
  frequency_data?: string
  tags?: string
  
  [key: string]: string | undefined
}

export interface RevenueCsvRow {
  // Accept both legacy `product` and new `molecular_name`
  product?: string
  molecular_name?: string
  brand: string
  indication?: string
  therapeutic_area: string
  year: string
  ww_sales?: string
  us_sales?: string
  [key: string]: string | undefined
}

// Filter types
export interface Filters {
  brands: string[]
  therapeuticAreas: string[]
  functionalAreas: string[]
  levels: string[] // legacy; not used by new UI but kept for compatibility
  roleLevels?: string[]
  seniorities?: string[]
  stages?: string[]
  locations?: string[]
  titleSearch: string
  knownOnly: boolean
}

// Pivot summary types
export interface PivotSummary {
  functionalArea: string
  level: string
  count: number
  knownCount: number
  unknownCount: number
}

export interface BrandPivotSummary {
  brand: string
  therapeuticArea: string
  count: number
  knownCount: number
  unknownCount: number
}

// Company state
export interface CompanyState {
  id: string
  name: string
  slug: string
  brands: Brand[]
  contacts: Contact[]
  revenueRows: RevenueRow[]
  filters: Filters
  orgCharts?: OrgChart[]
  currentOrgChartId?: string | null
  synopsis?: string
  targets?: string[]
  insights?: { timestamp: string; text: string }[]
  attachments?: Attachment[]
  links?: { label: string; url: string }[]
  tier?: CompanyTier
  createdAt: Date
  updatedAt: Date
}

export interface Attachment {
  id: string
  name: string
  type: string
  size: number
  dataUrl: string
  uploadedAt: string
  text?: string
  extracted?: boolean
}

// Storage adapter interface
export interface StorageAdapter {
  load(companySlug: string): Promise<CompanyState | null>
  save(companySlug: string, state: CompanyState): Promise<void>
  delete(companySlug: string): Promise<void>
  listCompanies(): Promise<{ slug: string; name: string; updatedAt: Date }[]>
}

// CSV mapping types
export interface CsvColumnMapping {
  [csvColumn: string]: keyof (BrandCsvRow & ContactCsvRow & RevenueCsvRow) | null
}

export interface CsvImportResult<T> {
  data: T[]
  errors: CsvImportError[]
  totalRows: number
  successCount: number
  errorCount: number
}

export interface CsvImportError {
  row: number
  column: string
  value: string
  message: string
}

// Chart data types
export interface RevenueChartData {
  year: number
  ww: number | null
  us: number | null
}

// Org chart types
export interface OrgChartNode {
  contactId: string
  x: number
  y: number
  clusterId?: string | null
  parentId?: string | null
  width?: number
  height?: number
  tags?: FollowUpTag[]
}

export interface OrgChartCluster {
  id: string
  label: string
  x: number
  y: number
  width: number
}

export interface OrgChartCanvasMeta {
  width: number
  height: number
}

export interface OrgChart {
  id: string
  name: string
  nodes: OrgChartNode[]
  clusters?: OrgChartCluster[]
  canvas?: OrgChartCanvasMeta
  cardVariant?: 'small' | 'full'
  createdAt: Date
  updatedAt: Date
}

// Follow-up tagging for org chart nodes
export const FOLLOW_UP_TAGS = [
  'Growth Lead of CS Lead Direct Follow Up',
  'OpGen One-Off Follow Up',
  'Marketing Follow Up',
] as const
export type FollowUpTag = typeof FOLLOW_UP_TAGS[number]

// Klick services (hard-coded as per requirements)
export const KLICK_SERVICES = [
  'Digital Strategy',
  'Creative Services',
  'Media Planning & Buying',
  'Analytics & Insights',
  'Technology Solutions',
  'Content Marketing',
  'Social Media',
  'Email Marketing',
  'Search Marketing',
  'Programmatic Advertising',
  'Marketing Automation',
  'Customer Experience',
  'Brand Strategy',
  'Market Research',
  'Competitive Intelligence',
] as const

export type KlickService = typeof KLICK_SERVICES[number]

// Service categories for the TA matrix
export const SERVICE_CATEGORIES = [
  'AOR',
  'DAOR',
  'Market Access',
  'MedComms',
  'Media',
  'Tech',
  'Consulting',
] as const
export type ServiceCategory = typeof SERVICE_CATEGORIES[number]

export const AGENCIES = [
  'Klick',
  // Competitive agencies will be dynamically populated from Genome API
  // No predefined service mappings - all competitive intelligence will be derived from actual data
] as const

// Competitive agency directory types
export const AGENCY_STATUSES = [
  'Stable',
  'In Trouble',
  'Heavily Recruiting',
  'Losing Work',
  'Gaining Work',
] as const
export type AgencyStatus = typeof AGENCY_STATUSES[number]

export interface AgencyMeta {
  name: string
  // Optional notes or external signal summary
  mode?: string
  notes?: string
  // Status by service category
  serviceStatus: Partial<Record<ServiceCategory, AgencyStatus>>
  website?: string
  logoUrl?: string
}

// Utility types
export type BrandStatus = Brand['status']
export type BrandPhase = Brand['phase']
export type ContactLevel = Contact['level']

// State management types
export interface AppState {
  currentCompanySlug: string | null
  companies: { [slug: string]: CompanyState }
  isLoading: boolean
  error: string | null
}

export interface AppActions {
  setCurrentCompany: (slug: string) => void
  createCompany: (name: string, slug: string) => void
  updateCompanyState: (slug: string, state: Partial<CompanyState>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  backfillCompanyTiers: (enrichmentDataMap?: Record<string, any>) => void
}


