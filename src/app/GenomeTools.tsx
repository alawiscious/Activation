import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  Dna, 
  TestTube, 
  Search, 
  Bug, 
  Database,
  Settings,
  Activity,
  Users,
  Building2,
  ChevronDown
} from 'lucide-react'
import { Navigation } from '@/components/Shared/Navigation'
import { BulkGenomeEnrichment } from '@/components/Contacts/BulkGenomeEnrichment'
import { ContactMatchingTool } from '@/components/Contacts/ContactMatchingTool'
import { OptimizedBulkGenomeEnrichment } from '@/components/Contacts/OptimizedBulkGenomeEnrichment'
import { EnhancedGenomeEnrichment } from '@/components/Contacts/EnhancedGenomeEnrichment'
import { ClientSearchTool } from '@/components/Contacts/ClientSearchTool'
import { GenomeIdAnalyzer } from '@/components/Contacts/GenomeIdAnalyzer'
import { GenomeDataPlayground } from '@/components/Contacts/GenomeDataPlayground'
import GenomeApiDebugger from '@/components/Contacts/GenomeApiDebugger'
import { ContactRulesInterface } from '@/components/Contacts/ContactRulesInterface'
import { CompetitiveAgencyExtractor } from '@/components/GenomeTools/CompetitiveAgencyExtractor'
import { usePharmaVisualPivotStore } from '@/data/store'
import { useMemo } from 'react'

