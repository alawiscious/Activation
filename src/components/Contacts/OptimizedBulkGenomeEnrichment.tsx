import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { 
  Users, 
  Building2, 
  Loader2, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Zap
} from 'lucide-react'
import type { Contact } from '@/types/domain'
import { optimizedGenomeApiService, type EnrichmentProgress, type EnrichmentResult } from '@/lib/genomeApiOptimized'

interface OptimizedBulkGenomeEnrichmentProps {
  contacts: Contact[]
  onEnrichmentComplete?: (results: Map<string, EnrichmentResult>) => void
  className?: string
}

export function OptimizedBulkGenomeEnrichment({ contacts, onEnrichmentComplete, className }: OptimizedBulkGenomeEnrichmentProps) {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<EnrichmentProgress | null>(null)
  const [results, setResults] = useState<Map<string, EnrichmentResult>>(new Map())
  const [error, setError] = useState<string | null>(null)
  const [cancelled, setCancelled] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const contactsWithGenomeData = contacts.filter((contact: Contact) => 
    contact.genomeCrmcontactId || contact.contactId
  )

  const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

  const handleOptimizedEnrichment = async () => {
    if (contactsWithGenomeData.length === 0) return

    setLoading(true)
    setError(null)
    setCancelled(false)
    setResults(new Map())
    setProgress(null)
    
    abortControllerRef.current = new AbortController()

    try {
      const enrichmentResults = await optimizedGenomeApiService.enrichContactsOptimized(
        contactsWithGenomeData,
        (progressUpdate) => {
          setProgress(progressUpdate)
        }
      )
      
      if (!cancelled) {
        setResults(enrichmentResults)
        onEnrichmentComplete?.(enrichmentResults)
      }
    } catch (err) {
      if (!cancelled) {
        setError('Failed to enrich contacts with Genome data')
        console.error('Bulk enrichment error:', err)
      }
    } finally {
      if (!cancelled) {
        setLoading(false)
      }
    }
  }

  const handleCancel = () => {
    setCancelled(true)
    setLoading(false)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
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
          <Zap className="h-5 w-5 text-yellow-500" />
          Optimized Genome Data Enrichment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          {contactsWithGenomeData.length} contacts have Genome IDs and can be enriched
        </div>

        {/* Performance Benefits */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-sm font-medium text-blue-900 mb-2">Performance Optimizations:</div>
          <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
            <div>• Grouped API calls by client/contact ID</div>
            <div>• Increased concurrent requests (10x)</div>
            <div>• Intelligent caching</div>
            <div>• Real-time progress tracking</div>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
            {error}
          </div>
        )}

        {/* Progress Tracking */}
        {progress && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Progress: {progress.processed} / {progress.total}</span>
              <span className="text-muted-foreground">
                {progress.estimatedTimeRemaining && (
                  <>
                    <Clock className="h-3 w-3 inline mr-1" />
                    {formatTime(progress.estimatedTimeRemaining)} remaining
                  </>
                )}
              </span>
            </div>
            
            <Progress 
              value={(progress.processed / progress.total) * 100} 
              className="w-full"
            />
            
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 bg-green-50 rounded">
                <div className="font-medium text-green-600">{progress.completed}</div>
                <div className="text-green-700">Completed</div>
              </div>
              <div className="text-center p-2 bg-yellow-50 rounded">
                <div className="font-medium text-yellow-600">{progress.processed - progress.completed}</div>
                <div className="text-yellow-700">Processing</div>
              </div>
              <div className="text-center p-2 bg-red-50 rounded">
                <div className="font-medium text-red-600">{progress.errors}</div>
                <div className="text-red-700">Errors</div>
              </div>
            </div>
          </div>
        )}

        {/* Results Summary */}
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
              <Badge variant="secondary" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {results.size} Contacts Enriched
              </Badge>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!loading ? (
            <Button
              onClick={handleOptimizedEnrichment}
              className="flex-1"
            >
              <Zap className="h-4 w-4 mr-2" />
              Start Optimized Enrichment
            </Button>
          ) : (
            <Button
              onClick={handleCancel}
              variant="outline"
              className="flex-1"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Cancel Enrichment
            </Button>
          )}
        </div>

        {loading && (
          <div className="text-xs text-muted-foreground text-center">
            <Loader2 className="h-4 w-4 inline mr-2 animate-spin" />
            Processing {contactsWithGenomeData.length} contacts with optimized algorithm...
          </div>
        )}

        {/* Cache Stats */}
        <div className="text-xs text-muted-foreground">
          Cache: {optimizedGenomeApiService.getCacheStats().size} entries
        </div>
      </CardContent>
    </Card>
  )
}
