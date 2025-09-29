import { useParams, useNavigate } from 'react-router-dom'
import { usePharmaVisualPivotStore } from '@/data/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useMemo, useState, useCallback, useEffect } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Target, 
  DollarSign, 
  ArrowLeft,
  Edit,
  Eye,
  EyeOff,
  BarChart3,
  PieChart
} from 'lucide-react'
import { Navigation } from '@/components/Shared/Navigation'
import { ContactCard } from '@/components/Contacts/ContactCard'
import { CompetitiveIntelligenceInsights } from '@/components/Company/CompetitiveIntelligenceInsights'
import { CompanyDebugger } from '@/components/Debug/CompanyDebugger'
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

export function Company() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { companies } = usePharmaVisualPivotStore()
  const company = slug ? companies[slug] : null

  // Debug logging
  console.log('Company page debug:', {
    slug,
    companiesCount: Object.keys(companies).length,
    companySlugs: Object.keys(companies),
    company: company ? { name: company.name, slug: company.slug } : null
  })

  // State management
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)
  const [showOrgChart, setShowOrgChart] = useState(false)
  const [leftWorkspaceContacts, setLeftWorkspaceContacts] = useState<Contact[]>([])
  const [rightWorkspaceContacts, setRightWorkspaceContacts] = useState<Contact[]>([])
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [contactFilters, setContactFilters] = useState({
    functionalAreas: [] as string[],
    known: 'all' as 'all' | 'known' | 'unknown',
    therapeuticAreas: [] as string[]
  })

  // Company data processing
  const companyData = useMemo(() => {
    if (!company) return null

    // Add error handling for missing revenueRows
    if (!company.revenueRows || company.revenueRows.length === 0) {
      console.warn('Company has no revenue data:', company.name)
      return {
        ...company,
        totalRevenue: 0,
        revenueGrowth: 0,
        brandRevenue: company.brands.map(brand => ({ ...brand, revenue: 0, revenueTier: '0-100M' })),
        topTA: ['Unknown', 0],
        contacts: company.contacts || [],
        serviceOptions: ['Unknown'],
        tier: company.tier || 'UNCLASSIFIED',
        years: [],
        functionalAreas: [],
        taContacts: {},
        brands: company.brands || []
      }
    }

    const years = Array.from(new Set(company.revenueRows.map(r => r.year))).sort()
    
    if (years.length === 0) {
      console.warn('Company has no revenue years:', company.name)
      return {
        ...company,
        totalRevenue: 0,
        revenueGrowth: 0,
        brandRevenue: company.brands.map(brand => ({ ...brand, revenue: 0, revenueTier: '0-100M' })),
        topTA: ['Unknown', 0],
        contacts: company.contacts || [],
        serviceOptions: ['Unknown'],
        tier: company.tier || 'UNCLASSIFIED',
        years: [],
        functionalAreas: [],
        taContacts: {},
        brands: company.brands || []
      }
    }
    
    const latestYear = Math.max(...years)
    const previousYear = latestYear - 1

    // Revenue analysis
    const totalRevenue = company.revenueRows
      .filter(r => r.year === latestYear)
      .reduce((sum, r) => sum + (r.wwSales || 0), 0)
    
    const previousRevenue = company.revenueRows
      .filter(r => r.year === previousYear)
      .reduce((sum, r) => sum + (r.wwSales || 0), 0)
    
    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0

    // Brand analysis
    const brandRevenue = company.brands.map(brand => {
      const brandRevenue = company.revenueRows
        .filter(r => r.brandId === brand.id && r.year === latestYear)
        .reduce((sum, r) => sum + (r.wwSales || 0), 0)
      
      return {
        ...brand,
        revenue: brandRevenue,
        revenueTier: getRevenueTier(brandRevenue)
      }
    }).sort((a, b) => b.revenue - a.revenue)

    // Therapeutic area analysis
    const taRevenue = company.brands.reduce((acc, brand) => {
      const ta = brand.therapeuticArea || 'Unknown'
      const revenue = company.revenueRows
        .filter(r => r.brandId === brand.id && r.year === latestYear)
        .reduce((sum, r) => sum + (r.wwSales || 0), 0)
      
      acc[ta] = (acc[ta] || 0) + revenue
      return acc
    }, {} as Record<string, number>)

    const topTA = Object.entries(taRevenue)
      .sort(([,a], [,b]) => b - a)[0]

    // Contact analysis
    const contacts = company.contacts || []
    const knownContacts = contacts.filter(c => c.known === true).length
    const unknownContacts = contacts.filter(c => c.known === false).length
    
    const functionalAreas = Array.from(new Set(contacts.map(c => c.functionalArea).filter(Boolean)))
    const taContacts = Array.from(new Set(contacts.map(c => c.therapeuticArea).filter(Boolean)))

    return {
      years,
      latestYear,
      previousYear,
      totalRevenue,
      previousRevenue,
      revenueGrowth,
      brandRevenue,
      taRevenue,
      topTA,
      contacts,
      knownContacts,
      unknownContacts,
      functionalAreas,
      taContacts
    }
  }, [company])

  // Initialize workspace contacts
  useEffect(() => {
    if (companyData) {
      setLeftWorkspaceContacts(companyData.contacts)
      setRightWorkspaceContacts([])
    }
  }, [companyData])

  // Filter contacts for left workspace
  const filteredLeftContacts = useMemo(() => {
    return leftWorkspaceContacts.filter(contact => {
      if (contactFilters.functionalAreas.length > 0 && !contactFilters.functionalAreas.includes(contact.functionalArea || '')) {
        return false
      }
      if (contactFilters.known !== 'all') {
        if (contactFilters.known === 'known' && contact.known !== true) return false
        if (contactFilters.known === 'unknown' && contact.known !== false) return false
      }
      if (contactFilters.therapeuticAreas.length > 0 && !contactFilters.therapeuticAreas.includes(contact.therapeuticArea || '')) {
        return false
      }
      return true
    })
  }, [leftWorkspaceContacts, contactFilters])

  // Handle contact selection
  const handleContactSelect = useCallback((contactId: string, selected: boolean) => {
    setSelectedContacts(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(contactId)
      } else {
        newSet.delete(contactId)
      }
      return newSet
    })
  }, [])

  // Handle drag and drop
  const handleDragStart = useCallback((e: React.DragEvent, contact: Contact) => {
    e.dataTransfer.setData('text/plain', contact.id)
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
      setSelectedContacts(prev => {
        const newSet = new Set(prev)
        newSet.delete(contactId)
        return newSet
      })
    }
  }, [leftWorkspaceContacts])

  // Handle service click
  const handleServiceClick = useCallback((service: string) => {
    // Filter contacts by service/brand/therapeutic area
    if (companyData) {
      const relevantContacts = companyData.contacts.filter(contact => 
        contact.brand === service || 
        contact.therapeuticArea === service ||
        contact.functionalArea === service
      )
      setLeftWorkspaceContacts(relevantContacts)
    }
  }, [companyData])

  if (!company) {
    return (
      <div className="min-h-screen bg-background">
        <CompanyDebugger />
        <Navigation />
        <div className="container mx-auto p-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Company Not Found</h1>
            <p className="text-gray-600 mb-6">The company you're looking for doesn't exist.</p>
            <p className="text-sm text-gray-500 mb-4">Slug: {slug}</p>
            <Button onClick={() => navigate('/analytics')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Analytics
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!companyData) {
    return (
      <div className="min-h-screen bg-background">
        <CompanyDebugger />
        <Navigation />
        <div className="container mx-auto p-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading Company Data</h1>
            <p className="text-gray-600 mb-6">Processing company information...</p>
            <p className="text-sm text-gray-500 mb-4">Company: {company.name}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <CompanyDebugger />
      <Navigation />
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/analytics')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Analytics
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
              <p className="text-gray-600">Company Overview & Contact Management</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowOrgChart(!showOrgChart)}>
              {showOrgChart ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showOrgChart ? 'Hide' : 'Show'} Org Chart
            </Button>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Company
            </Button>
          </div>
        </div>

        {/* Company Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold">{formatRevenue(companyData.totalRevenue)}</p>
                  <p className={`text-sm flex items-center gap-1 ${
                    companyData.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {companyData.revenueGrowth >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {Math.abs(companyData.revenueGrowth).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Brands</p>
                  <p className="text-2xl font-bold">{company.brands.length}</p>
                  <p className="text-sm text-gray-500">Top: {companyData.brandRevenue[0]?.name || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Contacts</p>
                  <p className="text-2xl font-bold">{companyData.contacts.length}</p>
                  <p className="text-sm text-gray-500">
                    {companyData.knownContacts} known, {companyData.unknownContacts} unknown
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Top Therapeutic Area</p>
                  <p className="text-lg font-bold">{companyData.topTA?.[0] || 'Unknown'}</p>
                  <p className="text-sm text-gray-500">
                    {formatRevenue(Number(companyData.topTA?.[1]) || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Contact Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Functional Areas</h4>
                <div className="space-y-2">
                  {companyData.functionalAreas.map(area => (
                    <div key={area} className="flex items-center justify-between">
                      <span className="text-sm">{area}</span>
                      <Badge variant="secondary">
                        {companyData.contacts.filter(c => c.functionalArea === area).length}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Known vs Unknown</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-600">Known to Klick</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {companyData.knownContacts}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Unknown</span>
                    <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                      {companyData.unknownContacts}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Therapeutic Areas</h4>
                <div className="space-y-2">
                  {Object.keys(companyData.taContacts || {}).slice(0, 5).map((ta: string) => (
                    <div key={ta} className="flex items-center justify-between">
                      <span className="text-sm">{ta}</span>
                      <Badge variant="secondary">
                        {companyData.contacts.filter(c => c.therapeuticArea === ta).length}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Competitive Intelligence Insights */}
        <CompetitiveIntelligenceInsights 
          contacts={companyData.contacts} 
          companyName={company.name} 
        />

        {/* Brand Graphs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Brand Revenue Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {companyData.brandRevenue.map(brand => (
                <Card 
                  key={brand.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedBrand(brand.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm">{brand.name}</h4>
                      <Badge variant="outline">{brand.revenueTier}</Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">{brand.therapeuticArea}</p>
                    <div className="h-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={companyData.years.map(year => ({
                          year,
                          revenue: company.revenueRows
                            .filter(r => r.brandId === brand.id && r.year === year)
                            .reduce((sum, r) => sum + (r.wwSales || 0), 0)
                        }))}>
                          <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(value) => [formatRevenue(Number(value)), 'Revenue']} />
                          <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-sm font-medium text-right mt-2">
                      {formatRevenue(brand.revenue)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Service & Agency Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Services & Agencies Heatmap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Services</h4>
                <div className="grid grid-cols-2 gap-2">
                  {['AOR', 'DAOR', 'Market Access', 'MedComms', 'Media', 'Tech', 'Consulting'].map(service => (
                    <Button
                      key={service}
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      onClick={() => handleServiceClick(service)}
                    >
                      {service}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Agencies</h4>
                <div className="space-y-2">
                  {company.brands.map(brand => (
                    <div key={brand.id} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{brand.name}</span>
                      <div className="flex gap-1">
                        {Object.values(brand.services || {}).filter(Boolean).map((agency, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {agency}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Workspaces */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Workspace - Available Contacts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Available Contacts ({filteredLeftContacts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="mb-4 space-y-3">
                <div>
                  <label className="text-sm font-medium">Functional Areas</label>
                  <select
                    multiple
                    className="w-full p-2 border rounded"
                    value={contactFilters.functionalAreas}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value)
                      setContactFilters(prev => ({ ...prev, functionalAreas: selected }))
                    }}
                    title="Select functional areas"
                    aria-label="Functional areas filter"
                  >
                    {companyData.functionalAreas.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Known Status</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={contactFilters.known}
                    onChange={(e) => setContactFilters(prev => ({ ...prev, known: e.target.value as any }))}
                    title="Filter by known status"
                    aria-label="Known status filter"
                  >
                    <option value="all">All</option>
                    <option value="known">Known</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
              </div>

              {/* Contact List */}
              <div 
                className="space-y-2 max-h-96 overflow-y-auto"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {filteredLeftContacts.map(contact => (
                  <div key={contact.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedContacts.has(contact.id)}
                      onChange={(e) => handleContactSelect(contact.id, e.target.checked)}
                      className="rounded"
                      title={`Select ${contact.firstName} ${contact.lastName}`}
                      aria-label={`Select contact ${contact.firstName} ${contact.lastName}`}
                    />
                    <ContactCard 
                      contact={contact} 
                      variant="small" 
                      draggable={true}
                      onDragStart={handleDragStart}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Right Workspace - Assigned Contacts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Assigned to Brand ({rightWorkspaceContacts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {rightWorkspaceContacts.map(contact => (
                  <div key={contact.id} className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRightWorkspaceContacts(prev => prev.filter(c => c.id !== contact.id))
                        setLeftWorkspaceContacts(prev => [...prev, contact])
                      }}
                    >
                      Remove
                    </Button>
                    <ContactCard contact={contact} variant="small" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Brand Detail Modal */}
        {selectedBrand && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Brand Details: {company.brands.find(b => b.id === selectedBrand)?.name}</span>
                <Button variant="outline" onClick={() => setSelectedBrand(null)}>
                  Close
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Revenue by Year</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Year</th>
                          <th className="text-right p-2">WW Revenue</th>
                          <th className="text-right p-2">US Revenue</th>
                          <th className="text-right p-2">Growth</th>
                        </tr>
                      </thead>
                      <tbody>
                        {companyData.years.map(year => {
                          const yearData = company.revenueRows.filter(r => r.brandId === selectedBrand && r.year === year)[0]
                          const prevYearData = company.revenueRows.filter(r => r.brandId === selectedBrand && r.year === year - 1)[0]
                          const growth = prevYearData && prevYearData.wwSales && prevYearData.wwSales > 0 
                            ? ((yearData?.wwSales || 0) - prevYearData.wwSales) / prevYearData.wwSales * 100 
                            : 0
                          
                          return (
                            <tr key={year} className="border-b">
                              <td className="p-2">{year}</td>
                              <td className="p-2 text-right">{formatRevenue(yearData?.wwSales || 0)}</td>
                              <td className="p-2 text-right">{formatRevenue(yearData?.usSales || 0)}</td>
                              <td className={`p-2 text-right ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {growth.toFixed(1)}%
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}