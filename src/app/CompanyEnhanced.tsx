import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePharmaVisualPivotStore } from '@/data/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Users, 
  Target, 
  DollarSign, 
  ArrowLeft,
  BarChart3,
  Building2,
  Activity,
  Star,
  ChevronDown,
  ChevronRight,
  FlaskConical,
  Rocket,
  Filter,
  X
} from 'lucide-react'
import { Navigation } from '@/components/Shared/Navigation'
import { ContactCard } from '@/components/Contacts/ContactCard'
import { CompetitiveIntelligenceInsights } from '@/components/Company/CompetitiveIntelligenceInsights'
import type { Contact } from '@/types/domain'

const getRevenueTier = (value: number) => {
  if (value >= 1_000_000_000) return '1B+'
  if (value >= 500_000_000) return '500M-1B'
  if (value >= 100_000_000) return '100-500M'
  return '0-100M'
}

const formatRevenue = (amount: number) => {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(0)}M`
  return `$${(amount / 1_000).toFixed(0)}K`
}

const getCellColor = (value: number) => {
  if (value >= 5_000_000_000) return 'bg-green-800 hover:bg-green-900 text-white' // 5B+ - Dark Green
  if (value >= 3_000_000_000) return 'bg-green-600 hover:bg-green-700 text-white' // 3-5B - Green
  if (value >= 1_000_000_000) return 'bg-green-400 hover:bg-green-500 text-white' // 1-3B - Light Green
  if (value >= 500_000_000) return 'bg-orange-400 hover:bg-orange-500 text-white' // 500M-1B - Orange
  return 'bg-gray-100 hover:bg-gray-200 text-black' // Under 500M - Light Grey
}

export function CompanyEnhanced() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { companies } = usePharmaVisualPivotStore()
  
  // State management
  const [selectedCompanySlug, setSelectedCompanySlug] = useState<string>(slug || '')
  const [companySearch, setCompanySearch] = useState<string>('')
  const [leftWorkspaceContacts, setLeftWorkspaceContacts] = useState<Contact[]>([])
  const [rightWorkspaceContacts, setRightWorkspaceContacts] = useState<Contact[]>([])
  const [contactFilters, setContactFilters] = useState({
    functionalAreas: [] as string[],
    known: 'all' as 'all' | 'known' | 'unknown',
    therapeuticAreas: [] as string[]
  })
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set())
  const [expandedTAs, setExpandedTAs] = useState<Set<string>>(new Set())

  // Get selected company
  const company = selectedCompanySlug ? companies[selectedCompanySlug] : null

  // Company data processing
  const companyData = useMemo(() => {
    if (!company) return null

    try {
      // Process revenue data
      const revenueRows = company.revenueRows || []
      const years = revenueRows.length > 0 
        ? Array.from(new Set(revenueRows.map(r => r.year))).sort()
        : []

      // Calculate totals
      const totalRevenue = revenueRows.reduce((sum, row) => sum + (row.wwSales || 0), 0)
      const totalUSRevenue = revenueRows.reduce((sum, row) => sum + (row.usSales || 0), 0)
      const activeBrands = company.brands?.length || 0
      const totalContacts = company.contacts?.length || 0

      // Get top therapeutic area
      const taCounts = new Map<string, number>()
      company.brands?.forEach(brand => {
        if (brand.therapeuticArea) {
          taCounts.set(brand.therapeuticArea, (taCounts.get(brand.therapeuticArea) || 0) + 1)
        }
      })
      const topTA = Array.from(taCounts.entries()).sort((a, b) => b[1] - a[1])[0]

      // Contact analysis (excluding irrelevant contacts)
      const contacts = company.contacts?.filter(c => !c.isIrrelevant) || []
      const knownContacts = contacts.filter(c => c.known === true).length
      const unknownContacts = contacts.length - knownContacts

      // Functional area breakdown (excluding irrelevant contacts)
      const functionalAreas = new Map<string, number>()
      contacts.forEach(contact => {
        if (contact.functionalArea) {
          functionalAreas.set(contact.functionalArea, (functionalAreas.get(contact.functionalArea) || 0) + 1)
        }
      })

      // Therapeutic area contacts
      const taContacts = new Map<string, number>()
      contacts.forEach(contact => {
        if (contact.therapeuticArea) {
          taContacts.set(contact.therapeuticArea, (taContacts.get(contact.therapeuticArea) || 0) + 1)
        }
      })

      // Drug phases analysis
      const phaseAnalysis = {
        phase1: company.brands?.filter(b => b.indicationMarketStatus?.includes('Phase 1')).length || 0,
        phase2: company.brands?.filter(b => b.indicationMarketStatus?.includes('Phase 2')).length || 0,
        phase3: company.brands?.filter(b => b.indicationMarketStatus?.includes('Phase 3')).length || 0,
        preLaunch1Y: company.brands?.filter(b => b.indicationMarketStatus?.includes('Pre-Launch (1Y)')).length || 0,
        preLaunch2Y: company.brands?.filter(b => b.indicationMarketStatus?.includes('Pre-Launch (2Y)')).length || 0,
        launch: company.brands?.filter(b => b.indicationMarketStatus?.includes('Launch')).length || 0,
        postLaunch: company.brands?.filter(b => b.indicationMarketStatus?.includes('Post-Launch')).length || 0,
        preLOE: company.brands?.filter(b => b.indicationMarketStatus?.includes('Pre-LOE')).length || 0,
        loe: company.brands?.filter(b => b.indicationMarketStatus?.includes('LOE')).length || 0
      }

      // Launch years analysis
      const currentYear = new Date().getFullYear()
      const launchYears = new Map<number, number>()
      company.brands?.forEach(brand => {
        if (brand.indicationMarketStatus?.includes('Pre-Launch (1Y)')) {
          const year = currentYear + 1
          launchYears.set(year, (launchYears.get(year) || 0) + 1)
        } else if (brand.indicationMarketStatus?.includes('Pre-Launch (2Y)')) {
          const year = currentYear + 2
          launchYears.set(year, (launchYears.get(year) || 0) + 1)
        }
      })

      return {
        totalRevenue,
        totalUSRevenue,
        activeBrands,
        totalContacts,
        knownContacts,
        unknownContacts,
        topTA,
        functionalAreas,
        taContacts,
        years,
        revenueRows,
        contacts,
        phaseAnalysis,
        launchYears
      }
    } catch (error) {
      console.error('Error processing company data:', error)
      return {
        totalRevenue: 0,
        totalUSRevenue: 0,
        activeBrands: 0,
        totalContacts: 0,
        knownContacts: 0,
        unknownContacts: 0,
        topTA: null,
        functionalAreas: new Map(),
        taContacts: new Map(),
        years: [],
        revenueRows: [],
        contacts: [],
        phaseAnalysis: { phase1: 0, phase2: 0, phase3: 0, preLaunch1Y: 0, preLaunch2Y: 0, launch: 0, postLaunch: 0, preLOE: 0, loe: 0 },
        launchYears: new Map()
      }
    }
  }, [company])

  // Build therapeutic area table data
  const taTableData = useMemo(() => {
    if (!company || !companyData) return []

    const taMap = new Map<string, { brands: any[], totalRevenue: number }>()
    
    company.brands?.forEach(brand => {
      const ta = brand.therapeuticArea || 'Unknown'
      if (!taMap.has(ta)) {
        taMap.set(ta, { brands: [], totalRevenue: 0 })
      }
      
      const brandRevenue = companyData.revenueRows
        .filter(row => row.brandId === brand.id)
        .reduce((sum, row) => sum + (row.wwSales || 0), 0)
      
      taMap.get(ta)!.brands.push({ ...brand, revenue: brandRevenue })
      taMap.get(ta)!.totalRevenue += brandRevenue
    })

    return Array.from(taMap.entries()).map(([ta, data]) => ({
      therapeuticArea: ta,
      brands: data.brands.sort((a, b) => b.revenue - a.revenue),
      totalRevenue: data.totalRevenue
    })).sort((a, b) => b.totalRevenue - a.totalRevenue)
  }, [company, companyData])

  // Initialize left workspace with all company contacts
  useEffect(() => {
    if (companyData) {
      setLeftWorkspaceContacts(companyData.contacts)
    }
  }, [companyData])

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, contactId: string) => {
    e.dataTransfer.setData('text/plain', contactId)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const contactId = e.dataTransfer.getData('text/plain')
    const contact = leftWorkspaceContacts.find(c => c.id === contactId)
    
    if (contact) {
      setRightWorkspaceContacts(prev => [...prev, contact])
      setLeftWorkspaceContacts(prev => prev.filter(c => c.id !== contactId))
    }
  }, [leftWorkspaceContacts])

  // Handle service click
  const handleServiceClick = useCallback((service: string) => {
    if (companyData) {
      const relevantContacts = companyData.contacts.filter(contact => 
        contact.brand === service || 
        contact.therapeuticArea === service ||
        contact.functionalArea === service
      )
      setLeftWorkspaceContacts(relevantContacts)
    }
  }, [companyData])

  // Filter contacts
  const filteredLeftContacts = useMemo(() => {
    return leftWorkspaceContacts.filter(contact => {
      if (contactFilters.functionalAreas.length > 0 && 
          !contactFilters.functionalAreas.includes(contact.functionalArea || '')) {
        return false
      }
      if (contactFilters.known !== 'all') {
        if (contactFilters.known === 'known' && !contact.known) return false
        if (contactFilters.known === 'unknown' && contact.known) return false
      }
      if (contactFilters.therapeuticAreas.length > 0 && 
          !contactFilters.therapeuticAreas.includes(contact.therapeuticArea || '')) {
        return false
      }
      return true
    })
  }, [leftWorkspaceContacts, contactFilters])

  // Toggle insight expansion
  const toggleInsight = useCallback((insightId: string) => {
    setExpandedInsights(prev => {
      const newSet = new Set(prev)
      if (newSet.has(insightId)) {
        newSet.delete(insightId)
      } else {
        newSet.add(insightId)
      }
      return newSet
    })
  }, [])

  // Toggle TA expansion
  const toggleTA = useCallback((ta: string) => {
    setExpandedTAs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(ta)) {
        newSet.delete(ta)
      } else {
        newSet.add(ta)
      }
      return newSet
    })
  }, [])

  // Get agency info for a brand
  const getAgencyInfo = useCallback((brand: any) => {
    const services = brand.services || {}
    const assignedAgencies = Object.values(services).filter(Boolean) as string[]
    
    return {
      hasKlick: assignedAgencies.includes('Klick'),
      hasCompetitor: assignedAgencies.some(agency => agency !== 'Klick' && agency.trim() !== '')
    }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6">
        {/* Company Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Company Selection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search companies..."
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={selectedCompanySlug}
                onChange={(e) => setSelectedCompanySlug(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a company...</option>
                {Object.values(companies)
                  .filter(c => c.name.toLowerCase().includes(companySearch.toLowerCase()))
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(c => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
              </select>
              <Button variant="outline" onClick={() => navigate('/analytics')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Analytics
              </Button>
            </div>
          </CardContent>
        </Card>

        {!company ? (
          <Card>
            <CardContent className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Select a Company</h3>
              <p className="text-gray-500">
                Choose a company from the dropdown above to view its details and analysis.
              </p>
            </CardContent>
          </Card>
        ) : !companyData ? (
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Loading Company Data</h3>
              <p className="text-gray-500">Processing company information...</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Company Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
                  <p className="text-gray-600">Company Overview & Analysis</p>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {getRevenueTier(companyData.totalRevenue)}
                </Badge>
              </div>
            </div>

            {/* Company Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">{formatRevenue(companyData.totalRevenue)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Target className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active Brands</p>
                      <p className="text-2xl font-bold text-gray-900">{companyData.activeBrands}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                      <p className="text-2xl font-bold text-gray-900">{companyData.totalContacts}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Activity className="h-8 w-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Top TA</p>
                      <p className="text-lg font-bold text-gray-900">
                        {companyData.topTA ? `${companyData.topTA[0]} (${companyData.topTA[1]})` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Insights */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-600" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Drug Phases */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => toggleInsight('drug-phases')}
                    >
                      <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                        <FlaskConical className="h-4 w-4" />
                        Drug Phases
                      </h4>
                      {expandedInsights.has('drug-phases') ? 
                        <ChevronDown className="h-4 w-4" /> : 
                        <ChevronRight className="h-4 w-4" />
                      }
                    </div>
                    <p className="text-sm text-blue-700 mt-2">
                      Phase 1: {companyData.phaseAnalysis.phase1} | Phase 2: {companyData.phaseAnalysis.phase2} | Phase 3: {companyData.phaseAnalysis.phase3}
                    </p>
                    {expandedInsights.has('drug-phases') && (
                      <div className="mt-3 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Phase 1:</span>
                          <span className="font-medium">{companyData.phaseAnalysis.phase1}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Phase 2:</span>
                          <span className="font-medium">{companyData.phaseAnalysis.phase2}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Phase 3:</span>
                          <span className="font-medium">{companyData.phaseAnalysis.phase3}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pre-Launch (1Y):</span>
                          <span className="font-medium">{companyData.phaseAnalysis.preLaunch1Y}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pre-Launch (2Y):</span>
                          <span className="font-medium">{companyData.phaseAnalysis.preLaunch2Y}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Launch:</span>
                          <span className="font-medium">{companyData.phaseAnalysis.launch}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Post-Launch:</span>
                          <span className="font-medium">{companyData.phaseAnalysis.postLaunch}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pre-LOE:</span>
                          <span className="font-medium">{companyData.phaseAnalysis.preLOE}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>LOE:</span>
                          <span className="font-medium">{companyData.phaseAnalysis.loe}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Launch Years */}
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => toggleInsight('launch-years')}
                    >
                      <h4 className="font-semibold text-green-800 flex items-center gap-2">
                        <Rocket className="h-4 w-4" />
                        Launch Years
                      </h4>
                      {expandedInsights.has('launch-years') ? 
                        <ChevronDown className="h-4 w-4" /> : 
                        <ChevronRight className="h-4 w-4" />
                      }
                    </div>
                    <p className="text-sm text-green-700 mt-2">
                      {companyData.launchYears.size > 0 
                        ? `${Array.from(companyData.launchYears.values()).reduce((a, b) => a + b, 0)} anticipated launches`
                        : 'No anticipated launches'
                      }
                    </p>
                    {expandedInsights.has('launch-years') && (
                      <div className="mt-3 space-y-2 text-sm">
                        {Array.from(companyData.launchYears.entries())
                          .sort((a, b) => a[0] - b[0])
                          .map(([year, count]) => (
                            <div key={year} className="flex justify-between">
                              <span>{year}:</span>
                              <span className="font-medium">{count} launches</span>
                            </div>
                          ))}
                        {companyData.launchYears.size === 0 && (
                          <p className="text-gray-500 italic">No anticipated launches</p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Contact Network */}
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => toggleInsight('contact-network')}
                    >
                      <h4 className="font-semibold text-purple-800 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Contact Network
                      </h4>
                      {expandedInsights.has('contact-network') ? 
                        <ChevronDown className="h-4 w-4" /> : 
                        <ChevronRight className="h-4 w-4" />
                      }
                    </div>
                    <p className="text-sm text-purple-700 mt-2">
                      {companyData.knownContacts} known contacts ({Math.round((companyData.knownContacts / companyData.totalContacts) * 100)}% coverage)
                    </p>
                    {expandedInsights.has('contact-network') && (
                      <div className="mt-3 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Known:</span>
                          <span className="font-medium text-green-600">{companyData.knownContacts}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Unknown:</span>
                          <span className="font-medium text-yellow-600">{companyData.unknownContacts}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total:</span>
                          <span className="font-medium">{companyData.totalContacts}</span>
                        </div>
                        <div className="mt-2">
                          <p className="text-xs text-gray-600">Top Functional Areas:</p>
                          {Array.from(companyData.functionalAreas.entries())
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 3)
                            .map(([area, count]) => (
                              <div key={area} className="flex justify-between text-xs">
                                <span>{area}:</span>
                                <span>{count}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Therapeutic Area Table */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  Therapeutic Areas & Brands
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border border-gray-300 p-2 bg-gray-50 text-left font-semibold">
                          Therapeutic Area / Brand
                        </th>
                        {companyData.years.map(year => (
                          <th key={year} className="border border-gray-300 p-2 bg-gray-50 text-center font-semibold">
                            {year}
                          </th>
                        ))}
                        <th className="border border-gray-300 p-2 bg-gray-50 text-center font-semibold">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {taTableData.map(taData => (
                        <React.Fragment key={taData.therapeuticArea}>
                          {/* Therapeutic Area Row */}
                          <tr className="bg-gray-100">
                            <td className="border border-gray-300 p-2 font-semibold">
                              <div 
                                className="flex items-center gap-2 cursor-pointer"
                                onClick={() => toggleTA(taData.therapeuticArea)}
                              >
                                {expandedTAs.has(taData.therapeuticArea) ? 
                                  <ChevronDown className="h-4 w-4" /> : 
                                  <ChevronRight className="h-4 w-4" />
                                }
                                {taData.therapeuticArea}
                              </div>
                            </td>
                            {companyData.years.map(year => {
                              const yearRevenue = taData.brands.reduce((sum, brand) => {
                                const brandYearRevenue = companyData.revenueRows
                                  .filter(row => row.brandId === brand.id && row.year === year)
                                  .reduce((s, row) => s + (row.wwSales || 0), 0)
                                return sum + brandYearRevenue
                              }, 0)
                              return (
                                <td key={year} className="border border-gray-300 p-2 text-center">
                                  {formatRevenue(yearRevenue)}
                                </td>
                              )
                            })}
                            <td className="border border-gray-300 p-2 text-center font-semibold">
                              {formatRevenue(taData.totalRevenue)}
                            </td>
                          </tr>
                          {/* Brand Rows */}
                          {expandedTAs.has(taData.therapeuticArea) && taData.brands.map(brand => {
                            const agencyInfo = getAgencyInfo(brand)
                            const borderClass = agencyInfo.hasKlick 
                              ? 'border-blue-500 border-2' 
                              : agencyInfo.hasCompetitor 
                                ? 'border-red-500 border-2' 
                                : 'border-gray-300'
                            
                            return (
                              <tr key={brand.id}>
                                <td className={`border p-2 pl-8 text-sm text-gray-600 ${borderClass}`}>
                                  {brand.name}
                                </td>
                                {companyData.years.map(year => {
                                  const brandYearRevenue = companyData.revenueRows
                                    .filter(row => row.brandId === brand.id && row.year === year)
                                    .reduce((sum, row) => sum + (row.wwSales || 0), 0)
                                  const cellClass = getCellColor(brandYearRevenue)
                                  return (
                                    <td 
                                      key={year} 
                                      className={`border p-2 text-center text-sm ${cellClass} ${borderClass}`}
                                    >
                                      {brandYearRevenue > 0 ? formatRevenue(brandYearRevenue) : '-'}
                                    </td>
                                  )
                                })}
                                <td className={`border p-2 text-center text-sm font-medium ${borderClass}`}>
                                  {formatRevenue(brand.revenue)}
                                </td>
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

            {/* Services & Agencies Heatmap */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-orange-600" />
                  Services & Agencies Heatmap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['AOR', 'DAOR', 'MedComms', 'Market Access'].map(service => (
                    <button
                      key={service}
                      onClick={() => handleServiceClick(service)}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
                    >
                      <h4 className="font-semibold text-gray-900 mb-2">{service}</h4>
                      <p className="text-sm text-gray-600">
                        {company.brands?.filter(b => b.services?.[service as keyof typeof b.services]).length || 0} brands
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contact Workspaces */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Workspace - All Contacts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Available Contacts ({filteredLeftContacts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Applied Filters Display */}
                  {(contactFilters.functionalAreas.length > 0 || contactFilters.known !== 'all' || contactFilters.therapeuticAreas.length > 0) && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Filter className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Applied Filters:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {contactFilters.functionalAreas.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            Functional Areas: {contactFilters.functionalAreas.join(', ')}
                          </Badge>
                        )}
                        {contactFilters.known !== 'all' && (
                          <Badge variant="secondary" className="text-xs">
                            Status: {contactFilters.known}
                          </Badge>
                        )}
                        {contactFilters.therapeuticAreas.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            TAs: {contactFilters.therapeuticAreas.join(', ')}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setContactFilters({
                            functionalAreas: [],
                            known: 'all',
                            therapeuticAreas: []
                          })}
                          className="text-xs h-6 px-2"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Clear All
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Contact Filters */}
                  <div className="mb-4 space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Functional Area</label>
                      <select
                        multiple
                        value={contactFilters.functionalAreas}
                        onChange={(e) => {
                          const values = Array.from(e.target.selectedOptions, option => option.value)
                          setContactFilters(prev => ({ ...prev, functionalAreas: values }))
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        title="Filter by functional area"
                        aria-label="Filter contacts by functional area"
                      >
                        {Array.from(companyData.functionalAreas.keys()).map(area => (
                          <option key={area} value={area}>{area}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Known Status</label>
                      <select
                        value={contactFilters.known}
                        onChange={(e) => setContactFilters(prev => ({ 
                          ...prev, 
                          known: e.target.value as 'all' | 'known' | 'unknown' 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        title="Filter by known status"
                        aria-label="Filter contacts by known status"
                      >
                        <option value="all">All Contacts</option>
                        <option value="known">Known Only</option>
                        <option value="unknown">Unknown Only</option>
                      </select>
                    </div>
                  </div>

                  {/* Contact List */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredLeftContacts.map(contact => (
                      <div
                        key={contact.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, contact.id)}
                        className="p-3 border rounded-lg hover:bg-gray-50 cursor-move"
                      >
                        <ContactCard contact={contact} variant="small" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Right Workspace - Assigned Contacts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-600" />
                    Assigned to Brand ({rightWorkspaceContacts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="min-h-96 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center"
                  >
                    {rightWorkspaceContacts.length === 0 ? (
                      <div className="text-gray-500">
                        <Target className="h-12 w-12 mx-auto mb-4" />
                        <p>Drag contacts here to assign them to this brand</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {rightWorkspaceContacts.map(contact => (
                          <div key={contact.id} className="p-3 border rounded-lg bg-green-50">
                            <ContactCard contact={contact} variant="small" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Competitive Intelligence Insights */}
            <div className="mt-8">
              <CompetitiveIntelligenceInsights 
                contacts={companyData.contacts}
                companyName={company.name}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
