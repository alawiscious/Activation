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
  Eye,
  EyeOff,
  BarChart3,
  Building2,
  Network,
  Activity,
  Star
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

export function CompanyNew() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { companies } = usePharmaVisualPivotStore()
  const company = slug ? companies[slug] : null

  // State management
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)
  const [showOrgChart, setShowOrgChart] = useState(false)
  const [leftWorkspaceContacts, setLeftWorkspaceContacts] = useState<Contact[]>([])
  const [rightWorkspaceContacts, setRightWorkspaceContacts] = useState<Contact[]>([])
  const [contactFilters, setContactFilters] = useState({
    functionalAreas: [] as string[],
    known: 'all' as 'all' | 'known' | 'unknown',
    therapeuticAreas: [] as string[]
  })

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

      // Contact analysis
      const contacts = company.contacts || []
      const knownContacts = contacts.filter(c => c.known === true).length
      const unknownContacts = contacts.length - knownContacts

      // Functional area breakdown
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
        contacts
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
        contacts: []
      }
    }
  }, [company])

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

  if (!company) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto p-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {slug ? 'Company Not Found' : 'Select a Company'}
            </h1>
            <p className="text-gray-600 mb-6">
              {slug 
                ? 'The company you\'re looking for doesn\'t exist.'
                : 'Please select a company from the Analytics page to view its details.'
              }
            </p>
            {slug && <p className="text-sm text-gray-500 mb-4">Slug: {slug}</p>}
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
      <Navigation />
      <div className="container mx-auto p-6">
        {/* Company Header */}
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate('/analytics')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Analytics
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
              <p className="text-gray-600">Company Overview & Management</p>
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

        {/* Key Insights */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Growth Analysis</h4>
                <p className="text-sm text-blue-700">
                  {companyData.totalRevenue > 0 
                    ? `Strong revenue base of ${formatRevenue(companyData.totalRevenue)}`
                    : 'No revenue data available'
                  }
                </p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Brand Portfolio</h4>
                <p className="text-sm text-green-700">
                  {companyData.activeBrands} active brands across {companyData.topTA ? companyData.topTA[0] : 'multiple'} therapeutic areas
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-purple-800 mb-2">Contact Network</h4>
                <p className="text-sm text-purple-700">
                  {companyData.knownContacts} known contacts ({Math.round((companyData.knownContacts / companyData.totalContacts) * 100)}% coverage)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Summary Dashboard */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Contact Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Functional Areas */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Contacts by Functional Area</h4>
                <div className="space-y-2">
                  {Array.from(companyData.functionalAreas.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([area, count]) => (
                      <div key={area} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="font-medium">{area}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                </div>
              </div>

              {/* Known vs Unknown */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Contact Status</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="font-medium text-green-800">Known Contacts</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {companyData.knownContacts}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                    <span className="font-medium text-yellow-800">Unknown Contacts</span>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      {companyData.unknownContacts}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organizational Chart */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5 text-purple-600" />
                Organizational Chart
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOrgChart(!showOrgChart)}
              >
                {showOrgChart ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showOrgChart ? 'Hide' : 'Show'} Chart
              </Button>
            </div>
          </CardHeader>
          {showOrgChart && (
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Network className="h-12 w-12 mx-auto mb-4" />
                <p>Organizational chart visualization will be implemented here</p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Brand Revenue Trends */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              Brand Revenue Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {company.brands?.slice(0, 6).map((brand) => {
                const brandRevenue = companyData.revenueRows
                  .filter(row => row.brandId === brand.id)
                  .reduce((sum, row) => sum + (row.wwSales || 0), 0)
                
                return (
                  <div
                    key={brand.id}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedBrand(brand.id)}
                  >
                    <h4 className="font-semibold text-gray-900 mb-2">{brand.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{brand.therapeuticArea || 'Unknown TA'}</p>
                    <p className="text-lg font-bold text-green-600">{formatRevenue(brandRevenue)}</p>
                    <p className="text-xs text-gray-500 mt-1">{brand.indicationMarketStatus || 'Unknown Stage'}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Brand Detail Modal */}
        {selectedBrand && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">
                  {company.brands?.find(b => b.id === selectedBrand)?.name} - Revenue Details
                </h3>
                <Button variant="outline" onClick={() => setSelectedBrand(null)}>
                  Close
                </Button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-2 text-left">Year</th>
                      <th className="border border-gray-300 p-2 text-right">WW Sales</th>
                      <th className="border border-gray-300 p-2 text-right">US Sales</th>
                      <th className="border border-gray-300 p-2 text-right">Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyData.revenueRows
                      .filter(row => row.brandId === selectedBrand)
                      .sort((a, b) => a.year - b.year)
                      .map((row, index, array) => {
                        const prevRow = array[index - 1]
                        const growth = prevRow 
                          ? ((row.wwSales || 0) - (prevRow.wwSales || 0)) / (prevRow.wwSales || 1) * 100
                          : 0
                        
                        return (
                          <tr key={row.year}>
                            <td className="border border-gray-300 p-2">{row.year}</td>
                            <td className="border border-gray-300 p-2 text-right">{formatRevenue(row.wwSales || 0)}</td>
                            <td className="border border-gray-300 p-2 text-right">{formatRevenue(row.usSales || 0)}</td>
                            <td className={`border border-gray-300 p-2 text-right ${growth > 0 ? 'text-green-600' : growth < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                              {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

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
      </div>
    </div>
  )
}
