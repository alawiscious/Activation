import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { usePharmaVisualPivotStore } from '@/data/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  Target,
  Building2,
  DollarSign,
  Filter,
  Globe,
  MapPin
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

export function TherapeuticAreas() {
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

        {/* Therapeutic Area Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Select Therapeutic Area
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search therapeutic areas..."
                  value={taSearch}
                  onChange={(e) => setTaSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={selectedTA}
                onChange={(e) => setSelectedTA(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a therapeutic area...</option>
                {availableTAs
                  .filter(ta => ta.toLowerCase().includes(taSearch.toLowerCase()))
                  .map(ta => (
                    <option key={ta} value={ta}>{ta}</option>
                  ))}
              </select>
            </div>
            {selectedTA && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Selected:</strong> {selectedTA} 
                  <span className="ml-2 text-blue-600">
                    ({taFiltered.length} brands across {matrixData.companies.length} companies)
                  </span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Type Toggle */}
        {selectedTA && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Revenue Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant={revenueType === 'ww' ? 'default' : 'outline'}
                  onClick={() => setRevenueType('ww')}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Worldwide
                </Button>
                <Button
                  variant={revenueType === 'us' ? 'default' : 'outline'}
                  onClick={() => setRevenueType('us')}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  US Only
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Applied Filters */}
        {(stageFilter.length > 0 || companyTierFilter.length > 0 || revenueTiers.length > 0 || 
          growth !== 'any' || serviceFilter || agencyFilter || companySlugFilter) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-orange-600" />
                Applied Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {stageFilter.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    Stages: {stageFilter.join(', ')}
                  </Badge>
                )}
                {companyTierFilter.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    Company Tiers: {companyTierFilter.join(', ')}
                  </Badge>
                )}
                {revenueTiers.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    Revenue Tiers: {revenueTiers.join(', ')}
                  </Badge>
                )}
                {growth !== 'any' && (
                  <Badge variant="secondary" className="text-xs">
                    Growth: {growth}
                  </Badge>
                )}
                {serviceFilter && (
                  <Badge variant="secondary" className="text-xs">
                    Service: {serviceFilter}
                  </Badge>
                )}
                {agencyFilter && (
                  <Badge variant="secondary" className="text-xs">
                    Agency: {agencyFilter}
                  </Badge>
                )}
                {companySlugFilter && (
                  <Badge variant="secondary" className="text-xs">
                    Company: {companies[companySlugFilter]?.name || companySlugFilter}
                  </Badge>
                )}
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
  )
}
