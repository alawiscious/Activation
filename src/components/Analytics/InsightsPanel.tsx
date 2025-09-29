import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { TrendingUp, TrendingDown, AlertTriangle, Target, DollarSign, Users, FlaskConical, Calendar, Rocket } from 'lucide-react'
import type { CompanyState } from '@/types/domain'

interface BrandData {
  brand: string
  brandId: string
  slug: string
  company: string
  ta: string
  stage: string
  series: Record<number, number>
  seriesUS: Record<number, number>
}

interface InsightsPanelProps {
  companies: Record<string, CompanyState>
  filteredBrands: BrandData[]
  revenueType: 'ww' | 'us'
}

// Helper function - defined early to avoid hoisting issues
const formatRevenue = (amount: number) => {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(0)}M`
  return `$${(amount / 1_000).toFixed(0)}K`
}

export function InsightsPanel({ companies, filteredBrands, revenueType }: InsightsPanelProps) {
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null)
  
  const insights = useMemo(() => {
    if (filteredBrands.length === 0) return []

    const insightsList = []

    // 1. Revenue concentration analysis
    const totalRevenue = filteredBrands.reduce((sum, brand) => {
      const latestYear = Math.max(...Object.keys(brand.series).map(Number))
      return sum + (brand.series[latestYear] || 0)
    }, 0)

    const topBrands = filteredBrands
      .map(brand => {
        const latestYear = Math.max(...Object.keys(brand.series).map(Number))
        return {
          ...brand,
          latestRevenue: brand.series[latestYear] || 0,
          revenueShare: totalRevenue > 0 ? ((brand.series[latestYear] || 0) / totalRevenue) * 100 : 0
        }
      })
      .sort((a: any, b: any) => b.latestRevenue - a.latestRevenue)
      .slice(0, 5)

    if (topBrands.length > 0) {
      const topBrand = topBrands[0]
      insightsList.push({
        type: 'revenue_concentration',
        icon: DollarSign,
        title: 'Revenue Concentration',
        description: `${topBrand.brand} dominates with ${topBrand.revenueShare.toFixed(1)}% of total revenue (${formatRevenue(topBrand.latestRevenue)})`,
        color: 'text-green-600'
      })
    }

    // 2. Therapeutic area analysis (excluding Unknown)
    const taRevenue = filteredBrands.reduce((acc, brand) => {
      const latestYear = Math.max(...Object.keys(brand.series).map(Number))
      const revenue = brand.series[latestYear] || 0
      // Only include non-Unknown therapeutic areas
      if (brand.ta && brand.ta.toLowerCase() !== 'unknown') {
        acc[brand.ta] = (acc[brand.ta] || 0) + revenue
      }
      return acc
    }, {} as Record<string, number>)

    const topTA = Object.entries(taRevenue)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0]

    if (topTA) {
      const taShare = (topTA[1] / totalRevenue) * 100
      insightsList.push({
        type: 'therapeutic_area',
        icon: Target,
        title: 'Leading Therapeutic Area',
        description: `${topTA[0]} represents ${taShare.toFixed(1)}% of portfolio revenue`,
        color: 'text-blue-600'
      })
    }

    // 2b. Unknown therapeutic area note
    const unknownTACount = filteredBrands.filter(brand => 
      !brand.ta || brand.ta.toLowerCase() === 'unknown'
    ).length

    if (unknownTACount > 0) {
      insightsList.push({
        type: 'unknown_ta',
        icon: AlertTriangle,
        title: 'Unknown Therapeutic Areas',
        description: `${unknownTACount} brands have unknown therapeutic area classification`,
        color: 'text-yellow-600'
      })
    }

    // 3. Growth analysis
    const growingBrands = filteredBrands.filter(brand => {
      const years = Object.keys(brand.series).map(Number).sort()
      if (years.length < 2) return false
      const firstYear = years[0]
      const lastYear = years[years.length - 1]
      const firstRevenue = brand.series[firstYear] || 0
      const lastRevenue = brand.series[lastYear] || 0
      return lastRevenue > firstRevenue * 1.2 // 20% growth
    })

    const decliningBrands = filteredBrands.filter(brand => {
      const years = Object.keys(brand.series).map(Number).sort()
      if (years.length < 2) return false
      const firstYear = years[0]
      const lastYear = years[years.length - 1]
      const firstRevenue = brand.series[firstYear] || 0
      const lastRevenue = brand.series[lastYear] || 0
      return lastRevenue < firstRevenue * 0.8 // 20% decline
    })

    if (growingBrands.length > 0) {
      insightsList.push({
        type: 'growth',
        icon: TrendingUp,
        title: 'Growth Leaders',
        description: `${growingBrands.length} brands showing strong growth (>20% CAGR)`,
        color: 'text-green-600'
      })
    }

    if (decliningBrands.length > 0) {
      insightsList.push({
        type: 'decline',
        icon: TrendingDown,
        title: 'Declining Brands',
        description: `${decliningBrands.length} brands experiencing revenue decline (>20% drop)`,
        color: 'text-red-600'
      })
    }

    // 4. Launch pipeline analysis
    const preLaunchBrands = filteredBrands.filter(brand => 
      brand.stage === 'Pre-Launch (2Y)' || brand.stage === 'Pre-Launch (1Y)'
    )

    if (preLaunchBrands.length > 0) {
      const totalPipelineValue = preLaunchBrands.reduce((sum, brand) => {
        const latestYear = Math.max(...Object.keys(brand.series).map(Number))
        return sum + (brand.series[latestYear] || 0)
      }, 0)

      insightsList.push({
        type: 'pipeline',
        icon: AlertTriangle,
        title: 'Launch Pipeline',
        description: `${preLaunchBrands.length} brands approaching launch with ${formatRevenue(totalPipelineValue)} potential`,
        color: 'text-orange-600'
      })
    }

    // 5. Clinical phase analysis
    const phase1Brands = filteredBrands.filter(brand => 
      brand.stage === 'Phase 1' || brand.stage?.includes('Phase 1')
    )
    const phase2Brands = filteredBrands.filter(brand => 
      brand.stage === 'Phase 2' || brand.stage?.includes('Phase 2')
    )
    const phase3Brands = filteredBrands.filter(brand => 
      brand.stage === 'Phase 3' || brand.stage?.includes('Phase 3')
    )

    if (phase1Brands.length > 0 || phase2Brands.length > 0 || phase3Brands.length > 0) {
      insightsList.push({
        type: 'clinical_phases',
        icon: FlaskConical,
        title: 'Clinical Pipeline',
        description: `Phase 1: ${phase1Brands.length} | Phase 2: ${phase2Brands.length} | Phase 3: ${phase3Brands.length}`,
        color: 'text-indigo-600'
      })
    }

    // 6. Launch pipeline analysis by year
    const launchPipeline = filteredBrands.reduce((acc, brand) => {
      if (brand.stage === 'Pre-Launch (1Y)' || brand.stage === 'Pre-Launch (2Y)') {
        const currentYear = new Date().getFullYear()
        const launchYear = brand.stage === 'Pre-Launch (1Y)' ? currentYear + 1 : currentYear + 2
        
        if (!acc[launchYear]) acc[launchYear] = { count: 0, revenue: 0, brands: [] }
        acc[launchYear].count++
        const latestYear = Math.max(...Object.keys(brand.series).map(Number))
        acc[launchYear].revenue += brand.series[latestYear] || 0
        acc[launchYear].brands.push(brand.brand)
      }
      return acc
    }, {} as Record<number, { count: number, revenue: number, brands: string[] }>)

    const upcomingLaunches = Object.entries(launchPipeline)
      .sort(([a], [b]) => Number(a) - Number(b))
      .slice(0, 3) // Next 3 years

    if (upcomingLaunches.length > 0) {
      const nextYear = upcomingLaunches[0]
      insightsList.push({
        type: 'launch_pipeline',
        icon: Rocket,
        title: 'Anticipated Launches',
        description: `${nextYear[1].count} launches in ${nextYear[0]} worth ${formatRevenue(nextYear[1].revenue)}`,
        color: 'text-orange-600'
      })
    }

    // 7. Therapeutic areas with launches
    const taLaunches = filteredBrands.reduce((acc, brand) => {
      if (brand.stage === 'Pre-Launch (1Y)' || brand.stage === 'Pre-Launch (2Y)') {
        if (brand.ta && brand.ta.toLowerCase() !== 'unknown') {
          if (!acc[brand.ta]) acc[brand.ta] = { count: 0, revenue: 0, brands: [] }
          acc[brand.ta].count++
          const latestYear = Math.max(...Object.keys(brand.series).map(Number))
          acc[brand.ta].revenue += brand.series[latestYear] || 0
          acc[brand.ta].brands.push(brand.brand)
        }
      }
      return acc
    }, {} as Record<string, { count: number, revenue: number, brands: string[] }>)

    const topTALaunches = Object.entries(taLaunches)
      .sort(([,a], [,b]) => (b as any).count - (a as any).count)[0]

    if (topTALaunches) {
      insightsList.push({
        type: 'ta_launches',
        icon: Calendar,
        title: 'Leading Launch TA',
        description: `${topTALaunches[0]} has ${topTALaunches[1].count} upcoming launches`,
        color: 'text-teal-600'
      })
    }

    // 8. Agency analysis
    const agencyAnalysis = filteredBrands.reduce((acc, brand) => {
      const company = companies[brand.slug]
      const brandData = company?.brands.find(b => b.id === brand.brandId)
      const services = brandData?.services || {}
      const agencies = Object.values(services).filter(Boolean)
      
      agencies.forEach(agency => {
        if (!acc[agency]) acc[agency] = { count: 0, revenue: 0 }
        acc[agency].count++
        const latestYear = Math.max(...Object.keys(brand.series).map(Number))
        acc[agency].revenue += brand.series[latestYear] || 0
      })
      
      return acc
    }, {} as Record<string, { count: number, revenue: number }>)

    const topAgency = Object.entries(agencyAnalysis)
      .sort(([,a], [,b]) => (b as any).revenue - (a as any).revenue)[0]

    if (topAgency && topAgency[0] !== 'Klick') {
      insightsList.push({
        type: 'agency',
        icon: Users,
        title: 'Competitive Intelligence',
        description: `${topAgency[0]} manages ${topAgency[1].count} brands worth ${formatRevenue(topAgency[1].revenue)}`,
        color: 'text-purple-600'
      })
    }

    return insightsList
  }, [companies, filteredBrands, revenueType])

  // Get detailed breakdown for selected insight
  const getInsightDetails = useMemo(() => {
    if (!selectedInsight || filteredBrands.length === 0) return null

    const latestYear = Math.max(...Object.keys(filteredBrands[0]?.series || {}).map(Number))
    
    switch (selectedInsight) {
      case 'revenue_concentration':
        return filteredBrands
          .map(brand => {
            const revenue = brand.series[latestYear] || 0
            const totalRevenue = filteredBrands.reduce((sum, b) => sum + (b.series[latestYear] || 0), 0)
            return {
              brand: brand.brand,
              company: brand.company,
              revenue,
              percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0
            }
          })
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10)

      case 'therapeutic_area':
        const taRevenue = filteredBrands.reduce((acc, brand) => {
          const revenue = brand.series[latestYear] || 0
          // Only include non-Unknown therapeutic areas
          if (brand.ta && brand.ta.toLowerCase() !== 'unknown') {
            acc[brand.ta] = (acc[brand.ta] || 0) + revenue
          }
          return acc
        }, {} as Record<string, number>)
        
        return Object.entries(taRevenue)
          .map(([ta, revenue]) => {
            const totalRevenue = filteredBrands.reduce((sum, b) => sum + (b.series[latestYear] || 0), 0)
            return {
              therapeuticArea: ta,
              revenue,
              percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0
            }
          })
          .sort((a, b) => b.revenue - a.revenue)

      case 'unknown_ta':
        return filteredBrands
          .filter(brand => !brand.ta || brand.ta.toLowerCase() === 'unknown')
          .map(brand => ({
            brand: brand.brand,
            company: brand.company,
            therapeuticArea: brand.ta || 'Unknown',
            revenue: brand.series[latestYear] || 0
          }))
          .sort((a, b) => b.revenue - a.revenue)

      case 'clinical_phases':
        const phase1Brands = filteredBrands.filter(brand => 
          brand.stage === 'Phase 1' || brand.stage?.includes('Phase 1')
        )
        const phase2Brands = filteredBrands.filter(brand => 
          brand.stage === 'Phase 2' || brand.stage?.includes('Phase 2')
        )
        const phase3Brands = filteredBrands.filter(brand => 
          brand.stage === 'Phase 3' || brand.stage?.includes('Phase 3')
        )
        
        return [
          ...phase1Brands.map(brand => ({
            brand: brand.brand,
            company: brand.company,
            phase: 'Phase 1',
            stage: brand.stage,
            revenue: brand.series[latestYear] || 0
          })),
          ...phase2Brands.map(brand => ({
            brand: brand.brand,
            company: brand.company,
            phase: 'Phase 2',
            stage: brand.stage,
            revenue: brand.series[latestYear] || 0
          })),
          ...phase3Brands.map(brand => ({
            brand: brand.brand,
            company: brand.company,
            phase: 'Phase 3',
            stage: brand.stage,
            revenue: brand.series[latestYear] || 0
          }))
        ].sort((a, b) => b.revenue - a.revenue)

      case 'launch_pipeline':
        const launchPipeline = filteredBrands.reduce((acc, brand) => {
          if (brand.stage === 'Pre-Launch (1Y)' || brand.stage === 'Pre-Launch (2Y)') {
            const currentYear = new Date().getFullYear()
            const launchYear = brand.stage === 'Pre-Launch (1Y)' ? currentYear + 1 : currentYear + 2
            
            if (!acc[launchYear]) acc[launchYear] = { count: 0, revenue: 0, brands: [] }
            acc[launchYear].count++
            acc[launchYear].revenue += brand.series[latestYear] || 0
            acc[launchYear].brands.push(brand.brand)
          }
          return acc
        }, {} as Record<number, { count: number, revenue: number, brands: string[] }>)

        return Object.entries(launchPipeline)
          .map(([year, data]) => ({
            year: Number(year),
            brandCount: data.count,
            revenue: data.revenue,
            brands: data.brands
          }))
          .sort((a, b) => a.year - b.year)

      case 'ta_launches':
        const taLaunches = filteredBrands.reduce((acc, brand) => {
          if (brand.stage === 'Pre-Launch (1Y)' || brand.stage === 'Pre-Launch (2Y)') {
            if (brand.ta && brand.ta.toLowerCase() !== 'unknown') {
              if (!acc[brand.ta]) acc[brand.ta] = { count: 0, revenue: 0, brands: [] }
              acc[brand.ta].count++
              acc[brand.ta].revenue += brand.series[latestYear] || 0
              acc[brand.ta].brands.push(brand.brand)
            }
          }
          return acc
        }, {} as Record<string, { count: number, revenue: number, brands: string[] }>)

        return Object.entries(taLaunches)
          .map(([ta, data]) => ({
            therapeuticArea: ta,
            brandCount: data.count,
            revenue: data.revenue,
            brands: data.brands
          }))
          .sort((a, b) => b.brandCount - a.brandCount)

      case 'growth':
        return filteredBrands
          .filter(brand => {
            const years = Object.keys(brand.series).map(Number).sort()
            if (years.length < 2) return false
            const firstYear = years[0]
            const lastYear = years[years.length - 1]
            const firstRevenue = brand.series[firstYear] || 0
            const lastRevenue = brand.series[lastYear] || 0
            return lastRevenue > firstRevenue * 1.2
          })
          .map(brand => {
            const years = Object.keys(brand.series).map(Number).sort()
            const firstYear = years[0]
            const lastYear = years[years.length - 1]
            const firstRevenue = brand.series[firstYear] || 0
            const lastRevenue = brand.series[lastYear] || 0
            const growthRate = firstRevenue > 0 ? ((lastRevenue - firstRevenue) / firstRevenue) * 100 : 0
            
            return {
              brand: brand.brand,
              company: brand.company,
              firstRevenue,
              lastRevenue,
              growthRate
            }
          })
          .sort((a, b) => b.growthRate - a.growthRate)

      case 'decline':
        return filteredBrands
          .filter(brand => {
            const years = Object.keys(brand.series).map(Number).sort()
            if (years.length < 2) return false
            const firstYear = years[0]
            const lastYear = years[years.length - 1]
            const firstRevenue = brand.series[firstYear] || 0
            const lastRevenue = brand.series[lastYear] || 0
            return lastRevenue < firstRevenue * 0.8
          })
          .map(brand => {
            const years = Object.keys(brand.series).map(Number).sort()
            const firstYear = years[0]
            const lastYear = years[years.length - 1]
            const firstRevenue = brand.series[firstYear] || 0
            const lastRevenue = brand.series[lastYear] || 0
            const declineRate = firstRevenue > 0 ? ((firstRevenue - lastRevenue) / firstRevenue) * 100 : 0
            
            return {
              brand: brand.brand,
              company: brand.company,
              firstRevenue,
              lastRevenue,
              declineRate
            }
          })
          .sort((a, b) => b.declineRate - a.declineRate)

      case 'pipeline':
        return filteredBrands
          .filter(brand => 
            brand.stage === 'Pre-Launch (2Y)' || brand.stage === 'Pre-Launch (1Y)'
          )
          .map(brand => ({
            brand: brand.brand,
            company: brand.company,
            stage: brand.stage,
            potentialRevenue: brand.series[latestYear] || 0
          }))
          .sort((a, b) => b.potentialRevenue - a.potentialRevenue)

      case 'agency':
        const agencyAnalysis = filteredBrands.reduce((acc, brand) => {
          const company = companies[brand.slug]
          const brandData = company?.brands.find(b => b.id === brand.brandId)
          const services = brandData?.services || {}
          const agencies = Object.values(services).filter(Boolean)
          
          agencies.forEach(agency => {
            if (!acc[agency]) acc[agency] = { count: 0, revenue: 0, brands: [] }
            acc[agency].count++
            acc[agency].revenue += brand.series[latestYear] || 0
            acc[agency].brands.push(brand.brand)
          })
          
          return acc
        }, {} as Record<string, { count: number, revenue: number, brands: string[] }>)

        return Object.entries(agencyAnalysis)
          .map(([agency, data]) => ({
            agency,
            brandCount: data.count,
            revenue: data.revenue,
            brands: data.brands
          }))
          .sort((a, b) => b.revenue - a.revenue)

      default:
        return null
    }
  }, [selectedInsight, filteredBrands, companies])

  if (insights.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <Card className="h-fit">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {insights.map((insight, index) => {
              const Icon = insight.icon
              const isSelected = selectedInsight === insight.type
              return (
                <button
                  key={index}
                  onClick={() => setSelectedInsight(isSelected ? null : insight.type)}
                  className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                    isSelected 
                      ? 'bg-blue-100 border-2 border-blue-300' 
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <Icon className={`h-4 w-4 flex-shrink-0 ${insight.color}`} />
                  <div className="min-w-0 text-left">
                    <h4 className="font-semibold text-xs text-gray-900 truncate">{insight.title}</h4>
                    <p className="text-xs text-gray-600 truncate">{insight.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Breakdown */}
      {selectedInsight && getInsightDetails && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              {insights.find(i => i.type === selectedInsight)?.title} - Detailed Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {selectedInsight === 'revenue_concentration' && (
                      <>
                        <th className="text-left p-2">Brand</th>
                        <th className="text-left p-2">Company</th>
                        <th className="text-right p-2">Revenue</th>
                        <th className="text-right p-2">% of Total</th>
                      </>
                    )}
                    {selectedInsight === 'therapeutic_area' && (
                      <>
                        <th className="text-left p-2">Therapeutic Area</th>
                        <th className="text-right p-2">Revenue</th>
                        <th className="text-right p-2">% of Total</th>
                      </>
                    )}
                    {selectedInsight === 'unknown_ta' && (
                      <>
                        <th className="text-left p-2">Brand</th>
                        <th className="text-left p-2">Company</th>
                        <th className="text-left p-2">Therapeutic Area</th>
                        <th className="text-right p-2">Revenue</th>
                      </>
                    )}
                    {selectedInsight === 'clinical_phases' && (
                      <>
                        <th className="text-left p-2">Brand</th>
                        <th className="text-left p-2">Company</th>
                        <th className="text-left p-2">Phase</th>
                        <th className="text-left p-2">Stage</th>
                        <th className="text-right p-2">Revenue</th>
                      </>
                    )}
                    {selectedInsight === 'launch_pipeline' && (
                      <>
                        <th className="text-left p-2">Year</th>
                        <th className="text-right p-2">Brand Count</th>
                        <th className="text-right p-2">Revenue</th>
                        <th className="text-left p-2">Brands</th>
                      </>
                    )}
                    {selectedInsight === 'ta_launches' && (
                      <>
                        <th className="text-left p-2">Therapeutic Area</th>
                        <th className="text-right p-2">Brand Count</th>
                        <th className="text-right p-2">Revenue</th>
                        <th className="text-left p-2">Brands</th>
                      </>
                    )}
                    {selectedInsight === 'growth' && (
                      <>
                        <th className="text-left p-2">Brand</th>
                        <th className="text-left p-2">Company</th>
                        <th className="text-right p-2">First Year</th>
                        <th className="text-right p-2">Latest Year</th>
                        <th className="text-right p-2">Growth Rate</th>
                      </>
                    )}
                    {selectedInsight === 'decline' && (
                      <>
                        <th className="text-left p-2">Brand</th>
                        <th className="text-left p-2">Company</th>
                        <th className="text-right p-2">First Year</th>
                        <th className="text-right p-2">Latest Year</th>
                        <th className="text-right p-2">Decline Rate</th>
                      </>
                    )}
                    {selectedInsight === 'pipeline' && (
                      <>
                        <th className="text-left p-2">Brand</th>
                        <th className="text-left p-2">Company</th>
                        <th className="text-left p-2">Stage</th>
                        <th className="text-right p-2">Potential Revenue</th>
                      </>
                    )}
                    {selectedInsight === 'agency' && (
                      <>
                        <th className="text-left p-2">Agency</th>
                        <th className="text-right p-2">Brand Count</th>
                        <th className="text-right p-2">Revenue</th>
                        <th className="text-left p-2">Brands</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {getInsightDetails.map((item: any, index: number) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      {selectedInsight === 'revenue_concentration' && (
                        <>
                          <td className="p-2 font-medium">{item.brand}</td>
                          <td className="p-2">{item.company}</td>
                          <td className="p-2 text-right">{formatRevenue(item.revenue)}</td>
                          <td className="p-2 text-right">{item.percentage.toFixed(1)}%</td>
                        </>
                      )}
                      {selectedInsight === 'therapeutic_area' && (
                        <>
                          <td className="p-2 font-medium">{item.therapeuticArea}</td>
                          <td className="p-2 text-right">{formatRevenue(item.revenue)}</td>
                          <td className="p-2 text-right">{item.percentage.toFixed(1)}%</td>
                        </>
                      )}
                      {selectedInsight === 'unknown_ta' && (
                        <>
                          <td className="p-2 font-medium">{item.brand}</td>
                          <td className="p-2">{item.company}</td>
                          <td className="p-2">{item.therapeuticArea}</td>
                          <td className="p-2 text-right">{formatRevenue(item.revenue)}</td>
                        </>
                      )}
                      {selectedInsight === 'clinical_phases' && (
                        <>
                          <td className="p-2 font-medium">{item.brand}</td>
                          <td className="p-2">{item.company}</td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              item.phase === 'Phase 1' ? 'bg-blue-100 text-blue-800' :
                              item.phase === 'Phase 2' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {item.phase}
                            </span>
                          </td>
                          <td className="p-2">{item.stage}</td>
                          <td className="p-2 text-right">{formatRevenue(item.revenue)}</td>
                        </>
                      )}
                      {selectedInsight === 'launch_pipeline' && (
                        <>
                          <td className="p-2 font-medium">{item.year}</td>
                          <td className="p-2 text-right">{item.brandCount}</td>
                          <td className="p-2 text-right">{formatRevenue(item.revenue)}</td>
                          <td className="p-2">{item.brands.join(', ')}</td>
                        </>
                      )}
                      {selectedInsight === 'ta_launches' && (
                        <>
                          <td className="p-2 font-medium">{item.therapeuticArea}</td>
                          <td className="p-2 text-right">{item.brandCount}</td>
                          <td className="p-2 text-right">{formatRevenue(item.revenue)}</td>
                          <td className="p-2">{item.brands.join(', ')}</td>
                        </>
                      )}
                      {selectedInsight === 'growth' && (
                        <>
                          <td className="p-2 font-medium">{item.brand}</td>
                          <td className="p-2">{item.company}</td>
                          <td className="p-2 text-right">{formatRevenue(item.firstRevenue)}</td>
                          <td className="p-2 text-right">{formatRevenue(item.lastRevenue)}</td>
                          <td className="p-2 text-right text-green-600">+{item.growthRate.toFixed(1)}%</td>
                        </>
                      )}
                      {selectedInsight === 'decline' && (
                        <>
                          <td className="p-2 font-medium">{item.brand}</td>
                          <td className="p-2">{item.company}</td>
                          <td className="p-2 text-right">{formatRevenue(item.firstRevenue)}</td>
                          <td className="p-2 text-right">{formatRevenue(item.lastRevenue)}</td>
                          <td className="p-2 text-right text-red-600">-{item.declineRate.toFixed(1)}%</td>
                        </>
                      )}
                      {selectedInsight === 'pipeline' && (
                        <>
                          <td className="p-2 font-medium">{item.brand}</td>
                          <td className="p-2">{item.company}</td>
                          <td className="p-2">{item.stage}</td>
                          <td className="p-2 text-right">{formatRevenue(item.potentialRevenue)}</td>
                        </>
                      )}
                      {selectedInsight === 'agency' && (
                        <>
                          <td className="p-2 font-medium">{item.agency}</td>
                          <td className="p-2 text-right">{item.brandCount}</td>
                          <td className="p-2 text-right">{formatRevenue(item.revenue)}</td>
                          <td className="p-2">{item.brands.join(', ')}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
