import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  Database, 
  Building2, 
  Users, 
  Hash,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import type { Contact } from '@/types/domain'
import { enhancedGenomeApiService } from '@/lib/enhancedGenomeApi'

interface GenomeIdAnalyzerProps {
  contacts: Contact[]
  className?: string
}

export function GenomeIdAnalyzer({ contacts, className }: GenomeIdAnalyzerProps) {
  const idAnalysis = useMemo(() => {
    const totalContacts = contacts.length
    const contactsWithClientIds = contacts.filter(c => c.genomeCrmcontactId)
    const contactsWithContactIds = contacts.filter(c => c.contactId)
    const contactsWithBothIds = contacts.filter(c => c.genomeCrmcontactId && c.contactId)
    const contactsWithNoIds = contacts.filter(c => !c.genomeCrmcontactId && !c.contactId)

    // Get unique IDs for API calls
    const uniqueClientIds = enhancedGenomeApiService.getUniqueClientIds(contacts)
    const uniqueContactIds = enhancedGenomeApiService.getUniqueContactIds(contacts)

    // Sample some IDs for display
    const sampleClientIds = uniqueClientIds.slice(0, 5)
    const sampleContactIds = uniqueContactIds.slice(0, 5)

    return {
      totalContacts,
      contactsWithClientIds: contactsWithClientIds.length,
      contactsWithContactIds: contactsWithContactIds.length,
      contactsWithBothIds: contactsWithBothIds.length,
      contactsWithNoIds: contactsWithNoIds.length,
      uniqueClientIds: uniqueClientIds.length,
      uniqueContactIds: uniqueContactIds.length,
      sampleClientIds,
      sampleContactIds,
      clientIdCoverage: totalContacts > 0 ? (contactsWithClientIds.length / totalContacts) * 100 : 0,
      contactIdCoverage: totalContacts > 0 ? (contactsWithContactIds.length / totalContacts) * 100 : 0
    }
  }, [contacts])

  const getCoverageColor = (coverage: number): string => {
    if (coverage >= 80) return 'text-green-600 bg-green-50'
    if (coverage >= 50) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getCoverageIcon = (coverage: number) => {
    if (coverage >= 80) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (coverage >= 50) return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    return <AlertTriangle className="h-4 w-4 text-red-500" />
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Genome ID Analysis
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Analysis of Genome IDs available in your contact data for API enrichment
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded">
              <div className="text-lg font-bold text-blue-600">{idAnalysis.totalContacts}</div>
              <div className="text-xs text-blue-700">Total Contacts</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded">
              <div className="text-lg font-bold text-green-600">{idAnalysis.contactsWithClientIds}</div>
              <div className="text-xs text-green-700">With Client IDs</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded">
              <div className="text-lg font-bold text-purple-600">{idAnalysis.contactsWithContactIds}</div>
              <div className="text-xs text-purple-700">With Contact IDs</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded">
              <div className="text-lg font-bold text-orange-600">{idAnalysis.contactsWithBothIds}</div>
              <div className="text-xs text-orange-700">With Both IDs</div>
            </div>
          </div>

          {/* Coverage Analysis */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">ID Coverage Analysis</h4>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  {getCoverageIcon(idAnalysis.clientIdCoverage)}
                  <span className="text-sm font-medium">Client ID Coverage</span>
                </div>
                <Badge className={getCoverageColor(idAnalysis.clientIdCoverage)}>
                  {idAnalysis.clientIdCoverage.toFixed(1)}%
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  {getCoverageIcon(idAnalysis.contactIdCoverage)}
                  <span className="text-sm font-medium">Contact ID Coverage</span>
                </div>
                <Badge className={getCoverageColor(idAnalysis.contactIdCoverage)}>
                  {idAnalysis.contactIdCoverage.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </div>

          {/* Unique ID Counts */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Unique IDs for API Calls</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-blue-50 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Unique Client IDs</span>
                </div>
                <div className="text-lg font-bold text-blue-600">{idAnalysis.uniqueClientIds}</div>
                <div className="text-xs text-blue-700">
                  For client-level API calls (competitors, heatmap, meetings, news)
                </div>
              </div>
              
              <div className="p-3 bg-purple-50 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Unique Contact IDs</span>
                </div>
                <div className="text-lg font-bold text-purple-600">{idAnalysis.uniqueContactIds}</div>
                <div className="text-xs text-purple-700">
                  For contact-level API calls (peers, competitors, heatmap, meetings)
                </div>
              </div>
            </div>
          </div>

          {/* Sample IDs */}
          {(idAnalysis.sampleClientIds.length > 0 || idAnalysis.sampleContactIds.length > 0) && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Sample IDs (for testing)</h4>
              
              {idAnalysis.sampleClientIds.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Sample Client IDs:</div>
                  <div className="flex flex-wrap gap-1">
                    {idAnalysis.sampleClientIds.map((id, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        <Hash className="h-3 w-3 mr-1" />
                        {id}
                      </Badge>
                    ))}
                    {idAnalysis.uniqueClientIds > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{idAnalysis.uniqueClientIds - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              
              {idAnalysis.sampleContactIds.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Sample Contact IDs:</div>
                  <div className="flex flex-wrap gap-1">
                    {idAnalysis.sampleContactIds.map((id, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        <Hash className="h-3 w-3 mr-1" />
                        {id}
                      </Badge>
                    ))}
                    {idAnalysis.uniqueContactIds > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{idAnalysis.uniqueContactIds - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* API Endpoint Mapping */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">API Endpoint Mapping</h4>
            
            <div className="space-y-2 text-xs">
              <div className="p-2 bg-blue-50 rounded">
                <div className="font-medium text-blue-800">Client-Level APIs (use genomeCrmcontactId):</div>
                <div className="text-blue-700 mt-1">
                  • /client_insights/client/{`{id}`}/competitors<br/>
                  • /client_insights/client/{`{id}`}/heatmap<br/>
                  • /client_insights/client/{`{id}`}/meetings<br/>
                  • /client_insights/client/{`{id}`}/news<br/>
                  • /client_insights/client/{`{id}`}/klicksters
                </div>
              </div>
              
              <div className="p-2 bg-purple-50 rounded">
                <div className="font-medium text-purple-800">Contact-Level APIs (use contactId):</div>
                <div className="text-purple-700 mt-1">
                  • /client_insights/contact/{`{id}`}/peers<br/>
                  • /client_insights/contact/{`{id}`}/competitors<br/>
                  • /client_insights/contact/{`{id}`}/heatmap<br/>
                  • /client_insights/contact/{`{id}`}/meetings
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {idAnalysis.contactsWithNoIds > 0 && (
            <div className="p-3 bg-yellow-50 rounded">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Recommendations</span>
              </div>
              <div className="text-xs text-yellow-700">
                {idAnalysis.contactsWithNoIds} contacts have no Genome IDs. Consider using the Contact Matching Tool 
                to link these contacts with Genome data, or manually add Genome IDs to enable enrichment.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
