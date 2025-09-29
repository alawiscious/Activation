import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { 
  Database, 
  TrendingUp, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Loader2,
  Zap,
  BarChart3
} from 'lucide-react'
import type { Contact } from '@/types/domain'
import { 
  enhancedGenomeApiService, 
  type EmailSentimentTrend,
  type EmailSentimentCompany
} from '@/lib/enhancedGenomeApi'
import { usePharmaVisualPivotStore } from '@/data/store'

interface EnhancedGenomeEnrichmentProps {
  contacts: Contact[]
  onEnrichmentComplete?: (results: any) => void
  className?: string
}

export function EnhancedGenomeEnrichment({ contacts, onEnrichmentComplete, className }: EnhancedGenomeEnrichmentProps) {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [sentimentTrends, setSentimentTrends] = useState<EmailSentimentTrend | null>(null)
  const [enrichedContacts, setEnrichedContacts] = useState<Map<string, any>>(new Map())
  const [error, setError] = useState<string | null>(null)
  const [selectedView, setSelectedView] = useState<'sentiment' | 'contacts' | 'insights'>('sentiment')
  const { updateContact } = usePharmaVisualPivotStore()

  const contactsWithGenomeData = useMemo(() => {
    return contacts.filter(contact => contact.genomeCrmcontactId || contact.contactId)
  }, [contacts])

  const handleFetchSentimentTrends = async () => {
    setLoading(true)
    setError(null)

    try {
      const trends = await enhancedGenomeApiService.getEmailSentimentTrends()
      setSentimentTrends(trends)
    } catch (err) {
      setError('Failed to fetch email sentiment trends')
      console.error('Sentiment trends error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleComprehensiveEnrichment = async () => {
    if (contactsWithGenomeData.length === 0) return

    setLoading(true)
    setError(null)
    setProgress({ current: 0, total: contactsWithGenomeData.length })

    const results = new Map<string, any>()

    try {
      for (let i = 0; i < contactsWithGenomeData.length; i++) {
        const contact = contactsWithGenomeData[i]
        
        try {
          const enrichment = await enhancedGenomeApiService.enrichContactComprehensively(contact)
          results.set(contact.id, enrichment)

          const hasKlicksterTouch = (enrichment.klicksters?.length ?? 0) > 0 || (enrichment.clientKlicksters?.length ?? 0) > 0
          const hasRecentMeetings = (enrichment.meetings?.length ?? 0) > 0 || (enrichment.clientMeetings?.length ?? 0) > 0

          if ((hasKlicksterTouch || hasRecentMeetings) && contact.known !== true) {
            updateContact(contact.id, { known: true })
          }
        } catch (contactError) {
          console.error(`Failed to enrich contact ${contact.id}:`, contactError)
        }

        setProgress({ current: i + 1, total: contactsWithGenomeData.length })
        
        // Small delay to avoid overwhelming the API
        if (i < contactsWithGenomeData.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }

      setEnrichedContacts(results)
      onEnrichmentComplete?.(results)
    } catch (err) {
      setError('Failed to perform comprehensive enrichment')
      console.error('Comprehensive enrichment error:', err)
    } finally {
      setLoading(false)
      setProgress(null)
    }
  }

  const formatEmailCount = (count: number): string => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
    return count.toString()
  }

  const getSentimentScore = (company: EmailSentimentCompany): number => {
    const totalBlue = company.blue_emails_30 + company.blue_emails_30_60 + company.blue_emails_60_90
    const totalRed = company.red_emails_30 + company.red_emails_30_60 + company.red_emails_60_90
    const total = totalBlue + totalRed
    return total > 0 ? (totalBlue / total) * 100 : 0
  }

  const getSentimentColor = (score: number): string => {
    if (score >= 90) return 'text-green-600 bg-green-50'
    if (score >= 70) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const totalEnrichedData = useMemo(() => {
    let totalPeers = 0
    let totalMeetings = 0
    let totalNews = 0
    let totalKlicksters = 0
    let totalClientKlicksters = 0
    let totalClientCompetitors = 0

    enrichedContacts.forEach(contactData => {
      if (contactData.peers) totalPeers += contactData.peers.length
      if (contactData.meetings) totalMeetings += contactData.meetings.length
      if (contactData.news) totalNews += contactData.news.length
      if (contactData.klicksters) totalKlicksters += contactData.klicksters.length
      if (contactData.clientKlicksters) totalClientKlicksters += contactData.clientKlicksters.length
      if (contactData.clientCompetitors) totalClientCompetitors += contactData.clientCompetitors.length
    })

    return { totalPeers, totalMeetings, totalNews, totalKlicksters, totalClientKlicksters, totalClientCompetitors }
  }, [enrichedContacts])

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-500" />
            Enhanced Genome Intelligence
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Comprehensive contact enrichment with sentiment analysis, relationship mapping, and activity tracking
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* View Toggle */}
          <div className="flex gap-2">
            <Button
              variant={selectedView === 'sentiment' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedView('sentiment')}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Sentiment Trends
            </Button>
            <Button
              variant={selectedView === 'contacts' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedView('contacts')}
            >
              <Users className="h-4 w-4 mr-2" />
              Contact Enrichment
            </Button>
            <Button
              variant={selectedView === 'insights' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedView('insights')}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Insights
            </Button>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          {/* Progress Tracking */}
          {progress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Enriching contacts: {progress.current} / {progress.total}</span>
                <span className="text-muted-foreground">
                  {Math.round((progress.current / progress.total) * 100)}%
                </span>
              </div>
              <Progress value={(progress.current / progress.total) * 100} />
            </div>
          )}

          {/* Sentiment Trends View */}
          {selectedView === 'sentiment' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  onClick={handleFetchSentimentTrends}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <TrendingUp className="h-4 w-4 mr-2" />
                  )}
                  Fetch Email Sentiment Trends
                </Button>
              </div>

              {sentimentTrends && (
                <div className="space-y-4">
                  {/* Top Positive Relationships */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Top Positive Client Relationships
                    </h4>
                    <div className="space-y-2">
                      {sentimentTrends.blue_results.slice(0, 5).map((company, index) => {
                        const score = getSentimentScore(company)
                        const totalEmails = company.blue_emails_30 + company.blue_emails_30_60 + company.blue_emails_60_90
                        return (
                          <div key={company.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="text-sm font-medium text-green-800">#{index + 1}</div>
                              <div>
                                <div className="font-medium">{company.name}</div>
                                <div className="text-xs text-green-600">
                                  {formatEmailCount(totalEmails)} positive emails
                                </div>
                              </div>
                            </div>
                            <Badge className={getSentimentColor(score)}>
                              {score.toFixed(0)}% positive
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Problematic Relationships */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      Client Relationships Needing Attention
                    </h4>
                    <div className="space-y-2">
                      {sentimentTrends.red_results.slice(0, 5).map((company, index) => {
                        const score = getSentimentScore(company)
                        const totalRed = company.red_emails_30 + company.red_emails_30_60 + company.red_emails_60_90
                        return (
                          <div key={company.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="text-sm font-medium text-red-800">#{index + 1}</div>
                              <div>
                                <div className="font-medium">{company.name}</div>
                                <div className="text-xs text-red-600">
                                  {formatEmailCount(totalRed)} negative emails
                                </div>
                              </div>
                            </div>
                            <Badge className={getSentimentColor(score)}>
                              {score.toFixed(0)}% positive
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Sentiment Categories */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3">Common Sentiment Issues</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {sentimentTrends.red_email_categories.map((category, index) => (
                        <div key={index} className="p-2 bg-orange-50 rounded text-sm">
                          <div className="font-medium text-orange-800">{category.sentiment_topic}</div>
                          <div className="text-orange-600">{category.name} ({category.count} issues)</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contact Enrichment View */}
          {selectedView === 'contacts' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  onClick={handleComprehensiveEnrichment}
                  disabled={loading || contactsWithGenomeData.length === 0}
                  className="flex-1"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Database className="h-4 w-4 mr-2" />
                  )}
                  Comprehensive Enrichment ({contactsWithGenomeData.length} contacts)
                </Button>
              </div>

              {enrichedContacts.size > 0 && (
                <div className="space-y-4">
                  <div className="text-sm font-medium">Enrichment Results:</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <div className="text-lg font-bold text-blue-600">{totalEnrichedData.totalPeers}</div>
                      <div className="text-xs text-blue-700">Professional Peers</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded">
                      <div className="text-lg font-bold text-green-600">{totalEnrichedData.totalMeetings}</div>
                      <div className="text-xs text-green-700">Meetings</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded">
                      <div className="text-lg font-bold text-purple-600">{totalEnrichedData.totalNews}</div>
                      <div className="text-xs text-purple-700">News Mentions</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded">
                      <div className="text-lg font-bold text-orange-600">{totalEnrichedData.totalKlicksters}</div>
                      <div className="text-xs text-orange-700">Contact Klicksters</div>
                    </div>
                    <div className="text-center p-3 bg-cyan-50 rounded">
                      <div className="text-lg font-bold text-cyan-600">{totalEnrichedData.totalClientKlicksters}</div>
                      <div className="text-xs text-cyan-700">Client Klicksters</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded">
                      <div className="text-lg font-bold text-red-600">{totalEnrichedData.totalClientCompetitors}</div>
                      <div className="text-xs text-red-700">Client Competitors</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Insights View */}
          {selectedView === 'insights' && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Advanced insights and analytics from Genome data will appear here once enrichment is complete.
              </div>
              
              {sentimentTrends && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Email Sentiment Insights</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div>• {sentimentTrends.blue_results.length} clients with positive communication patterns</div>
                    <div>• {sentimentTrends.red_results.length} clients with communication issues</div>
                    <div>• {sentimentTrends.red_email_categories.length} different types of sentiment issues identified</div>
                  </div>
                </div>
              )}

              {enrichedContacts.size > 0 && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Contact Enrichment Insights</h4>
                  <div className="text-sm text-green-700 space-y-1">
                    <div>• {enrichedContacts.size} contacts successfully enriched</div>
                    <div>• {totalEnrichedData.totalPeers} professional relationships mapped</div>
                    <div>• {totalEnrichedData.totalMeetings} meeting interactions tracked</div>
                    <div>• {totalEnrichedData.totalNews} news mentions captured</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cache Stats */}
          <div className="text-xs text-muted-foreground">
            Cache: {enhancedGenomeApiService.getCacheStats().size} entries
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
