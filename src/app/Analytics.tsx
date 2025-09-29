import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { usePharmaVisualPivotStore } from '@/data/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Link, useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts'
import { AlertTriangle } from 'lucide-react'
// Removed complex tiering import - using simplified Tier 1 vs ex-Tier 1 system
import { SERVICE_CATEGORIES } from '@/types/domain'
import { SectionButtons } from '@/components/Shared/SectionButtons'
import { Navigation } from '@/components/Shared/Navigation'
import { InsightsPanel } from '@/components/Analytics/InsightsPanel'
import { ContractManager } from '@/components/Contracts/ContractManager'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { BigQueryRevenueManager } from '@/components/Revenue/BigQueryRevenueManager'

type RevenueTier = '0-100M' | '100-500M' | '500M-1B' | '1B+'

function getRevenueTier(value: number): RevenueTier {
  if (value >= 1_000_000_000) return '1B+'
  if (value >= 500_000_000) return '500M-1B'
  if (value >= 100_000_000) return '100-500M'
  return '0-100M'
}

const CHART_COLORS = ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd','#8c564b','#e377c2','#7f7f7f','#bcbd22','#17becf']
const ANALYTICS_FILTER_STORAGE_KEY = 'pharma-analytics-filters'
const MAX_ANALYTICS_BRAND_VISUALS = 200