export function GenomeTools() {
  const { currentCompanySlug, companies, setCurrentCompany } = usePharmaVisualPivotStore()
  const [activeTab, setActiveTab] = useState<'enrichment' | 'testing' | 'debugging' | 'search' | 'rules' | 'agencies'>('enrichment')
  const [showCompanySelector, setShowCompanySelector] = useState(false)
  const [companySearchTerm, setCompanySearchTerm] = useState('')
  
  const availableCompanies = Object.values(companies)
  const currentCompany = currentCompanySlug && currentCompanySlug !== '__all_companies__' ? companies[currentCompanySlug] : null
  const isAllCompanies = currentCompanySlug === '__all_companies__'
  const activeContacts = useMemo(() => {
    if (isAllCompanies) {
      return availableCompanies.flatMap(company => 
        company.contacts.filter(contact => !contact.isIrrelevant)
      )
    }
    if (!currentCompany) return []
    return currentCompany.contacts.filter(contact => !contact.isIrrelevant)
  }, [currentCompany, isAllCompanies, availableCompanies])
  
  // Filter companies based on search term
  const filteredCompanies = useMemo(() => {
    if (!companySearchTerm.trim()) return availableCompanies
    return availableCompanies.filter(company => 
      company.name.toLowerCase().includes(companySearchTerm.toLowerCase())
    )
  }, [availableCompanies, companySearchTerm])
  
  // Calculate total contacts across all companies
  const totalContacts = useMemo(() => {
    return availableCompanies.reduce((sum, company) => 
      sum + company.contacts.filter(c => !c.isIrrelevant).length, 0
    )
  }, [availableCompanies])

  const tabs = [
    { id: 'enrichment', label: 'Enrichment', icon: Dna, description: 'Bulk contact enrichment and data processing' },
    { id: 'testing', label: 'Testing', icon: TestTube, description: 'API testing and data validation' },
    { id: 'debugging', label: 'Debugging', icon: Bug, description: 'API debugging and troubleshooting' },
    { id: 'search', label: 'Search', icon: Search, description: 'Client and contact search tools' },
    { id: 'rules', label: 'Rules', icon: Settings, description: 'Contact classification rules and matrix' },
    { id: 'agencies', label: 'Agencies', icon: Building2, description: 'Extract and analyze competitive agencies from Genome API' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Dna className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Genome Tools</h1>
              <p className="text-gray-600 mt-1">
                Advanced Genome API tools for contact enrichment, testing, and debugging
              </p>
            </div>
          </div>
          
          {/* Company Info */}
          <div className="p-4 bg-white rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Building2 className="h-5 w-5 text-gray-500" />
                <div>
                  <span className="text-sm text-gray-500">Current Selection:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {isAllCompanies ? 'All Companies' : currentCompany?.name || 'No company selected'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {isAllCompanies 
                      ? `${totalContacts} total contacts across ${availableCompanies.length} companies`
                      : `${activeContacts.length} active contacts`
                    }
                  </span>
                </div>
              </div>
              
              {/* Company Selector */}
              {availableCompanies.length > 1 && (
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCompanySelector(!showCompanySelector)}
                    className="flex items-center space-x-2"
                  >
                    <span>Change Company</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  
                  {showCompanySelector && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white border rounded-lg shadow-lg z-10">
                      <div className="p-3">
                        <div className="text-xs font-medium text-gray-500 mb-2">Select Company:</div>
                        
                        {/* Search Input */}
                        <div className="mb-3">
                          <input
                            type="text"
                            placeholder="Search companies..."
                            value={companySearchTerm}
                            onChange={(e) => setCompanySearchTerm(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        
                        {/* All Companies Option */}
                        <button
                          onClick={() => {
                            setCurrentCompany('__all_companies__')
                            setShowCompanySelector(false)
                            setCompanySearchTerm('')
                          }}
                          className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 mb-2 ${
                            currentCompanySlug === '__all_companies__' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-700'
                          }`}
                        >
                          <div className="font-medium flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            All Companies
                          </div>
                          <div className="text-xs text-gray-500">
                            {totalContacts} total contacts across {availableCompanies.length} companies
                          </div>
                        </button>
                        
                        {/* Company List */}
                        <div className="max-h-64 overflow-y-auto">
                          {filteredCompanies.length > 0 ? (
                            filteredCompanies.map((company) => (
                              <button
                                key={company.slug}
                                onClick={() => {
                                  setCurrentCompany(company.slug)
                                  setShowCompanySelector(false)
                                  setCompanySearchTerm('')
                                }}
                                className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 ${
                                  currentCompanySlug === company.slug ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                }`}
                              >
                                <div className="font-medium">{company.name}</div>
                                <div className="text-xs text-gray-500">
                                  {company.contacts.filter(c => !c.isIrrelevant).length} contacts
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-gray-500 text-center">
                              No companies found matching "{companySearchTerm}"
                            </div>
                          )}
                        </div>
                        
                        {/* Results Count */}
                        {companySearchTerm && (
                          <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500 text-center">
                            {filteredCompanies.length} of {availableCompanies.length} companies
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
          <div className="mt-2">
            <p className="text-sm text-gray-600">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'enrichment' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Optimized Bulk Genome Enrichment */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="h-5 w-5 text-green-600" />
                      <span>Optimized Bulk Enrichment</span>
                      <Badge className="bg-green-100 text-green-800">Recommended</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      High-performance bulk enrichment with batching, concurrency, and progress tracking.
                    </p>
                    <OptimizedBulkGenomeEnrichment contacts={activeContacts} />
                  </CardContent>
                </Card>

                {/* Enhanced Genome Enrichment */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Database className="h-5 w-5 text-blue-600" />
                      <span>Enhanced Enrichment</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Advanced enrichment with comprehensive client insights and competitive intelligence.
                    </p>
                    <EnhancedGenomeEnrichment contacts={activeContacts} />
                  </CardContent>
                </Card>
              </div>

              {/* Original Bulk Genome Enrichment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Dna className="h-5 w-5 text-gray-600" />
                    <span>Original Bulk Enrichment</span>
                    <Badge variant="outline" className="text-gray-600">Legacy</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Original implementation kept for comparison and testing purposes.
                  </p>
                  <BulkGenomeEnrichment contacts={activeContacts} />
                </CardContent>
              </Card>

              {/* Contact Matching Tool */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    <span>Contact Matching Tool</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Match local contacts with Genome API data using various matching algorithms.
                  </p>
                  <ContactMatchingTool contacts={activeContacts} />
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'testing' && (
            <div className="space-y-6">
              {/* Genome Data Playground */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TestTube className="h-5 w-5 text-blue-600" />
                    <span>Genome Data Playground</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Interactive testing environment for all Genome API endpoints with real-time results.
                  </p>
                  <GenomeDataPlayground />
                </CardContent>
              </Card>

              {/* Genome ID Analyzer */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5 text-orange-600" />
                    <span>Genome ID Analyzer</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Analyze and validate Genome contact IDs and data structures.
                  </p>
                  <GenomeIdAnalyzer contacts={activeContacts} />
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'debugging' && (
            <div className="space-y-6">
              {/* Genome API Debugger */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bug className="h-5 w-5 text-red-600" />
                    <span>Genome API Debugger</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Comprehensive API testing and debugging tool to diagnose connection and authentication issues.
                  </p>
                  <GenomeApiDebugger />
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'search' && (
            <div className="space-y-6">
              {/* Client Search Tool */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Search className="h-5 w-5 text-green-600" />
                    <span>Client Search Tool</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Advanced client search with filtering and Genome API integration.
                  </p>
                  <ClientSearchTool 
                    onClientSelected={(client) => {
                      console.log('Selected client:', client)
                      // Here you could navigate to client details or update the current company
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-6">
              <ContactRulesInterface />
            </div>
          )}

          {activeTab === 'agencies' && (
            <div className="space-y-6">
              <CompetitiveAgencyExtractor />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
