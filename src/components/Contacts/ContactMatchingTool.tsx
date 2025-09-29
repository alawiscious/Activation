import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { 
  Search, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Database,
  Upload,
  Download
} from 'lucide-react'
import type { Contact } from '@/types/domain'
import { contactMatcher, type GenomeContact, type MatchResult } from '@/lib/contactMatching'

interface ContactMatchingToolProps {
  contacts: Contact[]
  onMatchesFound?: (matches: Map<string, MatchResult>) => void
  className?: string
}

export function ContactMatchingTool({ contacts, onMatchesFound, className }: ContactMatchingToolProps) {
  const [genomeContacts, setGenomeContacts] = useState<GenomeContact[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [matchingResults, setMatchingResults] = useState<Map<string, MatchResult>>(new Map())
  const [showUnmatched, setShowUnmatched] = useState(false)

  const contactsNeedingGenomeIds = useMemo(() => {
    return contacts.filter(contact => !contact.genomeCrmcontactId && !contact.contactId)
  }, [contacts])

  // Filter contacts based on search
  const filteredContacts = useMemo(() => {
    const baseContacts = contactsNeedingGenomeIds
    if (!searchTerm.trim()) return baseContacts
    const term = searchTerm.toLowerCase()
    return baseContacts.filter(contact => 
      contact.firstName.toLowerCase().includes(term) ||
      contact.lastName.toLowerCase().includes(term) ||
      contact.email.toLowerCase().includes(term) ||
      contact.currCompany?.toLowerCase().includes(term) ||
      contact.title.toLowerCase().includes(term)
    )
  }, [contactsNeedingGenomeIds, searchTerm])

  // Generate match report
  const matchReport = useMemo(() => {
    if (genomeContacts.length === 0 || filteredContacts.length === 0) return null
    return contactMatcher.generateMatchReport(filteredContacts, genomeContacts)
  }, [filteredContacts, genomeContacts])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\n')
        const headers = lines[0].split(',').map(h => h.trim())
        
        const contacts: GenomeContact[] = []
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim())
          if (values.length >= headers.length) {
            const contact: GenomeContact = { id: `genome-${i}`, name: '' }
            
            headers.forEach((header, index) => {
              const value = values[index] || ''
              switch (header.toLowerCase()) {
                case 'name':
                case 'contact_name':
                  contact.name = value
                  break
                case 'email':
                case 'contact_email':
                  contact.email = value
                  break
                case 'title':
                case 'contact_title':
                  contact.title = value
                  break
                case 'company':
                case 'company_name':
                  contact.company = value
                  break
                case 'genome_crmcontact_id':
                case 'client_id':
                  contact.genome_crmcontact_id = value
                  break
                case 'contact_id':
                case 'crm_contact_id':
                  contact.contact_id = value
                  break
              }
            })
            
            if (contact.name || contact.email) {
              contacts.push(contact)
            }
          }
        }
        
        setGenomeContacts(contacts)
      } catch (error) {
        console.error('Error parsing CSV:', error)
        alert('Error parsing CSV file. Please check the format.')
      }
    }
    reader.readAsText(file)
  }

  const runMatching = () => {
    if (genomeContacts.length === 0 || filteredContacts.length === 0) return
    
    const matches = contactMatcher.getBestMatches(filteredContacts, genomeContacts)
    setMatchingResults(matches)
    onMatchesFound?.(matches)
  }

  const exportMatches = () => {
    if (matchingResults.size === 0) return
    
    const csvContent = [
      'Contact ID,First Name,Last Name,Email,Company,Title,Genome Contact ID,Genome Contact Name,Genome Email,Genome Company,Genome Title,Match Confidence,Match Type',
      ...Array.from(matchingResults.entries()).map(([contactId, match]) => {
        const contact = match.contact
        const genome = match.genomeContact
        return [
          contactId,
          contact.firstName,
          contact.lastName,
          contact.email,
          contact.currCompany || '',
          contact.title,
          genome.id,
          genome.name,
          genome.email || '',
          genome.company || '',
          genome.title || '',
          match.confidence.toFixed(3),
          match.matchType
        ].map(field => `"${field}"`).join(',')
      })
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'contact-matches.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-100 text-green-800'
    if (confidence >= 0.7) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getMatchTypeIcon = (matchType: string) => {
    switch (matchType) {
      case 'email': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'name_company': return <Users className="h-4 w-4 text-blue-600" />
      case 'name_title': return <Search className="h-4 w-4 text-purple-600" />
      default: return <AlertTriangle className="h-4 w-4 text-orange-600" />
    }
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Contact Matching Tool
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 rounded-lg border bg-muted/20">
            <div className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Contacts Needing Genome IDs
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {contactsNeedingGenomeIds.length === 0
                ? 'Great! All contacts already have Genome identifiers.'
                : `${contactsNeedingGenomeIds.length} contacts are missing Genome IDs. They are preloaded below so you can match them against Genome data.`}
            </div>
          </div>

          {contactsNeedingGenomeIds.length === 0 ? null : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Showing contacts missing Genome IDs{searchTerm ? ' (filtered)' : ''}</span>
                <span>{filteredContacts.length} of {contactsNeedingGenomeIds.length}</span>
              </div>
              <div className="max-h-40 overflow-y-auto border rounded-lg divide-y bg-white">
                {filteredContacts.slice(0, 25).map(contact => (
                  <div key={contact.id} className="p-2 text-xs">
                    <div className="font-medium text-foreground">
                      {contact.firstName} {contact.lastName}
                    </div>
                    <div className="text-muted-foreground">
                      {contact.email} • {contact.currCompany || 'Unknown Company'}
                    </div>
                    <div className="text-muted-foreground italic">{contact.title || 'No title available'}</div>
                  </div>
                ))}
                {filteredContacts.length > 25 && (
                  <div className="p-2 text-center text-xs text-muted-foreground">
                    Showing first 25 results. Refine your search to narrow further.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Upload Genome Contact Data (CSV)
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="flex-1"
              />
              <Upload className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Expected columns: name, email, title, company, genome_crmcontact_id, contact_id
            </p>
          </div>

          {contactsNeedingGenomeIds.length > 0 && genomeContacts.length === 0 && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
              Upload a Genome contact export to automatically match these contacts and retrieve their IDs.
            </div>
          )}

          {/* Search */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Search Contacts
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, company, or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Genome Data Summary */}
          {genomeContacts.length > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-blue-900">
                Genome Data Loaded: {genomeContacts.length} contacts
              </div>
              <div className="text-xs text-blue-700 mt-1">
                {genomeContacts.filter(c => c.genome_crmcontact_id).length} with client IDs, {' '}
                {genomeContacts.filter(c => c.contact_id).length} with contact IDs
              </div>
            </div>
          )}

          {/* Empty State */}
          {contactsNeedingGenomeIds.length === 0 && (
            <div className="p-4 bg-green-50 border border-green-100 rounded-lg text-sm text-green-700">
              No contacts require matching right now. Upload new Genome data if you need to refresh IDs.
            </div>
          )}

          {/* Match Report */}
          {matchReport && contactsNeedingGenomeIds.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Matching Results</h3>
                <Button onClick={runMatching} size="sm">
                  Run Matching
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold">{matchReport.totalContacts}</div>
                  <div className="text-xs text-muted-foreground">Total Contacts</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded">
                  <div className="text-2xl font-bold text-green-600">{matchReport.matchedContacts}</div>
                  <div className="text-xs text-muted-foreground">Matched</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded">
                  <div className="text-2xl font-bold text-red-600">{matchReport.unmatchedContacts.length}</div>
                  <div className="text-xs text-muted-foreground">Unmatched</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded">
                  <div className="text-2xl font-bold text-yellow-600">{matchReport.lowConfidenceMatches.length}</div>
                  <div className="text-xs text-muted-foreground">Low Confidence</div>
                </div>
              </div>

              <div className="text-sm">
                <strong>Match Rate:</strong> {(matchReport.matchRate * 100).toFixed(1)}%
              </div>
            </div>
          )}

          {/* Export Results */}
          {matchingResults.size > 0 && contactsNeedingGenomeIds.length > 0 && (
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <div className="text-sm text-green-800">
                {matchingResults.size} matches found
              </div>
              <Button onClick={exportMatches} size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Matches
              </Button>
            </div>
          )}

          {/* Match Details */}
          {matchingResults.size > 0 && contactsNeedingGenomeIds.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Match Details</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUnmatched(!showUnmatched)}
                >
                  {showUnmatched ? 'Hide' : 'Show'} Unmatched
                </Button>
              </div>
              
              <div className="max-h-96 overflow-y-auto space-y-2">
                {Array.from(matchingResults.entries()).map(([contactId, match]) => (
                  <div key={contactId} className="border rounded p-3 text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">
                        {match.contact.firstName} {match.contact.lastName}
                      </div>
                      <div className="flex items-center gap-2">
                        {getMatchTypeIcon(match.matchType)}
                        <Badge className={getConfidenceColor(match.confidence)}>
                          {(match.confidence * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="text-muted-foreground">
                      <div>Your Contact: {match.contact.email} • {match.contact.currCompany}</div>
                      <div>Genome Match: {match.genomeContact.name} • {match.genomeContact.email}</div>
                      {match.genomeContact.genome_crmcontact_id && (
                        <div className="text-xs">Client ID: {match.genomeContact.genome_crmcontact_id}</div>
                      )}
                      {match.genomeContact.contact_id && (
                        <div className="text-xs">Contact ID: {match.genomeContact.contact_id}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
