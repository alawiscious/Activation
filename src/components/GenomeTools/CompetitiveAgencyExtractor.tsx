import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Building2, 
  Search, 
  RefreshCw, 
  Download, 
  Globe, 
  Users, 
  MapPin,
  AlertTriangle,
  CheckCircle,
  Database,
  Trash2
} from 'lucide-react'
import { competitiveAgencyExtractor, type AgencyExtractionResult } from '@/lib/competitiveAgencyExtractor'

interface CompetitiveAgencyExtractorProps {
  className?: string
}

export function CompetitiveAgencyExtractor({ className }: CompetitiveAgencyExtractorProps) {
  const [loading, setLoading] = useState(false)
  const [extractionResult, setExtractionResult] = useState<AgencyExtractionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all')
  const [selectedSize, setSelectedSize] = useState<string>('all')

  // Load cached data on mount
  useEffect(() => {
    const cachedAgencies = competitiveAgencyExtractor.getCachedAgencies()
    if (cachedAgencies.length > 0) {
      setExtractionResult({
        agencies: cachedAgencies,
        totalFound: cachedAgencies.length,
        lastUpdated: new Date().toISOString(),
        extractionMethod: 'manual_analysis'
      })
    }
  }, [])

  const handleExtractAgencies = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await competitiveAgencyExtractor.extractAllCompetitiveAgencies()
      setExtractionResult(result)
    } catch (err) {
      setError('Failed to extract competitive agencies from Genome API')
      console.error('Agency extraction error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleClearCache = () => {
    competitiveAgencyExtractor.clearCache()
    setExtractionResult(null)
  }

  const handleExportAgencies = () => {
    if (!extractionResult) return

    const csvContent = [
      ['Name', 'Industry', 'Size', 'Location', 'Website', 'Relationship Status', 'Last Activity'],
      ...extractionResult.agencies.map(agency => [
        agency.name,
        agency.industry,
        agency.size,
        agency.location,
        agency.website || '',
        agency.relationshipStatus,
        agency.lastActivity || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `competitive_agencies_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Filter agencies based on search and filters
  const filteredAgencies = extractionResult?.agencies.filter(agency => {
    const matchesSearch = agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agency.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agency.location.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesIndustry = selectedIndustry === 'all' || agency.industry === selectedIndustry
    const matchesSize = selectedSize === 'all' || agency.size === selectedSize
    
    return matchesSearch && matchesIndustry && matchesSize
  }) || []

  // Get unique industries and sizes for filter dropdowns
  const industries = [...new Set(extractionResult?.agencies.map(a => a.industry) || [])].sort()
  const sizes = [...new Set(extractionResult?.agencies.map(a => a.size) || [])].sort()

  const getIndustryColor = (industry: string) => {
    switch (industry.toLowerCase()) {
      case 'healthcare marketing': return 'bg-blue-100 text-blue-800'
      case 'advertising': return 'bg-purple-100 text-purple-800'
      case 'digital consulting': return 'bg-green-100 text-green-800'
      case 'strategy consulting': return 'bg-orange-100 text-orange-800'
      case 'media': return 'bg-pink-100 text-pink-800'
      case 'creative agency': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSizeColor = (size: string) => {
    switch (size.toLowerCase()) {
      case 'large': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'small': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Competitive Agency Extractor
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Extract and analyze all competitive agencies from Genome API data
          </p>
        </CardHeader>
        <CardContent>
          {/* Controls */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Button 
              onClick={handleExtractAgencies} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {loading ? 'Extracting...' : 'Extract from Genome API'}
            </Button>
            
            {extractionResult && (
              <Button 
                onClick={handleExportAgencies} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            )}
            
            <Button 
              onClick={handleClearCache} 
              variant="outline"
              className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Clear Cache
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Error</span>
              </div>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          )}

          {/* Results Summary */}
          {extractionResult && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      {extractionResult.totalFound} agencies found
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-blue-700">
                      Method: {extractionResult.extractionMethod === 'genome_api' ? 'Genome API' : 'Manual Analysis'}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-blue-600">
                  Last updated: {new Date(extractionResult.lastUpdated).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          {extractionResult && extractionResult.agencies.length > 0 && (
            <div className="mb-6 space-y-4">
              <div className="flex flex-wrap gap-4">
                {/* Search */}
                <div className="flex-1 min-w-64">
                  <input
                    type="text"
                    placeholder="Search agencies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {/* Industry Filter */}
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  title="Filter by industry"
                  aria-label="Filter agencies by industry"
                >
                  <option value="all">All Industries</option>
                  {industries.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
                
                {/* Size Filter */}
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  title="Filter by size"
                  aria-label="Filter agencies by size"
                >
                  <option value="all">All Sizes</option>
                  {sizes.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
              
              <div className="text-sm text-gray-600">
                Showing {filteredAgencies.length} of {extractionResult.agencies.length} agencies
              </div>
            </div>
          )}

          {/* Agencies List */}
          {filteredAgencies.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredAgencies.map((agency) => (
                <div key={agency.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{agency.name}</h4>
                      <Badge className={getIndustryColor(agency.industry)}>
                        {agency.industry}
                      </Badge>
                      <Badge className={getSizeColor(agency.size)}>
                        {agency.size}
                      </Badge>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {agency.relationshipStatus}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{agency.location}</span>
                    </div>
                    {agency.website && (
                      <div className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        <a 
                          href={agency.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Website
                        </a>
                      </div>
                    )}
                    {agency.lastActivity && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>Last activity: {new Date(agency.lastActivity).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : extractionResult ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-8 w-8 mx-auto mb-2" />
              <p>No agencies found matching your filters</p>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2" />
              <p>Click "Extract from Genome API" to find competitive agencies</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
