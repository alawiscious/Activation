import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Database, Users, Building2, Loader2 } from 'lucide-react'
import type { Contact } from '@/types/domain'
import { genomeApiService, type GenomeCompetitor, type GenomeKlickster } from '@/lib/genomeApi'

interface BulkGenomeEnrichmentProps {
  contacts: Contact[]
  onEnrichmentComplete?: (results: Map<string, {
    competitors: GenomeCompetitor[]
    klicksters: GenomeKlickster[]
  }>) => void
  className?: string
}

export function BulkGenomeEnrichment({ contacts, onEnrichmentComplete, className }: BulkGenomeEnrichmentProps) {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Map<string, {
    competitors: GenomeCompetitor[]
    klicksters: GenomeKlickster[]
  }>>(new Map())
  const [error, setError] = useState<string | null>(null)

  const contactsWithGenomeData = contacts.filter(contact => 
    contact.genomeCrmcontactId || contact.contactId
  )

  const handleBulkEnrichment = async () => {
    if (contactsWithGenomeData.length === 0) return

    setLoading(true)
    setError(null)

    try {
      const enrichmentResults = await genomeApiService.enrichContacts(contactsWithGenomeData)
      setResults(enrichmentResults)
      onEnrichmentComplete?.(enrichmentResults)
    } catch (err) {
      setError('Failed to enrich contacts with Genome data')
      console.error('Bulk enrichment error:', err)
    } finally {
      setLoading(false)
    }
  }

  const totalCompetitors = Array.from(results.values()).reduce((sum, result) => sum + result.competitors.length, 0)
  const totalKlicksters = Array.from(results.values()).reduce((sum, result) => sum + result.klicksters.length, 0)

  if (contactsWithGenomeData.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground text-center">
            No contacts with Genome IDs found for enrichment
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Genome Data Enrichment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          {contactsWithGenomeData.length} contacts have Genome IDs and can be enriched
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
            {error}
          </div>
        )}

        {results.size > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Enrichment Results:</div>
            <div className="flex gap-4">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {totalCompetitors} Competitors
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {totalKlicksters} Klickster Interactions
              </Badge>
            </div>
          </div>
        )}

        <Button
          onClick={handleBulkEnrichment}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enriching Contacts...
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              Enrich All Contacts
            </>
          )}
        </Button>

        {loading && (
          <div className="text-xs text-muted-foreground text-center">
            Processing {contactsWithGenomeData.length} contacts...
          </div>
        )}
      </CardContent>
    </Card>
  )
}