export function Analytics() {
  const { companies, addCompanyInsight, agencies, backfillCompanyTiers, calculateServiceFeeAnalysis } = usePharmaVisualPivotStore()
  const navigate = useNavigate()

  const storedFilters = React.useMemo(() => {
    if (typeof window === 'undefined') return null
    try {
      const raw = sessionStorage.getItem(ANALYTICS_FILTER_STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }, [])

  const [stageFilter, setStageFilter] = useState<string[]>(storedFilters?.stageFilter ?? [])
  const [taFilter, setTaFilter] = useState<string[]>(storedFilters?.taFilter ?? [])
  const [companyTierFilter, setCompanyTierFilter] = useState<string[]>(storedFilters?.companyTierFilter ?? [])
  const [revenueTiers, setRevenueTiers] = useState<RevenueTier[]>(storedFilters?.revenueTiers ?? [])
  const [growth, setGrowth] = useState<'any' | 'growing' | 'shrinking'>(storedFilters?.growth ?? 'any')
  const [serviceFilter, setServiceFilter] = useState<string | null>(storedFilters?.serviceFilter ?? null)
  const [agencyFilter, setAgencyFilter] = useState<string | null>(storedFilters?.agencyFilter ?? null)
  const [companySlugFilter, setCompanySlugFilter] = useState<string | null>(storedFilters?.companySlugFilter ?? null)
  const [companySearch, setCompanySearch] = useState<string>('')
  const [clusterTags, setClusterTags] = useState<string[]>(storedFilters?.clusterTags ?? [])
  const [tieringInitialized, setTieringInitialized] = useState<boolean>(false)
  const [revenueType, setRevenueType] = useState<'ww' | 'us'>('ww')
  const [expandedCell, setExpandedCell] = useState<{year: number, ta: string} | null>(null)
  const [showContractManager, setShowContractManager] = useState(false)
  const [dataProcessingError, setDataProcessingError] = useState<string | null>(null)
  const [hoveredBrand, setHoveredBrand] = useState<string | null>(null)

  // Performance optimization: Add data chunking for large datasets
  // const CHUNK_SIZE = 1000 // Process companies in chunks of 1000
  // const [processedChunks, setProcessedChunks] = useState<number>(0)
  // const [isProcessingData, setIsProcessingData] = useState<boolean>(false)

  // Helper functions - defined early to avoid hoisting issues
  const fmtUSD = useCallback((n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n), [])
  const fmtRevenueInBillions = useCallback((n: number) => `$${(n / 1_000_000_000).toFixed(1)}B`, [])
  const fmtFeeInThousands = useCallback((n: number) => {
    // Round to closest million, then represent in thousands
    const roundedToMillion = Math.round(n / 1_000_000) * 1_000_000
    const thousands = roundedToMillion / 1_000
    return `$${thousands.toLocaleString()}K`
  }, [])



  
  // Sanitize dataKey for Recharts compatibility
  const sanitizeKey = useCallback((s: string) => s.replace(/[^a-zA-Z0-9_]/g, "_"), [])

  // Run tiering backfill on component mount only
  useEffect(() => {
    if (!tieringInitialized) {
      try {
        // Check if any companies already have tiers assigned
        const hasTiers = Object.values(companies).some(company => company.tier)
        if (!hasTiers) {
          console.log('🔄 Starting company tiering backfill...')
          backfillCompanyTiers()
          console.log('✅ Company tiering backfill completed')
        }
        setTieringInitialized(true)
      } catch (error) {
        console.error('❌ Error during tiering backfill:', error)
        setDataProcessingError('Failed to process company tiers. Please try refreshing the page.')
      }
    }
  }, [backfillCompanyTiers, tieringInitialized])


  // Simplified tier options: Tier 1 vs ex-Tier 1
  const companyTierOptions = ['Tier 1', 'ex-Tier 1']
  
  // Tier 1 companies list
  const tier1Companies = [
    'Johnson & Johnson',
    'Roche',
    'Pfizer',
    'Merck & Co. (MSD)',
    'Novartis',
    'AbbVie',
    'Bristol Myers Squibb (BMS)',
    'AstraZeneca',
    'Eli Lilly & Co.',
    'Sanofi',
    'GlaxoSmithKline (GSK)',
    'Amgen',
    'Takeda',
    'Boehringer Ingelheim',
    'Novo Nordisk'
  ]
  
  // Function to determine if a company is Tier 1
  const isTier1Company = useCallback((companyName: string) => {
    return tier1Companies.some(tier1Name => 
      companyName.toLowerCase().includes(tier1Name.toLowerCase()) ||
      tier1Name.toLowerCase().includes(companyName.toLowerCase())
    )
  }, [])
  const revenueTierOptions: RevenueTier[] = ['0-100M','100-500M','500M-1B','1B+']

  // Always process full dataset structure - show all companies and brands
  const data = useMemo(() => {
    try {
      // Add timeout to prevent infinite processing
      const startTime = Date.now()
      const MAX_PROCESSING_TIME = 5000 // 5 seconds
      
      // Performance optimization: Limit processing for large datasets
      const allCompanies = Object.values(companies)
      const totalCompanies = allCompanies.length
      
      // Safety check - prevent processing if too many companies
      if (totalCompanies > 5000) {
        console.warn(`⚠️ Too many companies (${totalCompanies}) for Analytics processing. Returning empty data.`)
        return {
          rows: [],
          years: [] as number[],
          companyTiers: new Map(),
          taOptions: [],
        }
      }
      
      if (totalCompanies > 1000) {
        console.warn(`⚠️ Large dataset detected: ${totalCompanies} companies. Using performance optimizations.`)
      }
      
      // Process all companies to show full dataset structure
      let companiesToProcess = companySlugFilter ? 
        allCompanies.filter(c => c.slug === companySlugFilter) :
        allCompanies

  // Performance optimization: Limit processing for very large datasets
  if (companiesToProcess.length > 100) {
    companiesToProcess = companiesToProcess.slice(0, 100)
  }

    // Flatten brands across companies
    const rows: Array<{
      company: string
      slug: string
      brandId: string
      brand: string
      stage: string
      ta: string
      indication?: string
      series: Record<number, number>
      seriesUS: Record<number, number>
      tiersByYear: Record<number, RevenueTier>
      growing?: boolean
    }> = []

    const stageSet = new Set<string>()
    const taSet = new Set<string>()

    const companyTiers = new Map<string, string>()
    const yearsSet = new Set<number>()

    companiesToProcess.forEach((company, index) => {
      // Check for timeout every 100 companies
      if (index % 100 === 0 && Date.now() - startTime > MAX_PROCESSING_TIME) {
        console.warn('⚠️ Analytics processing timeout - stopping early')
        return
      }
      
      // Use simplified tiering system: Tier 1 vs ex-Tier 1
      const tier = isTier1Company(company.name) ? 'Tier 1' : 'ex-Tier 1'
      companyTiers.set(company.slug, tier)

      company.brands.forEach(b => {
        stageSet.add((b.indicationMarketStatus || '').trim())
        if (b.therapeuticArea) taSet.add(b.therapeuticArea)
        const points = company.revenueRows.filter(r => r.brandId === b.id).sort((a,b)=>a.year-b.year)
        
        // Debug logging for Merck & Co.
        if (company.name.toLowerCase().includes('merck') && points.length === 0) {
          console.log('🔍 Debug Merck brand with no revenue:', {
            brandName: b.name,
            brandId: b.id,
            totalRevenueRows: company.revenueRows.length,
            sampleRevenueRows: company.revenueRows.slice(0, 3).map(r => ({ brandId: r.brandId, year: r.year, wwSales: r.wwSales }))
          })
        }
        
        points.forEach(r => yearsSet.add(r.year))
        const last = [...points].reverse().find(r => r.wwSales != null)
        const prev = [...points].reverse().find(r => r !== last && r.wwSales != null)
        const growing = last && prev ? (Number(last.wwSales||0) - Number(prev.wwSales||0)) > 0 : undefined
        const series: Record<number, number> = {}
        const seriesUS: Record<number, number> = {}
        const tiersByYear: Record<number, RevenueTier> = {}
        points.forEach(r => { 
          const ww = Number(r.wwSales || 0)
          const us = Number(r.usSales || 0)
          series[r.year] = ww
          seriesUS[r.year] = us
          tiersByYear[r.year] = getRevenueTier(ww)
        })
        rows.push({
          company: company.name,
          slug: company.slug,
          brandId: b.id,
          brand: b.name,
          stage: b.indicationMarketStatus || '',
          ta: b.therapeuticArea,
          indication: b.indication,
          series,
          seriesUS,
          tiersByYear,
          growing,
        })
      })
    })

    return {
      rows,
      stageOptions: Array.from(stageSet).filter(Boolean).sort(),
      taOptions: Array.from(taSet).sort(),
      companyTiers,
      years: Array.from(yearsSet).sort((a,b)=>a-b),
    }
    } catch (error) {
      console.error('❌ Error processing analytics data:', error)
      return {
        rows: [],
        stageOptions: [],
        taOptions: [],
        companyTiers: new Map(),
        years: [] as number[],
      }
    }
  }, [companies, companySlugFilter])

  // Build tier index after data is available
  const tierIndex = useMemo(() => {
    const byCompanyId = new Map<string, any[]>()
    const byTier = new Map<string, string[]>()
    
    // Build company index from rows
    for (const row of data.rows) {
      const cid = row.slug
      if (!byCompanyId.has(cid)) byCompanyId.set(cid, [])
      byCompanyId.get(cid)!.push(row)
    }
    
    // Assign tiers and build tier index
    for (const [cid] of byCompanyId) {
      const tier = data.companyTiers.get(cid) || 'Unclassified'
      if (!byTier.has(tier)) byTier.set(tier, [])
      byTier.get(tier)!.push(cid)
    }
    
    return { byCompanyId, byTier }
  }, [data.rows, data.companyTiers])

  // Results are always enabled now - no need for complex enable/disable logic

  // Scroll performance optimization

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const payload = {
      stageFilter,
      taFilter,
      companyTierFilter,
      revenueTiers,
      growth,
      serviceFilter,
      agencyFilter,
      companySlugFilter,
      clusterTags,
    }
    try {
      sessionStorage.setItem(ANALYTICS_FILTER_STORAGE_KEY, JSON.stringify(payload))
    } catch {/* ignore storage failures */}
  }, [stageFilter, taFilter, companyTierFilter, revenueTiers, growth, serviceFilter, agencyFilter, companySlugFilter, clusterTags])

  // Generic pill-checkbox group
  const PillGroup = ({
    label,
    options,
    value,
    onChange,
    disabled,
  }: {
    label: React.ReactNode
    options: string[]
    value: string[]
    onChange: (_newValue: string[]) => void
    disabled?: Set<string>
  }) => {
    return (
      <div className="space-y-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="flex flex-wrap gap-2">
          {options.map(opt => {
            const selected = value.includes(opt)
            const isDisabled = disabled?.has(opt) && !selected
            return (
              <button
                key={opt}
                disabled={isDisabled}
                className={`text-sm border-2 rounded-xl px-4 py-2 font-medium transition-all duration-200 ${selected ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-500 shadow-lg' : 'text-muted-foreground border-gray-200 hover:border-purple-300 hover:text-purple-600'} ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                onClick={() => {
                  if (isDisabled) return
                  const set = new Set(value)
                  if (set.has(opt)) set.delete(opt); else set.add(opt)
                  onChange(Array.from(set))
                }}
                title={opt}
              >
                {opt}
              </button>
            )
          })}
          {value.length > 0 && (
            <button
              className="text-xs border rounded-full px-3 py-1 text-muted-foreground"
              onClick={() => onChange([])}
            >
              Clear
            </button>
          )}
        </div>
      </div>
    )
  }

  const passesFilters = React.useCallback((row: typeof data.rows[number], overrides: {
    stageFilter?: string[]
    taFilter?: string[]
    companyTierFilter?: string[]
    revenueTiers?: RevenueTier[]
    growth?: 'any' | 'growing' | 'shrinking'
    serviceFilter?: string | null
    agencyFilter?: string | null
    companySlugFilter?: string | null
  } = {}) => {
    const stageSelection = overrides.stageFilter ?? stageFilter
    if (stageSelection.length && !stageSelection.includes(row.stage)) return false

    const taSelection = overrides.taFilter ?? taFilter
    if (taSelection.length && !taSelection.includes(row.ta)) return false

    const tierSelection = overrides.companyTierFilter ?? companyTierFilter
    if (tierSelection.length) {
      const tier = data.companyTiers.get(row.slug) || 'ex-Tier 1'
      if (!tierSelection.includes(tier)) return false
    }

    const revenueSelection = overrides.revenueTiers ?? revenueTiers
    if (revenueSelection.length) {
      const match = Object.values(row.series).some(v => revenueSelection.includes(getRevenueTier(v || 0)))
      if (!match) return false
    }

    const growthSelection = overrides.growth ?? growth
    if (growthSelection === 'growing' && row.growing !== true) return false
    if (growthSelection === 'shrinking' && row.growing !== false) return false

    const companySlugSelection = overrides.companySlugFilter ?? companySlugFilter
    if (companySlugSelection && row.slug !== companySlugSelection) return false

    const serviceSelection = overrides.serviceFilter === undefined ? serviceFilter : overrides.serviceFilter
    const agencySelection = overrides.agencyFilter === undefined ? agencyFilter : overrides.agencyFilter

    if (serviceSelection || agencySelection) {
      const brand = companies[row.slug]?.brands?.find(b => b.id === row.brandId)
      const services = (brand?.services || {}) as Record<string, string | undefined>

      if (serviceSelection && agencySelection) {
        const stored = services[serviceSelection]
        const target = agencySelection === 'Unknown' ? '' : agencySelection
        if ((stored ?? '') !== target) return false
      } else if (serviceSelection) {
        const stored = services[serviceSelection]
        if (stored === undefined || stored === null) return false
      } else if (agencySelection) {
        const target = agencySelection === 'Unknown' ? '' : agencySelection
        const values = Object.values(services)
        const has = values.some(v => (v ?? '') === target)
        if (!has) return false
      }
    }

    return true
  }, [stageFilter, taFilter, companyTierFilter, revenueTiers, growth, companySlugFilter, serviceFilter, agencyFilter, companies])

  const filtered = useMemo(() => {
    const result = data.rows.filter(r => passesFilters(r))
    return result
  }, [data.rows, passesFilters, companySlugFilter])

  // Save insights to companies handler
  const saveInsightsToCompanies = useCallback(() => {
    const byCompany: Map<string, { ww: Record<number, number>; us: Record<number, number>; brands: number }> = new Map()

    filtered.forEach(r => {
      const e = byCompany.get(r.slug) || { ww: {}, us: {}, brands: 0 }
      e.brands += 1
      data.years.forEach(y => {
        e.ww[y] = (e.ww[y] || 0) + (r.series[y] || 0)
        e.us[y] = (e.us[y] || 0) + (r.seriesUS[y] || 0)
      })
      byCompany.set(r.slug, e)
    })

    byCompany.forEach((v, slug) => {
      const lines = data.years
        .map(y => `${y}: WW ${fmtUSD(v.ww[y] || 0)}, US ${fmtUSD(v.us[y] || 0)}`)
        .join(' | ')
      addCompanyInsight(slug, `Analytics snapshot: ${v.brands} brands • ${lines}`)
    })
  }, [filtered, data.years, fmtUSD, addCompanyInsight])
  const tooManyResults = filtered.length > MAX_ANALYTICS_BRAND_VISUALS
  const shouldRenderResults = true // Always show results, but limit data processing

  const availableStages = useMemo(() => {
    const set = new Set<string>()
    data.rows.forEach(row => {
      if (passesFilters(row, { stageFilter: [] })) {
        if (row.stage) set.add(row.stage)
      }
    })
    stageFilter.forEach(v => v && set.add(v))
    return set
  }, [data.rows, passesFilters, stageFilter])

  const availableTAs = useMemo(() => {
    const set = new Set<string>()
    data.rows.forEach(row => {
      if (passesFilters(row, { taFilter: [] }) && row.ta) {
        set.add(row.ta)
      }
    })
    taFilter.forEach(v => v && set.add(v))
    return set
  }, [data.rows, passesFilters, taFilter])


  const availableRevenueTiers = useMemo(() => {
    const set = new Set<RevenueTier>()
    data.rows.forEach(row => {
      if (passesFilters(row, { revenueTiers: [] })) {
        Object.values(row.series).forEach(v => {
          set.add(getRevenueTier(v || 0))
        })
      }
    })
    revenueTiers.forEach(v => set.add(v))
    return set
  }, [data.rows, passesFilters, revenueTiers])

  const availableTrends = useMemo(() => {
    return {
      growing: data.rows.some(row => row.growing === true && passesFilters(row, { growth: 'any' })),
      shrinking: data.rows.some(row => row.growing === false && passesFilters(row, { growth: 'any' })),
    }
  }, [data.rows, passesFilters])

  const availableAgencies = useMemo(() => {
    const set = new Set<string>()
    data.rows.forEach(row => {
      const brand = companies[row.slug]?.brands?.find(b => b.id === row.brandId)
      const services = (brand?.services || {}) as Record<string, string | undefined>
      const values = Object.values(services)
      if (values.length === 0) {
        if (passesFilters(row, { agencyFilter: 'Unknown' })) {
          set.add('Unknown')
        }
      } else {
        values.forEach(v => {
          const normalized = v && v.trim().length > 0 ? v : 'Unknown'
          if (passesFilters(row, { agencyFilter: normalized })) {
            set.add(normalized)
          }
        })
      }
    })
    set.add('Unknown')
    return set
  }, [data.rows, passesFilters, companies])

  const availableServices = useMemo(() => {
    const set = new Set<string>()
    data.rows.forEach(row => {
      const brand = companies[row.slug]?.brands?.find(b => b.id === row.brandId)
      const services = (brand?.services || {}) as Record<string, string | undefined>
      Object.keys(services).forEach(service => {
        if (!service) return
        if (passesFilters(row, { serviceFilter: service })) {
          set.add(service)
        }
      })
    })
    if (serviceFilter) set.add(serviceFilter)
    return set
  }, [data.rows, passesFilters, companies, serviceFilter])
  const presentYear = useMemo(() => {
    if (data.years.length === 0) return new Date().getFullYear()
    const current = new Date().getFullYear()
    if (data.years.includes(current)) return current
    const next = data.years.find((y: number) => y > current)
    if (next) return next
    return data.years[data.years.length - 1]
  }, [data.years])

  // Lazy fee calculation cache - only calculate for filtered data
  const feeCalculationCache = useMemo(() => {
    const cache = new Map<string, number>()
    
    // Only calculate fees for brands that are actually being displayed
    filtered.forEach(row => {
      const brandKey = `${row.brandId}`
      
      // Calculate total fees for all services
      let totalFees = 0
      for (const service of SERVICE_CATEGORIES) {
        try {
          const revenue = row.series[presentYear] || 0
          if (revenue > 0) {
            const analysis = calculateServiceFeeAnalysis(row.brandId, service, revenue)
            totalFees += analysis.estimatedFee
          }
        } catch {
          // Skip services that don't have ratios defined
        }
      }
      cache.set(brandKey, totalFees)
      
      // Also cache individual service fees
      for (const service of SERVICE_CATEGORIES) {
        try {
          const revenue = row.series[presentYear] || 0
          if (revenue > 0) {
            const analysis = calculateServiceFeeAnalysis(row.brandId, service, revenue)
            cache.set(`${row.brandId}-${service}`, analysis.estimatedFee)
          }
        } catch {
          // Skip services that don't have ratios defined
        }
      }
    })
    
    return cache
  }, [filtered, presentYear, calculateServiceFeeAnalysis])

  // Helper function to get cached fee calculations
  const getBrandFees = useCallback((brand: any, revenue: number, serviceCategory?: string) => {
    if (revenue <= 0) return 0
    
    const brandKey = serviceCategory ? `${brand.brandId}-${serviceCategory}` : brand.brandId
    return feeCalculationCache.get(brandKey) || 0
  }, [feeCalculationCache])

  const availableTiers = useMemo(() => {
    const set = new Set<string>()
    data.rows.forEach(row => {
      const tier = data.companyTiers.get(row.slug) || 'ex-Tier 1'
      if (passesFilters(row, { companyTierFilter: [tier] })) {
        set.add(tier)
      }
    })
    return set
  }, [data.rows, data.companyTiers, passesFilters])

  const disabledStageOptions = useMemo(() => new Set((data.stageOptions || []).filter(opt => !availableStages.has(opt))), [data.stageOptions, availableStages])
  const disabledTaOptions = useMemo(() => new Set(data.taOptions.filter(opt => !availableTAs.has(opt))), [data.taOptions, availableTAs])
  const disabledTierOptions = useMemo(() => new Set(companyTierOptions.filter(opt => !availableTiers.has(opt))), [companyTierOptions, availableTiers])
  const disabledRevenueOptions = useMemo(() => new Set<string>(revenueTierOptions.filter(opt => !availableRevenueTiers.has(opt)).map(String)), [availableRevenueTiers])

  const clusterOptions = useMemo(() => {
    const opts: Array<{ id: string; label: string; predicate: (_item: typeof filtered[number]) => boolean }> = []
    const uniqueTA = new Set<string>()
    const uniqueStage = new Set<string>()
    filtered.forEach(r => {
      if (r.ta) uniqueTA.add(r.ta)
      if (r.stage) uniqueStage.add(r.stage)
    })
    Array.from(uniqueTA).sort().forEach(ta => {
      opts.push({ id: `ta:${ta}`, label: `Therapeutic Area: ${ta}`, predicate: row => row.ta === ta })
    })
    Array.from(uniqueStage).sort().forEach(stage => {
      opts.push({ id: `stage:${stage}`, label: `Stage: ${stage}`, predicate: row => row.stage === stage })
    })
    const hasGrowing = filtered.some(r => r.growing === true)
    const hasShrinking = filtered.some(r => r.growing === false)
    if (hasGrowing) {
      opts.push({ id: 'trend:growing', label: 'Trend: Growing', predicate: row => row.growing === true })
    }
    if (hasShrinking) {
      opts.push({ id: 'trend:shrinking', label: 'Trend: Shrinking', predicate: row => row.growing === false })
    }
    return opts
  }, [filtered])

  const clusterOptionMap = useMemo(() => {
    const map = new Map<string, { id: string; label: string; predicate: (_item: typeof filtered[number]) => boolean }>()
    clusterOptions.forEach(opt => map.set(opt.id, opt))
    return map
  }, [clusterOptions])

  React.useEffect(() => {
    setClusterTags(prev => prev.filter(tag => clusterOptionMap.has(tag)))
  }, [clusterOptionMap])


  const toggleClusterDimension = React.useCallback((prefix: string) => {
    const ids = clusterOptions.filter(opt => opt.id.startsWith(prefix)).map(opt => opt.id)
    if (ids.length === 0) return
    const hasAll = ids.every(id => clusterTags.includes(id))
    setClusterTags(prev => {
      const base = new Set(prev)
      if (hasAll) {
        ids.forEach(id => base.delete(id))
      } else {
        ids.forEach(id => base.add(id))
      }
      return Array.from(base)
    })
  }, [clusterOptions, clusterTags])

  const clusterDimensionActive = React.useCallback((prefix: string) => clusterTags.some(tag => tag.startsWith(prefix)), [clusterTags])

  const rowKey = (row: typeof filtered[number]) => `${row.brandId || row.brand}-${row.slug}`

  const renderBrandCard = (r: typeof filtered[number], slug: string, index: number, accentColor?: string) => {
    const brandMeta = companies[slug]?.brands?.find(b => b.id === r.brandId)
    const services = brandMeta?.services || {}
    const highlightKlick = serviceFilter
      ? (services as any)[serviceFilter] === 'Klick'
      : Object.values(services || {}).includes('Klick')
    const assignedAgencies = Array.from(new Set(Object.values(services || {}).filter(Boolean) as string[]))
    const logos = assignedAgencies
      .map(name => agencies.find(a => a.name === name))
      .filter((meta): meta is typeof agencies[number] => Boolean(meta?.logoUrl))

    return (
      <div
        key={r.brandId + String(index)}
        className={`border rounded p-3 text-sm transition-shadow ${highlightKlick ? 'bg-blue-50 border-blue-200 shadow-sm' : ''}`}
        style={accentColor ? { borderLeft: `4px solid ${accentColor}` } : undefined}
      >
        <div className="font-semibold truncate flex items-center gap-2">
          {accentColor && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accentColor }} />}
          <Link to={`/brand/${r.brandId}`} className="hover:underline text-primary">
            {r.brand}
            {r.indication ? ` — ${r.indication}` : ''}
          </Link>
        </div>
        <div className="mt-1 flex gap-2 items-center">
          {r.stage && <Badge className="text-[10px]">{r.stage}</Badge>}
          <span className="text-[11px] text-muted-foreground">{r.ta}</span>
        </div>
        {logos.length > 0 && (
          <div className="mt-1 flex gap-2 items-center">
            {logos.map(meta => (
              <img
                key={`${meta.name}-logo`}
                src={meta.logoUrl}
                alt={`${meta.name} logo`}
                className="h-6 w-6 rounded"
                title={meta.name}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
            ))}
          </div>
        )}
        <div className="text-[11px] text-muted-foreground">Trend: {r.growing === undefined ? '—' : (r.growing ? 'Growing' : 'Shrinking')}</div>
        <div className="h-28 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.years.map(y => ({ year: y, ww: r.series[y] || 0, us: r.seriesUS[y] || 0 }))} margin={{ top: 2, right: 10, left: -10, bottom: 0 }}>
              <XAxis dataKey="year" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} domain={[0, 'auto']} tickFormatter={(v)=>`${Math.round(Number(v)/1_000_000).toLocaleString()}M`} width={34} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v:any)=>fmtUSD(Number(v))} labelFormatter={(l:any)=>`Year: ${l}`} />
              <Line type="monotone" dataKey="ww" stroke="#1f77b4" dot={false} strokeWidth={1.5} />
              <Line type="monotone" dataKey="us" stroke="#ff7f0e" dot={false} strokeWidth={1.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  const currentFilterState = useMemo(() => ({
    stageFilter,
    taFilter,
    companyTierFilter,
    revenueTiers,
    growth,
    serviceFilter,
    agencyFilter,
    companySlugFilter,
    clusterTags,
    clusterBy: 'none',
  }), [stageFilter, taFilter, companyTierFilter, revenueTiers, growth, serviceFilter, agencyFilter, companySlugFilter, clusterTags])

  const renderStackedTooltip = useCallback(({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    
    // Find the entry that matches the currently hovered brand
    let hoveredEntry = null
    if (hoveredBrand) {
      hoveredEntry = payload.find((entry: any) => entry.dataKey === hoveredBrand)
    }
    
    // Fallback to first entry with value > 0 if no specific hover
    if (!hoveredEntry) {
      hoveredEntry = payload.find((entry: any) => entry.value > 0)
    }
    
    if (!hoveredEntry) return null
    
    const value = Number(hoveredEntry.value) || 0
    const total = payload.reduce((sum: number, entry: any) => sum + (Number(entry.value) || 0), 0)
    const percent = total > 0 ? (value / total) * 100 : 0
    
    return (
      <div className="rounded border bg-background/95 px-3 py-2 text-xs shadow-sm">
        <div className="font-medium">Year: {label}</div>
        <div className="mt-1 flex items-center gap-2" style={{ color: hoveredEntry.color }}>
          <span className="font-medium">{hoveredEntry.name}</span>
                <span className="text-foreground">{fmtUSD(value)}</span>
                <span className="text-muted-foreground">({percent.toFixed(1)}%)</span>
        </div>
        <div className="mt-1 text-muted-foreground">Total: {fmtUSD(total)}</div>
      </div>
    )
  }, [fmtUSD, hoveredBrand])

  // Collapsed tiers state
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [collapsedCompany, setCollapsedCompany] = useState<Record<string, boolean>>({})

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
      <Navigation />
    <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-end justify-between gap-6 mb-6">
            <div>
        <button
          type="button"
                className="text-primary underline mb-4 block"
          onClick={() => {
            if (typeof window !== 'undefined' && window.history.length > 1) navigate(-1)
            else navigate('/')
          }}
        >
                ← Back
        </button>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-3">
                Portfolio Analytics
              </h1>
              
              {/* Error Display */}
              {dataProcessingError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-medium">Data Processing Error</span>
                  </div>
                  <p className="mt-2 text-red-700">{dataProcessingError}</p>
                  <button
                    onClick={() => {
                      setDataProcessingError(null)
                      window.location.reload()
                    }}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Reload Page
                  </button>
                </div>
              )}
              <p className="text-lg text-muted-foreground font-light">
                Advanced portfolio analysis and market intelligence
              </p>
            </div>
          </div>
      </div>

        {/* Section Buttons */}
        <SectionButtons />
        
        {/* Test Company Navigation */}
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-sm font-semibold text-yellow-800 mb-2">Test Company Navigation</h3>
          <div className="flex gap-2 flex-wrap">
            {Object.values(companies).slice(0, 3).map(company => (
              <button
                key={company.slug}
                onClick={() => {
                  console.log('Testing navigation to:', company.slug)
                  navigate(`/company/${company.slug}`)
                }}
                className="px-3 py-1 bg-yellow-200 hover:bg-yellow-300 rounded text-sm"
              >
                Test: {company.name}
              </button>
            ))}
          </div>
        </div>

        {/* Insights Panel - Full Width Top */}
        <div className="mb-6">
          <InsightsPanel 
            companies={companies} 
            filteredBrands={filtered} 
            revenueType={revenueType} 
          />
        </div>

        {/* BigQuery Revenue Manager */}
        <div className="mb-6">
          <BigQueryRevenueManager 
            onRevenueDataLoaded={(data) => {
              console.log('BigQuery revenue data loaded:', data.length, 'records')
              // Here you could integrate the BigQuery data with your existing revenue data
            }}
          />
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Filters */}
          <div className="col-span-3 space-y-6">

      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            Analytics Filters
          </CardTitle>
          <p className="text-muted-foreground">Refine your analysis with advanced filtering options</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-6 flex-wrap items-end">
            <div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                className={`text-sm font-medium px-3 py-2 rounded-lg border-2 transition-all duration-200 ${
                  clusterDimensionActive('trend:') 
                    ? 'text-primary bg-blue-50 border-blue-300 shadow-md' 
                    : 'text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm'
                }`}
                  onClick={() => toggleClusterDimension('trend:')}
                >
                  Trend
                </button>
                <span className="text-[11px] text-muted-foreground">Click label to cluster by trend</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {(['any','growing','shrinking'] as const).map(t => {
                  const disabled = t !== 'any' && !availableTrends[t]
                  return (
                    <button
                      key={t}
                      disabled={disabled && growth !== t}
                      className={`text-sm border-2 rounded-xl px-4 py-2 font-medium transition-all duration-200 ${growth===t?'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-500 shadow-lg':'text-muted-foreground border-gray-200 hover:border-blue-300 hover:text-blue-600'} ${disabled && growth !== t ? 'opacity-40 cursor-not-allowed' : ''}`}
                      onClick={() => {
                        if (disabled && growth !== t) return
                        setGrowth(t)
                      }}
                    >
                      {t[0].toUpperCase()+t.slice(1)}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <PillGroup
            label={
              <button
                type="button"
                className={`text-sm font-medium px-3 py-2 rounded-lg border-2 transition-all duration-200 ${
                  clusterDimensionActive('stage:') 
                    ? 'text-primary bg-blue-50 border-blue-300 shadow-md' 
                    : 'text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm'
                }`}
                onClick={() => toggleClusterDimension('stage:')}
              >
                Stage
              </button>
            }
            options={data.stageOptions || []}
            value={stageFilter}
            onChange={setStageFilter}
            disabled={disabledStageOptions}
          />
          <PillGroup
            label={
              <button
                type="button"
                className={`text-sm font-medium px-3 py-2 rounded-lg border-2 transition-all duration-200 ${
                  clusterDimensionActive('ta:') 
                    ? 'text-primary bg-blue-50 border-blue-300 shadow-md' 
                    : 'text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm'
                }`}
                onClick={() => toggleClusterDimension('ta:')}
              >
                Therapeutic Areas
              </button>
            }
            options={data.taOptions}
            value={taFilter}
            onChange={setTaFilter}
            disabled={disabledTaOptions}
          />
          <PillGroup label="Company Tier" options={companyTierOptions} value={companyTierFilter} onChange={setCompanyTierFilter} disabled={disabledTierOptions} />
          {/* Company selector (single) */}
          <div className="min-w-[260px]">
            <div className="text-sm font-medium">Company</div>
            <div className="flex items-center gap-2">
              <input
                className="border rounded h-10 px-3 text-sm w-72"
                placeholder={companySlugFilter ? (Object.values(companies).find(c=>c.slug===companySlugFilter)?.name || 'Search company…') : 'Search company…'}
                value={companySearch}
                onChange={(e)=>setCompanySearch(e.target.value)}
              />
              {companySlugFilter && (
                <button className="text-xs border rounded px-2 h-8 text-muted-foreground" onClick={()=>{ setCompanySlugFilter(null); setCompanySearch('') }}>Clear</button>
              )}
            </div>
            {companySearch.trim().length > 0 && (
              <div className="mt-1 border rounded bg-background max-h-48 overflow-auto">
                {Object.values(companies)
                  .sort((a,b)=>a.name.localeCompare(b.name))
                  .filter(c => c.name.toLowerCase().includes(companySearch.toLowerCase()))
                  .slice(0, 25)
                  .map(c => (
                    <button
                      key={c.slug}
                      className={`block w-full text-left px-3 py-2 text-xs hover:bg-accent ${companySlugFilter===c.slug? 'bg-accent' : ''}`}
                      onClick={()=>{ 
                        console.log('🔍 Analytics: Company selected:', { name: c.name, slug: c.slug })
                        setCompanySlugFilter(c.slug); 
                        setCompanySearch(''); 
                        setTimeout(()=>document.getElementById('results-start')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0) 
                      }}
                    >
                      {c.name}
                    </button>
                  ))}
                {Object.values(companies).filter(c => c.name.toLowerCase().includes(companySearch.toLowerCase())).length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">No matches</div>
                )}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium">Revenue Tier</div>
              <div className="text-xs text-muted-foreground">(matches if a product hits the tier in any year)</div>
            </div>
            <div className="mt-1">
              <PillGroup label="" options={revenueTierOptions as unknown as string[]} value={revenueTiers as unknown as string[]} onChange={(v)=>setRevenueTiers(v as RevenueTier[])} disabled={disabledRevenueOptions} />
            </div>
          </div>
          {/* Service + Agency filters */}
          <div className="flex gap-4 flex-wrap items-center">
            <div>
              <div className="text-sm font-medium">Service</div>
              <div className="flex flex-wrap gap-2">
                {['AOR','DAOR','Market Access','MedComms','Media','Tech','Consulting'].map(s => {
                  const disabled = !availableServices.has(s) && serviceFilter !== s
                  return (
                    <button
                      key={s}
                      disabled={disabled}
                      className={`text-sm border-2 rounded-xl px-4 py-2 font-medium transition-all duration-200 ${serviceFilter===s?'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-500 shadow-lg':'text-muted-foreground border-gray-200 hover:border-green-300 hover:text-green-600'} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                      onClick={()=> {
                        if (disabled) return
                        setServiceFilter(serviceFilter===s ? null : s)
                      }}
                    >
                      {s}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Agency</div>
              <div className="flex flex-wrap gap-2">
                {(['Unknown', ...agencies.map(a=>a.name)] as string[]).map(a => {
                  const disabled = !availableAgencies.has(a) && agencyFilter !== a
                  return (
                    <button
                      key={a}
                      disabled={disabled}
                      className={`text-sm border-2 rounded-xl px-4 py-2 font-medium transition-all duration-200 ${agencyFilter===a?'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-500 shadow-lg':'text-muted-foreground border-gray-200 hover:border-orange-300 hover:text-orange-600'} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                      onClick={()=> {
                        if (disabled) return
                        setAgencyFilter(agencyFilter===a ? null : a)
                      }}
                    >
                      {a}
                    </button>
                  )
                })}
              </div>
              <div className="text-xs text-muted-foreground">Service filter only applies when agency is selected.</div>
            </div>
          </div>
        </CardContent>
      </Card>
          </div>

          {/* Main Content Area - Full Width */}
          <div className="col-span-9 space-y-6">
      {/* Enhanced Filter Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              Filter Summary
              <div className="flex gap-2">
                <button
                  onClick={() => setRevenueType('ww')}
                  className={`px-3 py-1 text-xs rounded-full border ${
                    revenueType === 'ww' ? 'bg-blue-100 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-600'
                  }`}
                >
                  WW
                </button>
                <button
                  onClick={() => setRevenueType('us')}
                  className={`px-3 py-1 text-xs rounded-full border ${
                    revenueType === 'us' ? 'bg-red-100 border-red-300 text-red-700' : 'border-gray-300 text-gray-600'
                  }`}
                >
                  US
                </button>
              </div>
            </CardTitle>
          </div>
        </CardHeader>
        
        {/* Applied Filters Display */}
        <div className="px-6 pb-2">
          <div className="flex flex-wrap gap-2 text-xs">
            {companySlugFilter && (
              <Badge variant="secondary" className="text-xs">
                Company: {companies[companySlugFilter]?.name || companySlugFilter}
              </Badge>
            )}
            {companyTierFilter.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                Tiers: {companyTierFilter.join(', ')}
              </Badge>
            )}
            {stageFilter.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                Stages: {stageFilter.join(', ')}
              </Badge>
            )}
            {taFilter.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                Therapeutic Areas: {taFilter.join(', ')}
              </Badge>
            )}
            {serviceFilter && (
              <Badge variant="secondary" className="text-xs">
                Service: {serviceFilter}
              </Badge>
            )}
            {agencyFilter && (
              <Badge variant="secondary" className="text-xs">
                Agency: <Link to="/agencies" className="underline ml-1">{agencyFilter}</Link>
              </Badge>
            )}
            {revenueTiers.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                Revenue: {revenueTiers.join(', ')}
              </Badge>
            )}
            {growth !== 'any' && (
              <Badge variant="secondary" className="text-xs">
                Growth: {growth === 'growing' ? 'Growing' : 'Shrinking'}
              </Badge>
            )}
          </div>
        </div>
        
        <CardContent className="text-sm">
          <div className="flex flex-wrap gap-3 items-center mb-4">
            <span>Brands: <span className="font-medium">{filtered.length}</span></span>
          </div>
          
          {/* Therapeutic Area Matrix */}
          <div className="mb-4">
            <h4 className="font-semibold mb-2">
              Revenue by Therapeutic Area & Year
            </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2 text-left bg-gray-50">Year</th>
                    {data.taOptions.map(ta => (
                      <th key={ta} className="border p-2 text-center bg-gray-50 min-w-[80px]">{ta}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.years.map(year => (
                    <tr key={year}>
                      <td className="border p-2 font-medium bg-gray-50">{year}</td>
                      {data.taOptions.map(ta => {
                        const taBrands = filtered.filter(r => r.ta === ta)
                        const yearValue = taBrands.reduce((sum, r) => {
                          return revenueType === 'ww' ? sum + (r.series[year] || 0) : sum + (r.seriesUS[year] || 0)
                        }, 0)
                        const totalYearValue = filtered.reduce((sum, r) => {
                          return revenueType === 'ww' ? sum + (r.series[year] || 0) : sum + (r.seriesUS[year] || 0)
                        }, 0)
                        const percentage = totalYearValue > 0 ? (yearValue / totalYearValue) * 100 : 0
                        
                        // Color coding based on revenue amount - new scheme
                        const getCellColor = (value: number) => {
                          if (value >= 5_000_000_000) return 'bg-green-800 hover:bg-green-900 text-white' // 5B+ - Dark Green
                          if (value >= 3_000_000_000) return 'bg-green-600 hover:bg-green-700 text-white' // 3-5B - Green
                          if (value >= 1_000_000_000) return 'bg-green-400 hover:bg-green-500 text-white' // 1-3B - Light Green
                          if (value >= 500_000_000) return 'bg-orange-400 hover:bg-orange-500 text-white' // 500M-1B - Orange
                          return 'bg-gray-100 hover:bg-gray-200 text-black' // Under 500M - Light Grey
                        }
                        
                        return (
                          <td 
                            key={ta} 
                            className={`border p-2 text-center cursor-pointer ${getCellColor(yearValue)}`}
                            onClick={() => setExpandedCell(expandedCell?.year === year && expandedCell?.ta === ta ? null : { year, ta })}
                          >
                            <div className="font-medium">
                              {fmtRevenueInBillions(yearValue)}
                            </div>
                            <div className="text-gray-500">({percentage.toFixed(1)}%)</div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
          </div>

          {/* Service vs Therapeutic Area Matrix */}
          <div className="mb-4">
            <h4 className="font-semibold mb-2">Potential Fees by Service & Therapeutic Area</h4>
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <div className="text-center">
                  <p>No data available for fee calculations</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 text-left bg-gray-50">Service</th>
                      {data.taOptions.map(ta => (
                        <th key={ta} className="border p-2 text-center bg-gray-50 min-w-[80px]">{ta}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SERVICE_CATEGORIES.map(service => (
                      <tr key={service}>
                        <td className="border p-2 font-medium bg-gray-50">{service}</td>
                        {data.taOptions.map(ta => {
                          const taBrands = filtered.filter(r => r.ta === ta)
                          const serviceFees = taBrands.reduce((sum, r) => {
                            const revenue = r.series[presentYear] || 0
                            return sum + getBrandFees(r, revenue, service)
                          }, 0)
                          const totalServiceFees = filtered.reduce((sum, r) => {
                            const revenue = r.series[presentYear] || 0
                            return sum + getBrandFees(r, revenue, service)
                          }, 0)
                          const percentage = totalServiceFees > 0 ? (serviceFees / totalServiceFees) * 100 : 0
                          
                          // Color coding for fees
                          const getCellColor = (value: number) => {
                            if (value >= 50_000_000) return 'bg-green-100 hover:bg-green-200' // Over 50M - Green
                            if (value >= 25_000_000) return 'bg-yellow-100 hover:bg-yellow-200' // 25M-50M - Yellow
                            return 'bg-white hover:bg-gray-50' // Under 25M - White
                          }
                          
                          return (
                            <td 
                              key={ta} 
                              className={`border p-2 text-center cursor-pointer ${getCellColor(serviceFees)}`}
                            >
                              <div className="font-medium">{fmtFeeInThousands(serviceFees)}</div>
                              <div className="text-gray-500">({percentage.toFixed(1)}%)</div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Expanded Cell Details */}
          {expandedCell && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h5 className="font-semibold text-lg">
                  {expandedCell.ta} - {expandedCell.year} Service Matrix
                </h5>
            <button
                  onClick={() => setShowContractManager(!showContractManager)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  {showContractManager ? 'Hide' : 'Show'} Contract Manager
                </button>
              </div>
              
              {/* Contract Manager */}
              {showContractManager && (() => {
                const firstBrand = filtered.find((r: any) => r.ta === expandedCell.ta)
                if (!firstBrand) return null
                
                const company = companies[firstBrand.slug]
                const taBrands = filtered
                  .filter((r: any) => r.ta === expandedCell.ta)
                  .map((brand: any) => ({
                    id: brand.brandId,
                    name: brand.brand,
                    therapeuticArea: brand.ta
                  }))
                
                return (
                  <div className="mb-4">
                    <ContractManager 
                      companySlug={firstBrand.slug}
                      companyName={company?.name || firstBrand.company}
                      brands={taBrands}
                      therapeuticAreas={data.taOptions}
                    />
                  </div>
                )
              })()}

              {/* Service Matrix */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 text-left bg-gray-50 font-semibold">Brand</th>
                      <th className="border p-2 text-center bg-gray-50 font-semibold">Revenue</th>
                      <th className="border p-2 text-center bg-gray-50 font-semibold">%</th>
                      <th className="border p-2 text-center bg-gray-50 font-semibold">Status</th>
                      <th className="border p-2 text-center bg-gray-50 font-semibold">AOR</th>
                      <th className="border p-2 text-center bg-gray-50 font-semibold">DAOR</th>
                      <th className="border p-2 text-center bg-gray-50 font-semibold">Market Access</th>
                      <th className="border p-2 text-center bg-gray-50 font-semibold">MedComms</th>
                      <th className="border p-2 text-center bg-gray-50 font-semibold">Media</th>
                      <th className="border p-2 text-center bg-gray-50 font-semibold">Tech</th>
                      <th className="border p-2 text-center bg-gray-50 font-semibold">Consulting</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered
                      .filter((r: any) => r.ta === expandedCell.ta)
                      .map((brand: any) => {
                        const brandRevenue = revenueType === 'ww' 
                          ? (brand.series[expandedCell.year] || 0)
                          : (brand.seriesUS[expandedCell.year] || 0)
                                      
                                      const totalRevenue = filtered.reduce((sum: any, r: any) => {
                                        return revenueType === 'ww' ? sum + (r.series[expandedCell.year] || 0) : sum + (r.seriesUS[expandedCell.year] || 0)
                                      }, 0)
                                      
                                      const brandPercentage = totalRevenue > 0 ? (brandRevenue / totalRevenue) * 100 : 0
                                      
                                      // Get agency information for this brand
                                      const company = companies[brand.slug]
                                      const brandData = company?.brands.find(b => b.id === brand.brandId)
                                      const services = brandData?.services || {}
                                      const hasAgency = Object.values(services).some(agency => agency && agency.trim() !== '')
                                      const isBlocked = hasAgency && Object.values(services).some(agency => agency && agency !== 'Klick')
                                      
                                      const getServiceCellColor = (agency: string) => {
                                        if (!agency) return 'bg-gray-100'
                                        if (agency === 'Klick') return 'bg-green-100'
                                        return 'bg-red-100'
                                      }
                                      
                                      const getServiceTextColor = (agency: string) => {
                                        if (!agency) return 'text-gray-600'
                                        if (agency === 'Klick') return 'text-green-700'
                                        return 'text-red-700'
                                      }
                                      
                                      return (
                                        <tr key={brand.brandId} className={`${
                                          isBlocked ? 'bg-red-50' : hasAgency ? 'bg-green-50' : 'bg-white'
                                        }`}>
                                          <td className="border p-2 font-medium">
                                            <div className="flex flex-col">
                                              <span>{brand.brand}</span>
                                              <span className="text-xs text-gray-500">{brand.company}</span>
                                            </div>
                                          </td>
                                          <td className="border p-2 text-center font-medium">
                                            {fmtRevenueInBillions(brandRevenue)}
                                          </td>
                                          <td className="border p-2 text-center text-gray-600">
                                            {brandPercentage.toFixed(1)}%
                                          </td>
                                          <td className="border p-2 text-center">
                                            <span className={`px-2 py-1 rounded text-xs ${
                                              isBlocked ? 'bg-red-100 text-red-700' : 
                                              hasAgency ? 'bg-green-100 text-green-700' : 
                                              'bg-gray-100 text-gray-600'
                                            }`}>
                                              {isBlocked ? '🔒 Blocked' : hasAgency ? '✅ Available' : '⚪ Open'}
                                            </span>
                                          </td>
                                          {['AOR', 'DAOR', 'Market Access', 'MedComms', 'Media', 'Tech', 'Consulting'].map(service => {
                                            const agency = services[service as keyof typeof services] || ''
                                            return (
                                              <td key={service} className={`border p-2 text-center ${getServiceCellColor(agency)}`}>
                                                <span className={`text-xs font-medium ${getServiceTextColor(agency)}`}>
                                                  {agency || 'Open'}
                                                </span>
                                              </td>
                                            )
                                          })}
                                        </tr>
                                      )
                                    })}
                                </tbody>
                              </table>
                            </div>
                            
                            {/* Legend */}
                            <div className="mt-4 flex flex-wrap gap-4 text-xs">
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                                <span>Klick</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                                <span>Competitor</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
                                <span>Open</span>
                              </div>
                            </div>
                          </div>
                        )}

        <div className="mt-4 flex gap-2">
            <button
              className="h-9 px-3 rounded-md border text-sm"
              onClick={saveInsightsToCompanies}
            >
              Save Insight to Companies
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Loading Indicator */}


      {/* Performance Warning - Show automatically when too many results */}
      {tooManyResults && (
        <Card className="border-yellow-500 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Performance Notice</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-yellow-700">
            <p>We found {filtered.length.toLocaleString()} brands. For better performance, consider refining your filters (company, stage, therapeutic area, revenue tier, etc.) to view a smaller subset.</p>
            <p>Charts and graphs are still displayed but may load slowly with this many results.</p>
          </CardContent>
        </Card>
      )}



      <div id="results-start"></div>
      {shouldRenderResults && companyTierOptions.length > 0 ? companyTierOptions.map(tierName => {
        // Early exit: Get companies for this tier from index
        const tierCompanyIds = tierIndex.byTier.get(tierName) ?? []
        if (!tierCompanyIds.length) return null // Early exit - no companies in this tier
        
        // Apply company filter if active
        const filteredCompanyIds = companySlugFilter 
          ? tierCompanyIds.filter(id => id === companySlugFilter)
          : tierCompanyIds
        
        if (!filteredCompanyIds.length) return null // Early exit - no companies after filtering
        
        // Get rows for this tier from index and apply filters
        const tierRows: any[] = []
        for (const cid of filteredCompanyIds) {
          const companyRows = tierIndex.byCompanyId.get(cid)
          if (companyRows) {
            // Apply all filters to company rows
            const filteredCompanyRows = companyRows.filter(row => passesFilters(row))
            tierRows.push(...filteredCompanyRows)
          }
        }
        
        // If no data rows but we have companies, show a message instead of skipping
        if (tierRows.length === 0) {
                return (
            <div key={tierName} className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">{tierName}</h3>
                <SectionButtons showCollapseTier={false} />
                  </div>
              <div className="text-center py-8 text-muted-foreground">
                <p>Companies found in this tier: {filteredCompanyIds.length}</p>
                <p className="text-sm">No revenue data available for charting</p>
                <div className="mt-4">
                  <p className="text-sm font-semibold">Companies in this tier:</p>
                  <div className="flex flex-wrap gap-2 mt-2 justify-center">
                    {filteredCompanyIds.map((companyId: any) => {
                      const company = companies[companyId]
                      return company ? (
                        <span key={company.slug} className="px-2 py-1 bg-gray-100 rounded text-xs">
                          {company.name}
                        </span>
                      ) : null
              })}
            </div>
      </div>

                {/* Test Chart - Always show a simple chart to verify Recharts works */}
                <div className="mt-6">
                  <h4 className="text-lg font-semibold mb-4">Test Chart (Verifying Recharts)</h4>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={[
                        { name: 'Test 1', value: 100 },
                        { name: 'Test 2', value: 200 },
                        { name: 'Test 3', value: 150 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">If you see this chart, Recharts is working. If not, there's a rendering issue.</p>
                </div>
              </div>
            </div>
          )
        }
        const isCollapsed = !!collapsed[tierName]
        
        // Show charts by default - removed the expand/collapse logic for better UX
        
        // Build chart dataset and colors - limit for performance
        const companyEntries = Array.from(new Map(tierRows.map(r => [r.slug, { slug: r.slug, company: r.company }])).values()).slice(0, 25)
        const colors = CHART_COLORS
        const companyColorMap = new Map<string, string>()
        companyEntries.forEach((entry, idx) => {
          companyColorMap.set(entry.slug, colors[idx % colors.length])
        })
        
      // Create brand-stacked chart data - limit for performance (reduced from 100 to 25)
      const brandEntries = Array.from(
        new Map(
          tierRows.map(row => [sanitizeKey(row.brandId || `${row.slug}-${row.brand}`), row])
        ).values()
      ).slice(0, 25)
      
      // console.log('🔍 Analytics: Chart data for tier', tierName, {
      //   tierCompanies: tierCompanies.length,
      //   rows: rows.length,
      //   finalRows: finalRows.length,
      //   brandEntries: brandEntries.length,
      //   years: data.years.length,
      //   companyEntries: companyEntries.length
      // })
      
      // If no brand entries, show a message instead of empty chart
      if (brandEntries.length === 0) {
        return (
          <div key={tierName} className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{tierName}</h3>
              <SectionButtons showCollapseTier={false} />
            </div>
            <div className="text-center py-8 text-muted-foreground">
              <p>No revenue data available for companies in this tier</p>
              <p className="text-sm">Companies exist but no reporting data found</p>
              <p className="text-sm mt-2">Debug: companies={filteredCompanyIds.length}, rows={tierRows.length}</p>
            </div>
          </div>
        )
      }
      
      const chartData = data.years.map(y => {
        const obj: Record<string, number | string> = { year: y }
        brandEntries.forEach(entryRow => {
          const key = sanitizeKey(entryRow.brandId || `${entryRow.slug}-${entryRow.brand}`)
          obj[key] = entryRow.series[y] || 0
        })
        return obj
      })
      const latestYear = data.years[data.years.length - 1]
      const latestTotals = tierRows.reduce((acc, row) => ({
        ww: acc.ww + (row.series[latestYear] || 0),
        us: acc.us + (row.seriesUS[latestYear] || 0),
      }), { ww: 0, us: 0 })
      const currentTotals = tierRows.reduce((acc, row) => ({
        ww: acc.ww + (row.series[presentYear] || 0),
        us: acc.us + (row.seriesUS[presentYear] || 0),
      }), { ww: 0, us: 0 })
      return (
        <Card key={tierName}>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle>{tierName}</CardTitle>
                <div className="text-xs text-muted-foreground">
                  {filteredCompanyIds.length} total companies • {tierRows.length} brands with reporting data
                </div>
                {tierRows.length > 0 && (
                  <>
                <div className="text-xs text-muted-foreground">Current {presentYear}: WW {fmtUSD(currentTotals.ww)} • US {fmtUSD(currentTotals.us)}</div>
                <div className="text-xs text-muted-foreground">Latest {latestYear}: WW {fmtUSD(latestTotals.ww)} • US {fmtUSD(latestTotals.us)}</div>
                  </>
                )}
                {tierRows.length === 0 && (
                  <div className="text-xs text-muted-foreground italic">No reporting data available for brands in this tier</div>
                )}
              </div>
              <div className="flex gap-2">
                <button className="text-sm underline" onClick={()=>setCollapsed(prev=>({ ...prev, [tierName]: !prev[tierName] }))}>{isCollapsed? 'Expand Tier' : 'Collapse Tier'}</button>
                <button className="text-sm underline" onClick={()=>{
                  const companySlugs = new Set(tierRows.map((r: any)=>r.slug))
                  setCollapsedCompany(prev=>{
                    const copy = { ...prev }
                    companySlugs.forEach(s => { copy[`${tierName}:${s}`] = true })
                    return copy
                  })
                }}>Collapse Companies</button>
                <button className="text-sm underline" onClick={()=>{
                  const companySlugs = new Set(tierRows.map((r: any)=>r.slug))
                  setCollapsedCompany(prev=>{
                    const copy = { ...prev }
                    companySlugs.forEach(s => copy[`${tierName}:${s}`] = false)
                      return copy
                    })
                  }}>Expand Companies</button>
                </div>
              </div>
            </CardHeader>
            {!isCollapsed && (
              <CardContent>
                <div className="h-72 mb-4">
                  {(() => {
                    try {
                      if (brandEntries.length === 0) {
                        return (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            <div className="text-center">
                              <p>No revenue data available for charting</p>
                              <p className="text-sm">Companies: {filteredCompanyIds.length}</p>
                            </div>
                          </div>
                        )
                      }
                      
                      return (
                        <div className="space-y-4">
                          {/* Stacked Bar Chart */}
                          <div>
                            <h4 className="text-lg font-semibold mb-2">Revenue by Year (Stacked by Brand)</h4>
                            <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis allowDecimals={false} domain={[0, 'auto']} tickFormatter={(v)=>`${Math.round(Number(v)/1_000_000).toLocaleString()}M`} />
                      <Tooltip content={renderStackedTooltip} labelFormatter={(label: any) => `Year: ${label}`} />
                                {brandEntries.map((entryRow: any, idx: any) => {
                                  const key = sanitizeKey(entryRow.brandId || `${entryRow.slug}-${entryRow.brand}`)
                                  const isHovered = hoveredBrand === key
                                  const baseColor = colors[idx % colors.length]
                                  
                                  return (
                                  <Bar
                                      key={key}
                                      dataKey={key}
                          stackId="ww"
                                      name={entryRow.brand}
                          cursor="pointer"
                                      fill={baseColor}
                                      stroke={isHovered ? "black" : "none"}
                                      strokeWidth={isHovered ? 2 : 0}
                                      onMouseEnter={() => setHoveredBrand(key)}
                                      onMouseLeave={() => setHoveredBrand(null)}
                                      onClick={() => entryRow.brandId ? navigate(`/brand/${entryRow.brandId}`) : navigate(`/company/${entryRow.slug}`, { state: { analyticsFilters: currentFilterState } })}
                                  />
                                  )
                                })}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                        </div>
                      )
                    } catch (error) {
                      console.error('❌ Chart rendering error for tier', tierName, ':', error)
                    return (
                        <div className="flex items-center justify-center h-full text-red-600">
                          <div className="text-center">
                            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                            <p>Chart rendering error</p>
                            <p className="text-sm text-muted-foreground">Check console for details</p>
                            <p className="text-xs text-muted-foreground mt-2">Error: {error instanceof Error ? error.message : String(error)}</p>
                          </div>
                        </div>
                      )
                    }
                  })()}
                </div>
                
                {/* Group by company and make groups collapsible - show ALL companies in tier */}
                {filteredCompanyIds.map((companyId: any) => {
                  const company = companies[companyId]
                  if (!company) return null
                  const slug = company.slug
                  const companyName = company.name
                  const companyRows = tierRows.filter((r: any)=>r.slug===slug)
                  const key = `${tierName}:${slug}`
                  const isCCollapsed = !!collapsedCompany[key]
                  const companyAccent = companyColorMap.get(slug)
                  const hasReportingData = companyRows.length > 0
                  
                  return (
                    <div key={key} className="border rounded mb-4" style={companyAccent ? { borderLeft: `4px solid ${companyAccent}` } : undefined}>
                      <div className="flex items-center justify-between p-2 bg-muted/50">
                        <div>
                          <div className="flex items-center gap-2 text-sm font-medium">
                            {companyAccent && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: companyAccent }} />}
                            <Link to={`/company/${slug}`} className="underline">{companyName}</Link>
                            <span className="text-muted-foreground">
                              ({company.brands.length} total brands{hasReportingData ? ` • ${companyRows.length} with reporting data` : ' • no reporting data'})
                            </span>
                          </div>
                          {isCCollapsed && (
                            <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                              {hasReportingData ? (
                                data.years.map(y => {
                                const rev = companyRows.reduce((s,r)=>s+(r.series[y]||0),0)
                                const inMarket = companyRows.filter(r => (r.series[y]||0) > 0).length
                                const launches = companyRows.filter(r => {
                                  const prev = r.series[y-1]||0
                                  return (r.series[y]||0) > 0 && (!prev || prev===0)
                                }).length
                                return (
                                  <div key={y} className="border rounded px-2 py-1">
                                    <span className="font-semibold mr-1">{y}</span>
                                    <span>{fmtUSD(rev)}</span>
                                    <span className="ml-2">{inMarket} in market</span>
                                    <span className="ml-2">{launches} launches</span>
                                  </div>
                                )
                                })
                              ) : (
                                <div className="border rounded px-2 py-1 italic">
                                  No reporting data available
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <button className="text-sm underline" onClick={()=>setCollapsedCompany(prev=>({ ...prev, [key]: !prev[key] }))}>{isCCollapsed? 'Expand' : 'Collapse'}</button>
                      </div>
                      {!isCCollapsed && (
                        <div className="p-3 space-y-4">
                          {hasReportingData ? (
                            <>
                          {clusterTags.length === 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {companyRows.map((r,i) => renderBrandCard(r, slug, i, companyAccent))}
                            </div>
                          )}
                            </>
                          ) : (
                            <div className="p-4 text-center text-muted-foreground">
                              <div className="text-sm font-medium mb-2">No Reporting Data Available</div>
                              <div className="text-xs">
                                This company has {company.brands.length} brands but no revenue reporting data.
                                <br />
                                Brands: {company.brands.map(b => b.name).join(', ')}
                              </div>
                            </div>
                          )}
                          {hasReportingData && clusterTags.length > 0 && (
                            <>
                              <div className="mt-6 mb-4">
                                <h4 className="text-lg font-semibold">Brand Clusters by Therapeutic Area</h4>
                                <p className="text-sm text-muted-foreground">Revenue breakdown by therapeutic area clusters</p>
                              </div>
                              {(() => {
                            const seen = new Set<string>()
                            const groups = clusterTags
                              .map(tag => {
                                const opt = clusterOptionMap.get(tag)
                                if (!opt) return null
                                const matches = companyRows.filter(row => opt.predicate(row))
                                matches.forEach(row => seen.add(rowKey(row)))
                                if (matches.length === 0) return null
                                return { opt, matches, isOther: false }
                              })
                              .filter(Boolean) as Array<{ opt: { id: string; label: string }; matches: typeof companyRows; isOther: boolean }>

                            const leftovers = companyRows.filter(row => !seen.has(rowKey(row)))
                            if (leftovers.length > 0) {
                              groups.push({ opt: { id: '__other', label: 'Other Brands' }, matches: leftovers, isOther: true })
                            }

                            const companyCurrentTotals = companyRows.reduce((acc, row) => {
                              acc.ww += row.series[presentYear] || 0
                              acc.us += row.seriesUS[presentYear] || 0
                              return acc
                            }, { ww: 0, us: 0 })
                            const companyLatestTotals = companyRows.reduce((acc, row) => {
                              const latestYear = data.years[data.years.length - 1]
                              acc.ww += row.series[latestYear] || 0
                              acc.us += row.seriesUS[latestYear] || 0
                              return acc
                            }, { ww: 0, us: 0 })

                            return (
                              <>
                                {groups.map((group, groupIdx) => {
                                  const colors = CHART_COLORS
                                  const brandEntries = Array.from(
                                    new Map(
                                      group.matches.map(row => [row.brandId || `${row.slug}-${row.brand}`, row])
                                    ).values()
                                  )
                                  const chartData = data.years.map(y => {
                                    const obj: Record<string, number | string> = { year: y }
                                    brandEntries.forEach(entryRow => {
                                      const key = sanitizeKey(entryRow.brandId || `${entryRow.slug}-${entryRow.brand}`)
                                      obj[key] = entryRow.series[y] || 0
                                    })
                                    return obj
                                  })
                                  const latestYear = data.years[data.years.length - 1]
                                  const latestTotals = group.matches.reduce((acc, row) => {
                                    acc.ww += row.series[latestYear] || 0
                                    acc.us += row.seriesUS[latestYear] || 0
                                    return acc
                                  }, { ww: 0, us: 0 })
                                  const currentTotals = group.matches.reduce((acc, row) => {
                                    acc.ww += row.series[presentYear] || 0
                                    acc.us += row.seriesUS[presentYear] || 0
                                    return acc
                                  }, { ww: 0, us: 0 })
                                  const labelSuffix = group.opt.label.includes(':') ? group.opt.label.split(':').pop()?.trim() || group.opt.label : group.opt.label
                                  const clusterTitle = group.isOther ? `${companyName} — Other Brands` : `${companyName} — ${labelSuffix}`
                                  const percentWW = companyCurrentTotals.ww > 0 ? (currentTotals.ww / companyCurrentTotals.ww) * 100 : 0
                                  const percentUS = companyCurrentTotals.us > 0 ? (currentTotals.us / companyCurrentTotals.us) * 100 : 0
                                  const latestPercentWW = companyLatestTotals.ww > 0 ? (latestTotals.ww / companyLatestTotals.ww) * 100 : 0
                                  const latestPercentUS = companyLatestTotals.us > 0 ? (latestTotals.us / companyLatestTotals.us) * 100 : 0
                                  return (
                                    <div
                                      key={group.opt.id + String(groupIdx)}
                                      className={`rounded-lg border-2 ${group.isOther ? 'border-dashed border-muted' : 'border-primary/60 bg-primary/5'} p-4 space-y-3 mb-6`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <div className="text-sm font-semibold">{clusterTitle}</div>
                                          <div className="text-xs text-muted-foreground">{group.matches.length} brands in this cluster</div>
                                          <div className="text-xs text-muted-foreground">Current {presentYear}: WW {fmtUSD(currentTotals.ww)} ({percentWW.toFixed(1)}%) • US {fmtUSD(currentTotals.us)} ({percentUS.toFixed(1)}%)</div>
                                          <div className="text-xs text-muted-foreground">Latest {latestYear}: WW {fmtUSD(latestTotals.ww)} ({latestPercentWW.toFixed(1)}%) • US {fmtUSD(latestTotals.us)} ({latestPercentUS.toFixed(1)}%)</div>
                                        </div>
                                      </div>
                                     <div className="h-48">
                                       <ResponsiveContainer width="100%" height={200}>
                                         <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                           <CartesianGrid strokeDasharray="3 3" />
                                           <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                                            <YAxis allowDecimals={false} domain={[0, 'auto']} tickFormatter={(v)=>`${Math.round(Number(v)/1_000_000).toLocaleString()}M`} tick={{ fontSize: 10 }} />
                                            <Tooltip content={renderStackedTooltip} labelFormatter={(label: any) => `Year: ${label}`} />
                                            {brandEntries.map((entryRow: any, idx: any) => {
                                              const key = sanitizeKey(entryRow.brandId || `${entryRow.slug}-${entryRow.brand}`)
                                              const isHovered = hoveredBrand === key
                                              const baseColor = colors[idx % colors.length]
                                              
                                              return (
                                                <Bar
                                                  key={key}
                                                  dataKey={key}
                                                  stackId="cluster"
                                                  name={entryRow.brand}
                                                  cursor="pointer"
                                                  fill={baseColor}
                                                  stroke={isHovered ? "black" : "none"}
                                                  strokeWidth={isHovered ? 2 : 0}
                                                  onMouseEnter={() => setHoveredBrand(key)}
                                                  onMouseLeave={() => setHoveredBrand(null)}
                                                  onClick={() => entryRow.brandId ? navigate(`/brand/${entryRow.brandId}`) : navigate(`/company/${entryRow.slug}`, { state: { analyticsFilters: currentFilterState } })}
                                                />
                                              )
                                            })}
                                          </BarChart>
                                        </ResponsiveContainer>
                                      </div>
                                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {group.matches.map((row, idx) => renderBrandCard(row, slug, idx, colors[idx % colors.length]))}
                                      </div>
                                    </div>
                                  )
                                })}
                              </>
                            )
                          })()}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            )}
          </Card>
        )
      }) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>No charts to display</p>
          <p className="text-sm">shouldRenderResults: {String(shouldRenderResults)}</p>
          <p className="text-sm">companyTierOptions: {companyTierOptions.length} tiers</p>
    </div>
      )}
    </div>
        </div>
      </div>

      {/* Dataset Overview - Moved to bottom */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-slate-100">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            Dataset Overview
          </CardTitle>
          <p className="text-muted-foreground">Complete dataset structure showing all companies and brands loaded into the system</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center p-6 bg-white rounded-2xl shadow-lg border-2 border-blue-200">
              <div className="text-4xl font-bold text-blue-600 mb-2">{Object.keys(companies).length}</div>
              <div className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Total Companies</div>
            </div>
            <div className="text-center p-6 bg-white rounded-2xl shadow-lg border-2 border-purple-200">
              <div className="text-4xl font-bold text-purple-600 mb-2">{Object.values(companies).reduce((sum, c) => sum + c.brands.length, 0)}</div>
              <div className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Total Brands</div>
            </div>
            <div className="text-center p-6 bg-white rounded-2xl shadow-lg border-2 border-green-200">
              <div className="text-4xl font-bold text-green-600 mb-2">{Object.values(companies).reduce((sum, c) => sum + c.revenueRows.length, 0)}</div>
              <div className="text-sm font-semibold text-green-700 uppercase tracking-wide">Revenue Data Points</div>
            </div>
          </div>
          
          {/* Show tier distribution - companies only */}
          <div className="mt-4">
            <div className="text-sm font-medium mb-2">Company Distribution by Tier</div>
            <div className="flex flex-wrap gap-2">
              {companyTierOptions.map(tier => {
                const tierCompanyCount = Object.values(companies).filter(c => {
                  const companyTier = data.companyTiers.get(c.slug) || 'ex-Tier 1'
                  return companyTier === tier
                }).length
                return (
                  <div key={tier} className="border rounded px-3 py-2 text-sm">
                    <div className="font-medium">{tier}</div>
                    <div className="text-xs text-muted-foreground">{tierCompanyCount} companies</div>
                  </div>
        )
      })}
    </div>
            <div className="mt-2 text-xs text-muted-foreground italic">
              Totals reflect company classifications; brand counts intentionally omitted.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </ErrorBoundary>
  )
}
