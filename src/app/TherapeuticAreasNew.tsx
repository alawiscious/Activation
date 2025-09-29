import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { usePharmaVisualPivotStore } from '@/data/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  Target,
  Building2,
  Filter,
  Globe,
  MapPin,
  TrendingUp,
  TrendingDown,
  Star,
  Activity
} from 'lucide-react'
import { Navigation } from '@/components/Shared/Navigation'

type RevenueTier = '0-100M' | '100-500M' | '500M-1B' | '1B+'

const ANALYTICS_FILTER_STORAGE_KEY = 'therapeutic-areas-filters'

const getCellColor = (value: number) => {
  if (value >= 5_000_000_000) return 'bg-green-800 hover:bg-green-900 text-white' // 5B+ - Dark Green
  if (value >= 3_000_000_000) return 'bg-green-600 hover:bg-green-700 text-white' // 3-5B - Green
  if (value >= 1_000_000_000) return 'bg-green-400 hover:bg-green-500 text-white' // 1-3B - Light Green
  if (value >= 500_000_000) return 'bg-orange-400 hover:bg-orange-500 text-white' // 500M-1B - Orange
  return 'bg-gray-100 hover:bg-gray-200 text-black' // Under 500M - Light Grey
}

const formatRevenue = (amount: number) => {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(0)}M`
  return `$${(amount / 1_000).toFixed(0)}K`
}

// Generic pill-checkbox group component
const PillGroup = ({
  label,
  options,
  value,
  onChange,
  disabled = false,
  className = ""
}: {
  label: string
  options: string[]
  value: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
  className?: string
}) => {
  const toggle = (option: string) => {
    if (disabled) return
    const newValue = value.includes(option)
      ? value.filter(v => v !== option)
      : [...value, option]
    onChange(newValue)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium text-gray-700 cursor-pointer" onClick={() => !disabled && onChange([])}>
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map(option => (
          <button
            key={option}
            onClick={() => toggle(option)}
            disabled={disabled}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              value.includes(option)
                ? 'bg-blue-100 text-blue-800 border-blue-300'
                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

export function TherapeuticAreasNew() {
  const { companies } = usePharmaVisualPivotStore()
  
  // Filter state
  const [selectedTA, setSelectedTA] = useState<string>('')
  const [taSearch, setTaSearch] = useState<string>('')
  const [revenueType, setRevenueType] = useState<'ww' | 'us'>('ww')
  const [stageFilter, setStageFilter] = useState<string[]>([])
  const [companyTierFilter, setCompanyTierFilter] = useState<string[]>([])
  const [revenueTiers, setRevenueTiers] = useState<RevenueTier[]>([])
  const [growth, setGrowth] = useState<'any' | 'growing' | 'shrinking'>('any')
  const [serviceFilter, setServiceFilter] = useState<string | null>(null)
  const [agencyFilter, setAgencyFilter] = useState<string | null>(null)
  const [companySlugFilter, setCompanySlugFilter] = useState<string | null>(null)
  const [companySearch, setCompanySearch] = useState<string>('')

  // Load stored filters
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = sessionStorage.getItem(ANALYTICS_FILTER_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setStageFilter(parsed.stageFilter ?? [])
        setCompanyTierFilter(parsed.companyTierFilter ?? [])
        setRevenueTiers(parsed.revenueTiers ?? [])
        setGrowth(parsed.growth ?? 'any')
        setServiceFilter(parsed.serviceFilter ?? null)
        setAgencyFilter(parsed.agencyFilter ?? null)
        setCompanySlugFilter(parsed.companySlugFilter ?? null)
        setSelectedTA(parsed.selectedTA ?? '')
      }
    } catch {/* ignore */}
  }, [])

  // Save filters
  useEffect(() => {
    if (typeof window === 'undefined') return
    const payload = {
      stageFilter,
      companyTierFilter,
      revenueTiers,
      growth,
      serviceFilter,
      agencyFilter,
      companySlugFilter,
      selectedTA,
    }
    try {
      sessionStorage.setItem(ANALYTICS_FILTER_STORAGE_KEY, JSON.stringify(payload))
    } catch {/* ignore */}
  }, [stageFilter, companyTierFilter, revenueTiers, growth, serviceFilter, agencyFilter, companySlugFilter, selectedTA])

  // Process data
  const data = useMemo(() => {
    const rows: any[] = []
    const companyTiers = new Map<string, string>()
    const stageSet = new Set<string>()
    const taSet = new Set<string>()
    const revenueTierSet = new Set<RevenueTier>()

    // Tier 1 companies
    const tier1Companies = [
      'Johnson & Johnson', 'Roche', 'Pfizer', 'Merck & Co. (MSD)', 'Novartis', 'AbbVie',
      'Bristol Myers Squibb (BMS)', 'AstraZeneca', 'Eli Lilly & Co.', 'Sanofi',
      'GlaxoSmithKline (GSK)', 'Amgen', 'Takeda', 'Boehringer Ingelheim', 'Novo Nordisk'
    ]
    
    const isTier1Company = (companyName: string) => {
      return tier1Companies.some(tier1Name => 
        companyName.toLowerCase().includes(tier1Name.toLowerCase()) ||
        tier1Name.toLowerCase().includes(companyName.toLowerCase())
      )
    }

    for (const company of Object.values(companies)) {
      const tier = isTier1Company(company.name) ? 'Tier 1' : 'ex-Tier 1'
      companyTiers.set(company.slug, tier)

      company.brands.forEach(b => {
        stageSet.add((b.indicationMarketStatus || '').trim())
        
        if (b.therapeuticArea) {
          taSet.add(b.therapeuticArea)
        }

        // Get revenue data for this brand
        const brandRevenueRows = company.revenueRows.filter(r => r.brandId === b.id)
        if (brandRevenueRows.length === 0) return

        // Create series data
        const series: Record<number, number> = {}
        const seriesUS: Record<number, number> = {}
        const years = new Set<number>()

        brandRevenueRows.forEach(row => {
          years.add(row.year)
          series[row.year] = (series[row.year] || 0) + (row.wwSales || 0)
          seriesUS[row.year] = (seriesUS[row.year] || 0) + (row.usSales || 0)
        })

        // Calculate growth
        const yearArray = Array.from(years).sort()
        const latestYear = Math.max(...yearArray)
        const previousYear = yearArray[yearArray.indexOf(latestYear) - 1]
        const latestRevenue = series[latestYear] || 0
        const previousRevenue = series[previousYear] || 0
        const growing = previousYear ? latestRevenue > previousRevenue : null

        // Determine revenue tier
        let revenueTier: RevenueTier = '0-100M'
        if (latestRevenue >= 1_000_000_000) revenueTier = '1B+'
        else if (latestRevenue >= 500_000_000) revenueTier = '500M-1B'
        else if (latestRevenue >= 100_000_000) revenueTier = '100-500M'
        revenueTierSet.add(revenueTier)

        rows.push({
          company: company.name,
          slug: company.slug,
          brandId: b.id,
          brand: b.name,
          stage: b.indicationMarketStatus || '',
          ta: b.therapeuticArea || 'Unknown',
          series,
          seriesUS,
          growing,
          revenueTier,
          services: b.services || {},
          years: yearArray
        })
      })
    }

    return {
      rows,
      companyTiers,
      stageOptions: Array.from(stageSet).sort(),
      taOptions: Array.from(taSet).sort(),
      revenueTierOptions: Array.from(revenueTierSet).sort(),
      years: Array.from(new Set(rows.flatMap(r => r.years))).sort()
    }
  }, [companies])

  // Filtering logic
  const passesFilters = useCallback((row: typeof data.rows[number]) => {
    if (stageFilter.length && !stageFilter.includes(row.stage)) return false
    if (companyTierFilter.length) {
      const tier = data.companyTiers.get(row.slug) || 'ex-Tier 1'
      if (!companyTierFilter.includes(tier)) return false
    }
    if (revenueTiers.length && !revenueTiers.includes(row.revenueTier)) return false
    if (growth !== 'any') {
      if (growth === 'growing' && row.growing !== true) return false
      if (growth === 'shrinking' && row.growing !== false) return false
    }
    if (companySlugFilter && row.slug !== companySlugFilter) return false
    if (serviceFilter) {
      const services = row.services || {}
      if (!Object.values(services).includes(serviceFilter)) return false
    }
    if (agencyFilter) {
      const services = row.services || {}
      if (!Object.values(services).includes(agencyFilter)) return false
    }
    return true
  }, [stageFilter, companyTierFilter, revenueTiers, growth, companySlugFilter, serviceFilter, agencyFilter, data.companyTiers])

  const filtered = useMemo(() => {
    return data.rows.filter(r => passesFilters(r))
  }, [data.rows, passesFilters])

  // Get available therapeutic areas
  const availableTAs = useMemo(() => {
    const set = new Set<string>()
    filtered.forEach(row => {
      if (row.ta) set.add(row.ta)
    })
    return Array.from(set).sort()
  }, [filtered])

  // Filter by selected TA
  const taFiltered = useMemo(() => {
    if (!selectedTA) return filtered
    return filtered.filter(row => row.ta === selectedTA)
  }, [filtered, selectedTA])

  // Build insights
  const insights = useMemo(() => {
    if (!selectedTA || taFiltered.length === 0) return null

    const companies = new Set(taFiltered.map(r => r.slug))
    const brands = taFiltered.length
    const growingBrands = taFiltered.filter(r => r.growing === true).length
    const shrinkingBrands = taFiltered.filter(r => r.growing === false).length
    
    // Top companies by revenue
    const companyRevenue = new Map<string, number>()
    taFiltered.forEach(row => {
      const latestYear = Math.max(...row.years)
      const revenue = revenueType === 'ww' ? (row.series[latestYear] || 0) : (row.seriesUS[latestYear] || 0)
      companyRevenue.set(row.slug, (companyRevenue.get(row.slug) || 0) + revenue)
    })
    
    const topCompanies = Array.from(companyRevenue.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([slug, revenue]) => {
        const company = Object.values(companies).find(c => c.slug === slug)
        return {
          name: company?.name || slug,
          revenue
        }
      })

    // Top brands by revenue
    const topBrands = taFiltered
      .map(row => {
        const latestYear = Math.max(...row.years)
        const revenue = revenueType === 'ww' ? (row.series[latestYear] || 0) : (row.seriesUS[latestYear] || 0)
        return { ...row, latestRevenue: revenue }
      })
      .sort((a, b) => b.latestRevenue - a.latestRevenue)
      .slice(0, 3)

    return {
      totalCompanies: companies.size,
      totalBrands: brands,
      growingBrands,
      shrinkingBrands,
      topCompanies,
      topBrands
    }
  }, [selectedTA, taFiltered, revenueType, companies])

  // Build matrix data
  const matrixData = useMemo(() => {
    if (!selectedTA) return { companies: [], brands: [], years: [], data: {} }

    // Get unique companies and their brands for this TA
    const companyMap = new Map<string, { name: string; brands: string[] }>()
    const brandMap = new Map<string, { company: string; brand: string; brandId: string }>()

    taFiltered.forEach(row => {
      if (!companyMap.has(row.slug)) {
        companyMap.set(row.slug, { name: row.company, brands: [] })
      }
      const company = companyMap.get(row.slug)!
      if (!company.brands.includes(row.brand)) {
        company.brands.push(row.brand)
      }
      brandMap.set(`${row.slug}-${row.brand}`, {
        company: row.company,
        brand: row.brand,
        brandId: row.brandId
      })
    })

    const companies = Array.from(companyMap.entries()).map(([slug, data]) => ({
      slug,
      name: data.name,
      brands: data.brands
    }))

    const brands = Array.from(brandMap.entries()).map(([key, data]) => ({
      key,
      ...data
    }))

    const years = data.years
    const matrix: Record<string, Record<number, number>> = {}

    // Initialize matrix
    brands.forEach(brand => {
      matrix[brand.key] = {}
      years.forEach(year => {
        matrix[brand.key][year] = 0
      })
    })

    // Fill matrix with revenue data
    taFiltered.forEach(row => {
      const key = `${row.slug}-${row.brand}`
      if (matrix[key]) {
        years.forEach(year => {
          const revenue = revenueType === 'ww' ? (row.series[year] || 0) : (row.seriesUS[year] || 0)
          matrix[key][year] = revenue
        })
      }
    })

    return { companies, brands, years, data: matrix }
  }, [taFiltered, data.years, revenueType])

  // Get agency info for a brand
  const getAgencyInfo = useCallback((brandKey: string) => {
    const brand = matrixData.brands.find(b => b.key === brandKey)
    if (!brand) return { hasKlick: false, hasCompetitor: false }

    const row = taFiltered.find(r => r.slug === brand.company && r.brand === brand.brand)
    if (!row) return { hasKlick: false, hasCompetitor: false }

    const services = row.services || {}
    const assignedAgencies = Object.values(services).filter(Boolean) as string[]
    
    return {
      hasKlick: assignedAgencies.includes('Klick'),
      hasCompetitor: assignedAgencies.some(agency => agency !== 'Klick' && agency.trim() !== '')
    }
  }, [matrixData.brands, taFiltered])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Therapeutic Areas Analysis</h1>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Filters */}
          <div className="col-span-3">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-blue-600" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Therapeutic Area Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Therapeutic Area</label>
                  <input
                    type="text"
                    placeholder="Search therapeutic areas..."
                    value={taSearch}
                    onChange={(e) => setTaSearch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <select
                    value={selectedTA}
                    onChange={(e) => setSelectedTA(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">Select a therapeutic area...</option>
                    {availableTAs
                      .filter(ta => ta.toLowerCase().includes(taSearch.toLowerCase()))
                      .map(ta => (
                        <option key={ta} value={ta}>{ta}</option>
                      ))}
                  </select>
                </div>

                {/* Revenue Type Toggle */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Revenue Type</label>
                  <div className="flex gap-1">
                    <Button
                      variant={revenueType === 'ww' ? 'default' : 'outline'}
                      onClick={() => setRevenueType('ww')}
                      size="sm"
                      className="flex-1"
                    >
                      <Globe className="h-3 w-3 mr-1" />
                      WW
                    </Button>
                    <Button
                      variant={revenueType === 'us' ? 'default' : 'outline'}
                      onClick={() => setRevenueType('us')}
                      size="sm"
                      className="flex-1"
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      US
                    </Button>
                  </div>
                </div>

                {/* Stage Filter */}
                <PillGroup
                  label="Stages"
                  options={data.stageOptions}
                  value={stageFilter}
                  onChange={setStageFilter}
                />

                {/* Company Tier Filter */}
                <PillGroup
                  label="Company Tiers"
                  options={['Tier 1', 'ex-Tier 1']}
                  value={companyTierFilter}
                  onChange={setCompanyTierFilter}
                />

                {/* Revenue Tier Filter */}
                <PillGroup
                  label="Revenue Tiers"
                  options={data.revenueTierOptions}
                  value={revenueTiers}
                  onChange={(values) => setRevenueTiers(values as RevenueTier[])}
                />

                {/* Growth Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Growth</label>
                  <div className="flex gap-1">
                    <Button
                      variant={growth === 'any' ? 'default' : 'outline'}
                      onClick={() => setGrowth('any')}
                      size="sm"
                      className="flex-1"
                    >
                      Any
                    </Button>
                    <Button
                      variant={growth === 'growing' ? 'default' : 'outline'}
                      onClick={() => setGrowth('growing')}
                      size="sm"
                      className="flex-1"
                    >
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Growing
                    </Button>
                    <Button
                      variant={growth === 'shrinking' ? 'default' : 'outline'}
                      onClick={() => setGrowth('shrinking')}
                      size="sm"
                      className="flex-1"
                    >
                      <TrendingDown className="h-3 w-3 mr-1" />
                      Shrinking
                    </Button>
                  </div>
                </div>

                {/* Company Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Company</label>
                  <input
                    type="text"
                    placeholder="Search companies..."
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <select
                    value={companySlugFilter || ''}
                    onChange={(e) => setCompanySlugFilter(e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">All companies</option>
                    {Object.values(companies)
                      .filter(c => c.name.toLowerCase().includes(companySearch.toLowerCase()))
                      .slice(0, 20)
                      .map(c => (
                        <option key={c.slug} value={c.slug}>{c.name}</option>
                      ))}
                  </select>
                </div>

                {/* Applied Filters Summary */}
                {(stageFilter.length > 0 || companyTierFilter.length > 0 || revenueTiers.length > 0 || 
                  growth !== 'any' || serviceFilter || agencyFilter || companySlugFilter) && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Applied Filters</h4>
                    <div className="flex flex-wrap gap-1">
                      {stageFilter.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          Stages: {stageFilter.length}
                        </Badge>
                      )}
                      {companyTierFilter.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          Tiers: {companyTierFilter.length}
                        </Badge>
                      )}
                      {revenueTiers.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          Revenue: {revenueTiers.length}
                        </Badge>
                      )}
                      {growth !== 'any' && (
                        <Badge variant="secondary" className="text-xs">
                          {growth}
                        </Badge>
                      )}
                      {companySlugFilter && (
                        <Badge variant="secondary" className="text-xs">
                          Company
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Content */}
          <div className="col-span-9">
            {/* Insights Panel */}
            {insights && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-600" />
                    {selectedTA} Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Building2 className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                      <div className="text-2xl font-bold text-blue-800">{insights.totalCompanies}</div>
                      <div className="text-sm text-blue-600">Companies</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <Activity className="h-8 w-8 mx-auto text-green-600 mb-2" />
                      <div className="text-2xl font-bold text-green-800">{insights.totalBrands}</div>
                      <div className="text-sm text-green-600">Brands</div>
                    </div>
                    <div className="text-center p-4 bg-emerald-50 rounded-lg">
                      <TrendingUp className="h-8 w-8 mx-auto text-emerald-600 mb-2" />
                      <div className="text-2xl font-bold text-emerald-800">{insights.growingBrands}</div>
                      <div className="text-sm text-emerald-600">Growing</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <TrendingDown className="h-8 w-8 mx-auto text-red-600 mb-2" />
                      <div className="text-2xl font-bold text-red-800">{insights.shrinkingBrands}</div>
                      <div className="text-sm text-red-600">Shrinking</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Top Companies */}
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        Top Companies
                      </h4>
                      <div className="space-y-2">
                        {insights.topCompanies.map((company) => (
                          <div key={company.name} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="font-medium">{company.name}</span>
                            <span className="text-sm text-gray-600">{formatRevenue(company.revenue)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Top Brands */}
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        Top Brands
                      </h4>
                      <div className="space-y-2">
                        {insights.topBrands.map((brand) => (
                          <div key={brand.brand} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <div>
                              <div className="font-medium">{brand.brand}</div>
                              <div className="text-xs text-gray-500">{brand.company}</div>
                            </div>
                            <span className="text-sm text-gray-600">{formatRevenue(brand.latestRevenue)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Matrix Table */}
            {selectedTA && matrixData.companies.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-purple-600" />
                    {selectedTA} Revenue Matrix ({revenueType === 'ww' ? 'Worldwide' : 'US'})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="border border-gray-300 p-2 bg-gray-50 text-left font-semibold">
                            Company / Brand
                          </th>
                          {matrixData.years.map(year => (
                            <th key={year} className="border border-gray-300 p-2 bg-gray-50 text-center font-semibold">
                              {year}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {matrixData.companies.map(company => (
                          <React.Fragment key={company.slug}>
                            {/* Company header row */}
                            <tr className="bg-gray-100">
                              <td className="border border-gray-300 p-2 font-semibold">
                                {company.name}
                              </td>
                              {matrixData.years.map(year => (
                                <td key={year} className="border border-gray-300 p-2 text-center">
                                  {formatRevenue(
                                    company.brands.reduce((sum, brandName) => {
                                      const brandKey = `${company.slug}-${brandName}`
                                      return sum + (matrixData.data[brandKey]?.[year] || 0)
                                    }, 0)
                                  )}
                                </td>
                              ))}
                            </tr>
                            {/* Brand rows */}
                            {company.brands.map(brandName => {
                              const brandKey = `${company.slug}-${brandName}`
                              const agencyInfo = getAgencyInfo(brandKey)
                              return (
                                <tr key={brandKey}>
                                  <td className="border border-gray-300 p-2 pl-6 text-sm text-gray-600">
                                    {brandName}
                                  </td>
                                  {matrixData.years.map(year => {
                                    const value = matrixData.data[brandKey]?.[year] || 0
                                    const cellClass = getCellColor(value)
                                    const borderClass = agencyInfo.hasKlick 
                                      ? 'border-blue-500 border-2' 
                                      : agencyInfo.hasCompetitor 
                                        ? 'border-red-500 border-2' 
                                        : 'border-gray-300'
                                    
                                    return (
                                      <td 
                                        key={year} 
                                        className={`border p-2 text-center text-sm ${cellClass} ${borderClass}`}
                                      >
                                        {value > 0 ? formatRevenue(value) : '-'}
                                      </td>
                                    )
                                  })}
                                </tr>
                              )
                            })}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Legend */}
                  <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-500"></div>
                      <span>Klick Agency</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-red-500"></div>
                      <span>Competitor Agency</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-100 border border-gray-300"></div>
                      <span>&lt; $500M</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-orange-400"></div>
                      <span>$500M - $1B</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-400"></div>
                      <span>$1B - $3B</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-600"></div>
                      <span>$3B - $5B</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-800"></div>
                      <span>&gt; $5B</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedTA && matrixData.companies.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Data Found</h3>
                  <p className="text-gray-500">
                    No companies or brands found for {selectedTA} with the current filters.
                  </p>
                </CardContent>
              </Card>
            )}

            {!selectedTA && (
              <Card>
                <CardContent className="text-center py-12">
                  <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Select a Therapeutic Area</h3>
                  <p className="text-gray-500">
                    Choose a therapeutic area from the dropdown above to view the revenue matrix.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
