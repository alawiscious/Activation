import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { 
  Play, 
  Database, 
  Users, 
  Building2, 
  Target,
  TrendingUp,
  MessageSquare,
  Calendar,
  Newspaper,
  Loader2,
  Search
} from 'lucide-react'
import { enhancedGenomeApiService } from '@/lib/enhancedGenomeApi'
import { usePharmaVisualPivotStore } from '@/data/store'

export function GenomeDataPlayground() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [testClientId, setTestClientId] = useState('')
  const [testContactId, setTestContactId] = useState('')
  const { companies } = usePharmaVisualPivotStore()

  const { clientOptions, contactOptionsByClient } = useMemo(() => {
    const clientMap = new Map<string, string>()
    const contactByClient = new Map<string, Map<string, string>>()

    Object.values(companies).forEach(company => {
      company.contacts?.forEach(contact => {
        if (contact.isIrrelevant) return
        const clientId = contact.genomeCrmcontactId?.toString().trim()
        const contactId = contact.contactId?.toString().trim()

        if (clientId) {
          if (!clientMap.has(clientId)) {
            const label = `${clientId} • ${contact.currCompany || company.name}`
            clientMap.set(clientId, label)
          }

          if (contactId) {
            let contactsForClient = contactByClient.get(clientId)
            if (!contactsForClient) {
              contactsForClient = new Map<string, string>()
              contactByClient.set(clientId, contactsForClient)
            }
            if (!contactsForClient.has(contactId)) {
              const label = `${contactId} • ${contact.firstName} ${contact.lastName}`.trim()
              contactsForClient.set(contactId, label)
            }
          }
        }
      })
    })

    const sortedClients = Array.from(clientMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))
    const contactOptionsByClient = new Map<string, { value: string; label: string }[]>()

    contactByClient.forEach((map, clientId) => {
      const sorted = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
      contactOptionsByClient.set(
        clientId,
        sorted.map(([value, label]) => ({ value, label }))
      )
    })

    return {
      clientOptions: sortedClients.map(([value, label]) => ({ value, label })),
      contactOptionsByClient,
    }
  }, [companies])

  useEffect(() => {
    if (!testClientId) {
      if (clientOptions.length > 0) {
        setTestClientId(clientOptions[0].value)
      } else {
        setTestClientId('23')
      }
    }
  }, [clientOptions, testClientId])

  useEffect(() => {
    const optionsForClient = testClientId ? contactOptionsByClient.get(testClientId) : undefined
    if (optionsForClient && optionsForClient.length > 0) {
      setTestContactId(prev => (optionsForClient.some(option => option.value === prev) ? prev : optionsForClient[0].value))
    } else {
      setTestContactId('')
    }
  }, [contactOptionsByClient, testClientId])

  const runTest = async (testType: string) => {
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      let data: any = null

      switch (testType) {
        case 'client-competitors':
          data = await enhancedGenomeApiService.getClientCompetitors(parseInt(testClientId))
          break
        case 'client-opportunities':
          data = await enhancedGenomeApiService.getClientOpportunities(parseInt(testClientId))
          break
        case 'client-meetings':
          const toDate = new Date().toISOString().split('T')[0]
          const fromDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          data = await enhancedGenomeApiService.getClientMeetings(parseInt(testClientId), fromDate, toDate)
          break
        case 'client-news':
          data = await enhancedGenomeApiService.getClientNews(parseInt(testClientId))
          break
        case 'client-notes':
          data = await enhancedGenomeApiService.getClientNotes(parseInt(testClientId))
          break
        case 'contact-peers':
          data = await enhancedGenomeApiService.getContactPeers(parseInt(testContactId))
          break
        case 'contact-competitors':
          data = await enhancedGenomeApiService.getContactCompetitors(parseInt(testContactId))
          break
        case 'contact-meetings':
          data = await enhancedGenomeApiService.getContactMeetings(parseInt(testContactId))
          break
        case 'sentiment-trends':
          data = await enhancedGenomeApiService.getEmailSentimentTrends()
          break
        case 'functional-groups':
          data = await enhancedGenomeApiService.getFunctionalGroups()
          break
        case 'competitor-company':
          data = await enhancedGenomeApiService.getCompetitorCompany(parseInt(testClientId))
          break
        case 'update-contact-status':
          data = await enhancedGenomeApiService.updateContactStatus(parseInt(testContactId), { not_a_contact: true })
          break
        case 'user-note':
          data = await enhancedGenomeApiService.getUserNote(23) // Using note ID 23 from your example
          break
        case 'explicit-tags':
          data = await enhancedGenomeApiService.getExplicitTags()
          break
        case 'user-preferences':
          data = await enhancedGenomeApiService.getUserPreferences()
          break
        case 'update-note-tags':
          data = await enhancedGenomeApiService.updateNoteTags(23, { explicit_tag: ['Klick advocate'] })
          break
        case 'contact-peers-dated':
          const toDate3 = new Date().toISOString().split('T')[0]
          const fromDate3 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          data = await enhancedGenomeApiService.getContactPeers(parseInt(testContactId), fromDate3, toDate3)
          break
        case 'contact-notes':
          data = await enhancedGenomeApiService.getContactNotes(parseInt(testContactId))
          break
        case 'create-contact-note':
          data = await enhancedGenomeApiService.createContactNote(parseInt(testContactId), { 
            note: 'Test note created via API', 
            explicit_tag: ['Fast mover'],
            is_private: false 
          })
          break
        case 'update-contact-note':
          data = await enhancedGenomeApiService.updateContactNote(parseInt(testContactId), 23, { 
            note: 'Updated note via API', 
            explicit_tag: ['Klick advocate'],
            is_private: false 
          })
          break
        case 'contact-news-dated':
          const fromDate4 = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 6 months ago
          data = await enhancedGenomeApiService.getContactNews(parseInt(testContactId), fromDate4)
          break
        case 'contact-meetings-dated':
          const toDate5 = new Date().toISOString().split('T')[0]
          const fromDate5 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          data = await enhancedGenomeApiService.getContactMeetings(parseInt(testContactId), fromDate5, toDate5)
          break
        case 'contact-klicksters-dated':
          const toDate6 = new Date().toISOString().split('T')[0]
          const fromDate6 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          data = await enhancedGenomeApiService.getContactKlicksters(parseInt(testContactId), fromDate6, toDate6)
          break
        case 'contact-heatmap-detailed':
          data = await enhancedGenomeApiService.getContactHeatmap(parseInt(testContactId))
          break
        case 'contact-competitors-advanced':
          data = await enhancedGenomeApiService.getContactCompetitors(parseInt(testContactId), {
            page_num: 1,
            page_size: 10,
            sort_by: 'meeting_count'
          })
          break
        case 'contact-details':
          data = await enhancedGenomeApiService.getContactDetails(parseInt(testContactId))
          break
        case 'contact-search-advanced':
          data = await enhancedGenomeApiService.searchContacts({
            q: 'test',
            page_num: 1,
            page_size: 10,
            favorites_only: false,
            include_non_klick: false
          })
          break
        case 'delete-contact-note':
          data = await enhancedGenomeApiService.deleteContactNote(23)
          break
        case 'job-levels-detailed':
          data = await enhancedGenomeApiService.getJobLevels()
          break
        case 'job-functions-detailed':
          data = await enhancedGenomeApiService.getJobFunctions()
          break
        case 'functional-groups-detailed':
          data = await enhancedGenomeApiService.getFunctionalGroups()
          break
        case 'update-competitor-contact-status':
          data = await enhancedGenomeApiService.updateCompetitorContactStatus(parseInt(testContactId), { not_a_contact: true })
          break
        case 'get-competitor-contact-details':
          data = await enhancedGenomeApiService.getCompetitorContact(parseInt(testContactId))
          break
        case 'search-competitor-contacts-advanced':
          data = await enhancedGenomeApiService.searchCompetitorContacts({
            q: 'test',
            page_num: 1,
            page_size: 10,
            favorites_only: false,
            contact_status: false,
            include_non_klick: false
          })
          break
        case 'search-competitor-companies-advanced':
          data = await enhancedGenomeApiService.searchCompetitorCompanies({
            q: 'test',
            page_num: 1,
            page_size: 10,
            favorites_only: false
          })
          break
        default:
          throw new Error(`Unknown test type: ${testType}`)
      }

      setResults({ testType, data, timestamp: new Date().toISOString() })
    } catch (err) {
      setError(`Failed to run ${testType}: ${err}`)
      console.error('Test error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatData = (data: any): string => {
    if (Array.isArray(data)) {
      return `Array with ${data.length} items:\n${JSON.stringify(data.slice(0, 3), null, 2)}${data.length > 3 ? '\n...' : ''}`
    }
    return JSON.stringify(data, null, 2)
  }

  const getTestIcon = (testType: string) => {
    switch (testType) {
      case 'client-competitors': return <Building2 className="h-4 w-4" />
      case 'client-opportunities': return <Target className="h-4 w-4" />
      case 'client-meetings': return <Calendar className="h-4 w-4" />
      case 'client-news': return <Newspaper className="h-4 w-4" />
      case 'client-notes': return <MessageSquare className="h-4 w-4" />
      case 'contact-peers': return <Users className="h-4 w-4" />
      case 'contact-competitors': return <Building2 className="h-4 w-4" />
      case 'contact-meetings': return <Calendar className="h-4 w-4" />
      case 'sentiment-trends': return <TrendingUp className="h-4 w-4" />
      case 'functional-groups': return <Users className="h-4 w-4" />
      case 'competitor-company': return <Building2 className="h-4 w-4" />
      case 'update-contact-status': return <Target className="h-4 w-4" />
      case 'user-note': return <MessageSquare className="h-4 w-4" />
      case 'explicit-tags': return <MessageSquare className="h-4 w-4" />
      case 'user-preferences': return <Users className="h-4 w-4" />
      case 'update-note-tags': return <MessageSquare className="h-4 w-4" />
      case 'contact-peers-dated': return <Users className="h-4 w-4" />
      case 'contact-notes': return <MessageSquare className="h-4 w-4" />
      case 'create-contact-note': return <MessageSquare className="h-4 w-4" />
      case 'update-contact-note': return <MessageSquare className="h-4 w-4" />
      case 'contact-news-dated': return <Newspaper className="h-4 w-4" />
      case 'contact-meetings-dated': return <Calendar className="h-4 w-4" />
      case 'contact-klicksters-dated': return <Users className="h-4 w-4" />
      case 'contact-heatmap-detailed': return <TrendingUp className="h-4 w-4" />
      case 'contact-competitors-advanced': return <Building2 className="h-4 w-4" />
      case 'contact-details': return <Users className="h-4 w-4" />
      case 'contact-search-advanced': return <Search className="h-4 w-4" />
      case 'delete-contact-note': return <MessageSquare className="h-4 w-4" />
      case 'job-levels-detailed': return <Users className="h-4 w-4" />
      case 'job-functions-detailed': return <Users className="h-4 w-4" />
      case 'functional-groups-detailed': return <Users className="h-4 w-4" />
      case 'update-competitor-contact-status': return <Target className="h-4 w-4" />
      case 'get-competitor-contact-details': return <Users className="h-4 w-4" />
      case 'search-competitor-contacts-advanced': return <Search className="h-4 w-4" />
      case 'search-competitor-companies-advanced': return <Building2 className="h-4 w-4" />
      default: return <Database className="h-4 w-4" />
    }
  }

  const tests = [
    { id: 'client-competitors', label: 'Client Competitors', description: 'Get competitors for a client' },
    { id: 'client-opportunities', label: 'Client Opportunities', description: 'Get sales opportunities for a client' },
    { id: 'client-meetings', label: 'Client Meetings', description: 'Get meetings for a client (last 90 days)' },
    { id: 'client-news', label: 'Client News', description: 'Get news mentions for a client' },
    { id: 'client-notes', label: 'Client Notes', description: 'Get notes for a client' },
    { id: 'contact-peers', label: 'Contact Peers', description: 'Get professional network for a contact' },
    { id: 'contact-competitors', label: 'Contact Competitors', description: 'Get competitors for a contact' },
    { id: 'contact-meetings', label: 'Contact Meetings', description: 'Get meetings for a contact (last 90 days)' },
    { id: 'sentiment-trends', label: 'Email Sentiment Trends', description: 'Get overall email sentiment trends' },
    { id: 'functional-groups', label: 'Functional Groups', description: 'Get available functional groups' },
    { id: 'competitor-company', label: 'Competitor Company Details', description: 'Get detailed competitor company info' },
    { id: 'update-contact-status', label: 'Update Contact Status', description: 'Mark contact as not_a_contact (PATCH)' },
    { id: 'user-note', label: 'User Note Details', description: 'Get specific user note (ID: 23)' },
    { id: 'explicit-tags', label: 'Explicit Tags', description: 'Get available explicit tags for notes' },
    { id: 'user-preferences', label: 'User Preferences', description: 'Get user preferences' },
    { id: 'update-note-tags', label: 'Update Note Tags', description: 'Add tags to note (PUT)' },
    { id: 'contact-peers-dated', label: 'Contact Peers (Dated)', description: 'Get contact peers with date filtering' },
    { id: 'contact-notes', label: 'Contact Notes', description: 'Get notes for a specific contact' },
    { id: 'create-contact-note', label: 'Create Contact Note', description: 'Create a new note for a contact (POST)' },
    { id: 'update-contact-note', label: 'Update Contact Note', description: 'Update a specific contact note (PUT)' },
    { id: 'contact-news-dated', label: 'Contact News (Dated)', description: 'Get contact news with date filtering' },
    { id: 'contact-meetings-dated', label: 'Contact Meetings (Dated)', description: 'Get contact meetings with date range' },
    { id: 'contact-klicksters-dated', label: 'Contact Klicksters (Dated)', description: 'Get contact Klicksters with date range' },
    { id: 'contact-heatmap-detailed', label: 'Contact Heatmap (Detailed)', description: 'Get detailed contact heatmap with functional groups' },
    { id: 'contact-competitors-advanced', label: 'Contact Competitors (Advanced)', description: 'Get contact competitors with pagination and sorting' },
    { id: 'contact-details', label: 'Contact Details', description: 'Get detailed contact information' },
    { id: 'contact-search-advanced', label: 'Contact Search (Advanced)', description: 'Advanced contact search with comprehensive filtering' },
    { id: 'delete-contact-note', label: 'Delete Contact Note', description: 'Delete a specific contact note (DELETE)' },
    { id: 'job-levels-detailed', label: 'Job Levels (Detailed)', description: 'Get detailed job levels with descriptions' },
    { id: 'job-functions-detailed', label: 'Job Functions (Detailed)', description: 'Get comprehensive job functions list' },
    { id: 'functional-groups-detailed', label: 'Functional Groups (Detailed)', description: 'Get detailed functional groups' },
    { id: 'update-competitor-contact-status', label: 'Update Competitor Contact Status', description: 'Update competitor contact status (PATCH)' },
    { id: 'get-competitor-contact-details', label: 'Get Competitor Contact Details', description: 'Get comprehensive competitor contact profile data' },
    { id: 'search-competitor-contacts-advanced', label: 'Search Competitor Contacts (Advanced)', description: 'Advanced competitor contact search with comprehensive filtering' },
    { id: 'search-competitor-companies-advanced', label: 'Search Competitor Companies (Advanced)', description: 'Advanced competitor company search with pagination' },
  ]

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Genome API Data Playground
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Test individual Genome API endpoints with real data. Use this to explore what data is available.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="text-sm font-medium mb-2 block">Test Client ID</label>
            <select
              value={clientOptions.some(option => option.value === testClientId) ? testClientId : ''}
              onChange={(e) => setTestClientId(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled={clientOptions.length > 0}>Select a client ID</option>
              {clientOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
              {clientOptions.length === 0 && (
                <option value="">No client IDs detected</option>
              )}
            </select>
            <div className="mt-2 space-y-1">
              <Input
                value={testClientId}
                onChange={(e) => setTestClientId(e.target.value)}
                placeholder="Type a custom client ID"
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Pick an ID from your imported contacts or enter one manually.
              </p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Test Contact ID</label>
            <select
              value={testContactId}
              onChange={(e) => setTestContactId(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled={(contactOptionsByClient.get(testClientId || '')?.length || 0) > 0}>
                {testClientId ? 'Select a contact ID' : 'Choose a client first'}
              </option>
              {(contactOptionsByClient.get(testClientId || '') || []).map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
              {(contactOptionsByClient.get(testClientId || '') || []).length === 0 && (
                <option value="">No contact IDs detected</option>
              )}
            </select>
            <div className="mt-2 space-y-1">
              <Input
                value={testContactId}
                onChange={(e) => setTestContactId(e.target.value)}
                placeholder="Type a custom contact ID"
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Choose a known contact ID or supply your own for testing.
              </p>
            </div>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {tests.map((test) => (
            <Button
              key={test.id}
              variant="outline"
              onClick={() => runTest(test.id)}
              disabled={loading}
              className="h-auto p-4 flex flex-col items-start gap-2"
            >
              <div className="flex items-center gap-2">
                {getTestIcon(test.id)}
                <span className="font-medium">{test.label}</span>
              </div>
              <p className="text-xs text-muted-foreground text-left">
                {test.description}
              </p>
            </Button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Running test...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                {getTestIcon(results.testType)}
                {results.testType.replace('-', ' ').toUpperCase()}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {new Date(results.timestamp).toLocaleTimeString()}
              </span>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="text-xs overflow-auto max-h-96 whitespace-pre-wrap">
                {formatData(results.data)}
              </pre>
            </div>
          </div>
        )}

        {/* Quick Tips */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Quick Tips:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Start with <strong>Client Competitors</strong> using ID 23 (MINDS + ASSEMBLY)</li>
            <li>• Try <strong>Email Sentiment Trends</strong> for overall system insights</li>
            <li>• Use <strong>Functional Groups</strong> to see available organizational data</li>
            <li>• Check the browser console for detailed API responses</li>
            <li>• All tests use real Genome API endpoints with your authentication</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
