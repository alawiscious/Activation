import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { 
  Search, 
  Building2, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Loader2,
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { 
  enhancedGenomeApiService, 
  type ClientSearchParams, 
  type ClientSearchResult,
  type ClientSearchResponse 
} from '@/lib/enhancedGenomeApi'

interface ClientSearchToolProps {
  onClientSelected?: (client: ClientSearchResult) => void
  className?: string
}

export function ClientSearchTool({ onClientSelected, className }: ClientSearchToolProps) {
  const [loading, setLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<ClientSearchResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Search parameters
  const [searchQuery, setSearchQuery] = useState('')
  const [includeRedEmails, setIncludeRedEmails] = useState(false)
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [pageSize, setPageSize] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const searchParams: ClientSearchParams = {
        q: searchQuery.trim(),
        page_num: currentPage,
        page_size: pageSize,
        include_red_emails: includeRedEmails,
        favorites_only: favoritesOnly
      }

      const results = await enhancedGenomeApiService.searchClients(searchParams)
      setSearchResults(results)
    } catch (err) {
      setError('Failed to search clients')
      console.error('Client search error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = async (newPage: number) => {
    if (!searchQuery.trim()) return

    setLoading(true)
    setCurrentPage(newPage)

    try {
      const searchParams: ClientSearchParams = {
        q: searchQuery.trim(),
        page_num: newPage,
        page_size: pageSize,
        include_red_emails: includeRedEmails,
        favorites_only: favoritesOnly
      }

      const results = await enhancedGenomeApiService.searchClients(searchParams)
      setSearchResults(results)
    } catch (err) {
      setError('Failed to load page')
      console.error('Page change error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getSentimentColor = (client: ClientSearchResult): string => {
    if (client.email_sentiment_score === undefined) return 'text-gray-600 bg-gray-50'
    
    if (client.email_sentiment_score >= 90) return 'text-green-600 bg-green-50'
    if (client.email_sentiment_score >= 70) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getSentimentIcon = (client: ClientSearchResult) => {
    if (client.email_sentiment_score === undefined) return null
    
    if (client.email_sentiment_score >= 90) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (client.email_sentiment_score >= 70) return <TrendingUp className="h-4 w-4 text-yellow-500" />
    return <AlertTriangle className="h-4 w-4 text-red-500" />
  }

  const exportResults = () => {
    if (!searchResults?.data.length) return

    const csvContent = [
      ['Client ID', 'Name', 'Status', 'Industry', 'Size', 'Location', 'Sentiment Score', 'Total Emails', 'Red Emails', 'Blue Emails'],
      ...searchResults.data.map(client => [
        client.id,
        client.name,
        client.status,
        client.industry || '',
        client.size || '',
        client.location || '',
        client.email_sentiment_score || '',
        client.total_emails || '',
        client.red_emails || '',
        client.blue_emails || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `client-search-results-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalPages = searchResults?.pagination.pages || 0
  const hasNext = searchResults?.pagination.has_next || false
  const hasPrev = searchResults?.pagination.has_prev || false

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Client Search Tool
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Search and analyze clients with advanced filtering and sentiment analysis
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients by name, company, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={includeRedEmails}
                  onChange={(e) => setIncludeRedEmails(e.target.checked)}
                  className="rounded"
                />
                Include Red Emails
              </label>
              
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={favoritesOnly}
                  onChange={(e) => setFavoritesOnly(e.target.checked)}
                  className="rounded"
                />
                Favorites Only
              </label>

              <select
                value={pageSize}
                onChange={(e) => setPageSize(parseInt(e.target.value))}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>

            <Button
              onClick={handleSearch}
              disabled={loading || !searchQuery.trim()}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Search Clients
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          {/* Search Results */}
          {searchResults && (
            <div className="space-y-4">
              {/* Results Header */}
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  {searchResults.pagination.total} clients found
                  {searchResults.pagination.total > 0 && (
                    <span className="text-muted-foreground ml-2">
                      (Page {currentPage} of {totalPages})
                    </span>
                  )}
                </div>
                {searchResults.data.length > 0 && (
                  <Button onClick={exportResults} size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                )}
              </div>

              {/* Results List */}
              {searchResults.data.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No clients found matching your search criteria
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.data.map((client) => (
                    <div
                      key={client.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => onClientSelected?.(client)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-medium">{client.name}</h3>
                            {client.status && (
                              <Badge variant="outline" className="text-xs">
                                {client.status}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                            {client.industry && (
                              <div>Industry: {client.industry}</div>
                            )}
                            {client.size && (
                              <div>Size: {client.size}</div>
                            )}
                            {client.location && (
                              <div>Location: {client.location}</div>
                            )}
                            {client.website && (
                              <div>Website: {client.website}</div>
                            )}
                          </div>

                          {/* Email Sentiment */}
                          {client.email_sentiment_score !== undefined && (
                            <div className="mt-2 flex items-center gap-2">
                              {getSentimentIcon(client)}
                              <Badge className={getSentimentColor(client)}>
                                {client.email_sentiment_score.toFixed(0)}% positive sentiment
                              </Badge>
                              {client.total_emails && (
                                <span className="text-xs text-muted-foreground">
                                  ({client.total_emails} total emails)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!hasPrev || loading}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!hasNext || loading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
