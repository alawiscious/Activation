import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Users, Building2, Calendar, Mail } from 'lucide-react'
import type { Contact } from '@/types/domain'
import { genomeApiService, type GenomeCompetitor, type GenomeKlickster } from '@/lib/genomeApi'

interface GenomeEnrichmentProps {
  contact: Contact
  className?: string
}

export function GenomeEnrichment({ contact, className }: GenomeEnrichmentProps) {
  const [competitors, setCompetitors] = useState<GenomeCompetitor[]>([])
  const [klicksters, setKlicksters] = useState<GenomeKlickster[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  const hasGenomeData = contact.genomeCrmcontactId || contact.contactId

  const loadGenomeData = async () => {
    if (!hasGenomeData) return

    setLoading(true)
    setError(null)

    try {
      const enrichment = await genomeApiService.enrichContact(contact)
      setCompetitors(enrichment.competitors)
      setKlicksters(enrichment.klicksters)
    } catch (err) {
      setError('Failed to load Genome data')
      console.error('Genome enrichment error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (expanded && hasGenomeData && competitors.length === 0 && klicksters.length === 0) {
      loadGenomeData()
    }
  }, [expanded, hasGenomeData])

  if (!hasGenomeData) {
    return null
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className={className}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setExpanded(!expanded)}
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Loading...' : expanded ? 'Hide Genome Data' : 'Show Genome Data'}
      </Button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          {/* Competitors Section */}
          {competitors.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Agency Competitors ({competitors.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {competitors.map((competitor, index) => (
                    <div key={index} className="text-xs border rounded p-2">
                      <div className="font-medium">{competitor.agency_name}</div>
                      <div className="text-muted-foreground">
                        {competitor.contact_name} - {competitor.contact_title}
                      </div>
                      {competitor.contact_email && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {competitor.contact_email}
                        </div>
                      )}
                      {competitor.last_interaction_date && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Last interaction: {formatDate(competitor.last_interaction_date)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Klicksters Section */}
          {klicksters.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Klickster Interactions ({klicksters.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {klicksters.map((klickster, index) => (
                    <div key={index} className="text-xs border rounded p-2">
                      <div className="font-medium">{klickster.klickster_name}</div>
                      <div className="text-muted-foreground">
                        {klickster.interaction_type}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(klickster.interaction_date)}
                      </div>
                      {klickster.notes && (
                        <div className="text-muted-foreground mt-1">
                          {klickster.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && competitors.length === 0 && klicksters.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">
              No Genome data available for this contact
            </div>
          )}
        </div>
      )}
    </div>
  )
}
