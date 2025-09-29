import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { 
  Building2, 
  Users, 
  Globe, 
  Linkedin, 
  Star,
  TrendingUp,
  Calendar,
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Search,
  ExternalLink
} from 'lucide-react'
import { 
  enhancedGenomeApiService, 
  type ClientOpportunity 
} from '@/lib/enhancedGenomeApi'

interface CompetitorIntelligenceProps {
  clientId: number
  clientName: string
  className?: string
}

export function CompetitorIntelligence({ clientId, clientName, className }: CompetitorIntelligenceProps) {
  const [competitors, setCompetitors] = useState<any[]>([])
  const [opportunities, setOpportunities] = useState<ClientOpportunity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedView, setSelectedView] = useState<'competitors' | 'opportunities'>('competitors')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadCompetitorData()
  }, [clientId])

  const loadCompetitorData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [competitorsData, opportunitiesData] = await Promise.allSettled([
        enhancedGenomeApiService.getClientCompetitors(clientId),
        enhancedGenomeApiService.getClientOpportunities(clientId)
      ])

      if (competitorsData.status === 'fulfilled') {
        setCompetitors(competitorsData.value)
      }

      if (opportunitiesData.status === 'fulfilled') {
        setOpportunities(opportunitiesData.value)
      }
    } catch (err) {
      setError('Failed to load competitor intelligence data')
      console.error('Competitor intelligence error:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredCompetitors = competitors.filter((competitor: any) =>
    competitor.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    competitor.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredOpportunities = opportunities.filter(opportunity =>
    opportunity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opportunity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opportunity.contact_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getOpportunityStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return 'text-blue-600 bg-blue-50'
      case 'won': return 'text-green-600 bg-green-50'
      case 'lost': return 'text-red-600 bg-red-50'
      case 'on_hold': return 'text-yellow-600 bg-yellow-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getOpportunityStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Target className="h-4 w-4 text-blue-500" />
      case 'won': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'lost': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'on_hold': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default: return <Target className="h-4 w-4 text-gray-500" />
    }
  }

  const totalOpportunityValue = opportunities.reduce((sum, opp) => sum + (opp.value || 0), 0)
  const activeOpportunities = opportunities.filter(opp => opp.status === 'active').length
  const wonOpportunities = opportunities.filter(opp => opp.status === 'won').length

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Competitive Intelligence - {clientName}
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Competitor analysis and opportunity tracking for strategic insights
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          {/* View Toggle */}
          <div className="flex gap-2">
            <Button
              variant={selectedView === 'competitors' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedView('competitors')}
            >
              <Building2 className="h-4 w-4 mr-2" />
              Competitors ({competitors.length})
            </Button>
            <Button
              variant={selectedView === 'opportunities' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedView('opportunities')}
            >
              <Target className="h-4 w-4 mr-2" />
              Opportunities ({opportunities.length})
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${selectedView}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Summary Statistics */}
          {selectedView === 'opportunities' && opportunities.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-green-50 rounded">
                <div className="text-lg font-bold text-green-600">{activeOpportunities}</div>
                <div className="text-xs text-green-700">Active Opportunities</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded">
                <div className="text-lg font-bold text-blue-600">{wonOpportunities}</div>
                <div className="text-xs text-blue-700">Won Opportunities</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded">
                <div className="text-lg font-bold text-purple-600">
                  {formatCurrency(totalOpportunityValue)}
                </div>
                <div className="text-xs text-purple-700">Total Value</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded">
                <div className="text-lg font-bold text-orange-600">{opportunities.length}</div>
                <div className="text-xs text-orange-700">Total Opportunities</div>
              </div>
            </div>
          )}

          {/* Competitors View */}
          {selectedView === 'competitors' && (
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Loading competitors...
                </div>
              ) : filteredCompetitors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'No competitors found matching your search' : 'No competitors found for this client'}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCompetitors.map((competitor: any) => (
                    <div key={competitor.id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {competitor.logo_url && (
                              <img
                                src={competitor.logo_url}
                                alt={`${competitor.company} logo`}
                                className="w-8 h-8 rounded"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            )}
                            <div>
                              <h3 className="font-medium">{competitor.company}</h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Users className="h-3 w-3" />
                                {competitor.employee_count.toLocaleString()} employees
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {competitor.description}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {competitor.website_url && (
                              <a
                                href={competitor.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 hover:text-blue-600"
                              >
                                <Globe className="h-3 w-3" />
                                Website
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            {competitor.linkedin_id && (
                              <a
                                href={`https://linkedin.com/company/${competitor.linkedin_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 hover:text-blue-600"
                              >
                                <Linkedin className="h-3 w-3" />
                                LinkedIn
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {competitor.total_companies} companies
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {competitor.total_contacts} contacts
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-4">
                          {competitor.is_favorite && (
                            <Badge variant="outline" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Favorite
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {competitor.is_competitor ? 'Competitor' : 'Partner'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Opportunities View */}
          {selectedView === 'opportunities' && (
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Loading opportunities...
                </div>
              ) : filteredOpportunities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'No opportunities found matching your search' : 'No opportunities found for this client'}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOpportunities.map((opportunity) => (
                    <div key={opportunity.id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getOpportunityStatusIcon(opportunity.status)}
                            <h3 className="font-medium">{opportunity.title}</h3>
                            <Badge className={getOpportunityStatusColor(opportunity.status)}>
                              {opportunity.status.toUpperCase()}
                            </Badge>
                          </div>
                          
                          {opportunity.description && (
                            <p className="text-sm text-muted-foreground mb-3">
                              {opportunity.description}
                            </p>
                          )}
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-muted-foreground">
                            {opportunity.value && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {formatCurrency(opportunity.value, opportunity.currency)}
                              </div>
                            )}
                            {opportunity.stage && (
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                {opportunity.stage}
                              </div>
                            )}
                            {opportunity.probability && (
                              <div className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                {opportunity.probability}% probability
                              </div>
                            )}
                            {opportunity.expected_close_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(opportunity.expected_close_date)}
                              </div>
                            )}
                          </div>
                          
                          {opportunity.contact_name && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              Contact: {opportunity.contact_name}
                              {opportunity.contact_email && ` (${opportunity.contact_email})`}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
