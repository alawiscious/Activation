import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Progress } from '../ui/Progress'
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Users,
  Activity
} from 'lucide-react'
import { Contact } from '../../types/domain'
import { genomeStorage, type GenomeStorageStats } from '../../lib/genomeStorage'

interface SmartGenomeEnrichmentProps {
  contacts: Contact[]
  onContactsUpdated?: (contacts: Contact[]) => void
}

export function SmartGenomeEnrichment({ contacts, onContactsUpdated }: SmartGenomeEnrichmentProps) {
  const [isEnriching, setIsEnriching] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentContact, setCurrentContact] = useState<string>('')
  const [stats, setStats] = useState<GenomeStorageStats>(genomeStorage.getStorageStats())
  // Load enriched contacts on mount - only run once to avoid infinite loops
  useEffect(() => {
    const enriched = genomeStorage.applyEnrichmentToContacts(contacts)
    if (onContactsUpdated && enriched.length > 0) {
      // Only update if there are actually enriched contacts to avoid unnecessary updates
      const hasEnrichment = enriched.some(contact => 
        contact.emailCount !== undefined || 
        contact.meetingCount !== undefined || 
        contact.totalActivity !== undefined
      )
      if (hasEnrichment) {
        onContactsUpdated(enriched)
      }
    }
  }, []) // Remove contacts and onContactsUpdated from dependencies to prevent infinite loop

  // Update stats
  const updateStats = useCallback(() => {
    setStats(genomeStorage.getStorageStats())
  }, [])

  // Get contacts that need enrichment
  const contactsNeedingEnrichment = genomeStorage.getContactsNeedingEnrichment(contacts, 30)
  const contactsWithEnrichment = contacts.filter(c => genomeStorage.hasEnrichmentData(c.id))
  const staleContacts = contacts.filter(c => genomeStorage.isEnrichmentDataStale(c.id, 30))

  // Enrich contacts with Genome API
  const enrichContacts = useCallback(async () => {
    if (contactsNeedingEnrichment.length === 0) {
      alert('All contacts are already enriched with recent data!')
      return
    }

    setIsEnriching(true)
    setProgress(0)
    
    try {
      const batchSize = 10 // Process in batches to avoid overwhelming the API
      const totalContacts = contactsNeedingEnrichment.length
      const enrichmentResults: Record<string, any> = {}
      
      for (let i = 0; i < totalContacts; i += batchSize) {
        const batch = contactsNeedingEnrichment.slice(i, i + batchSize)
        
        // Process batch in parallel
        const batchPromises = batch.map(async (contact) => {
          setCurrentContact(`${contact.firstName} ${contact.lastName}`)
          
          try {
            // Try to get enrichment data from Genome API
            // This is a simplified example - you'd implement the actual API calls here
            const enrichmentData = await getContactEnrichmentData(contact)
            
            if (enrichmentData) {
              enrichmentResults[contact.id] = enrichmentData
            }
          } catch (error) {
            console.error(`Error enriching contact ${contact.id}:`, error)
          }
        })
        
        await Promise.all(batchPromises)
        
        // Update progress
        const processed = Math.min(i + batchSize, totalContacts)
        setProgress((processed / totalContacts) * 100)
      }
      
      // Store all enrichment data
      genomeStorage.batchStoreEnrichment(enrichmentResults)
      
      // Update contacts with new enrichment data
      const updatedContacts = genomeStorage.applyEnrichmentToContacts(contacts)
      if (onContactsUpdated) {
        onContactsUpdated(updatedContacts)
      }
      
      updateStats()
      
      alert(`Successfully enriched ${Object.keys(enrichmentResults).length} contacts!`)
      
    } catch (error) {
      console.error('Error during enrichment:', error)
      alert('Error during enrichment. Please try again.')
    } finally {
      setIsEnriching(false)
      setCurrentContact('')
      setProgress(0)
    }
  }, [contacts, contactsNeedingEnrichment, onContactsUpdated, updateStats])

  // Mock function to get enrichment data - replace with actual Genome API calls
  const getContactEnrichmentData = async (contact: Contact) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock data - replace with actual Genome API calls
    return {
      emailCount: Math.floor(Math.random() * 50),
      meetingCount: Math.floor(Math.random() * 20),
      totalActivity: Math.floor(Math.random() * 100),
      latestMeetingDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      lastEmailDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      lastKlickster: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
      linkedinLastPulled: new Date().toISOString(),
      genomeCrmcontactId: `genome_${contact.id}`,
      contactId: `contact_${contact.id}`,
      linkedinId: `linkedin_${contact.id}`,
      leadId: `lead_${contact.id}`,
    }
  }

  // Refresh stale data
  const refreshStaleData = useCallback(async () => {
    if (staleContacts.length === 0) {
      alert('No stale data to refresh!')
      return
    }

    setIsEnriching(true)
    setProgress(0)
    
    try {
      const totalContacts = staleContacts.length
      const enrichmentResults: Record<string, any> = {}
      
      for (let i = 0; i < totalContacts; i++) {
        const contact = staleContacts[i]
        setCurrentContact(`${contact.firstName} ${contact.lastName}`)
        
        try {
          const enrichmentData = await getContactEnrichmentData(contact)
          if (enrichmentData) {
            enrichmentResults[contact.id] = enrichmentData
          }
        } catch (error) {
          console.error(`Error refreshing contact ${contact.id}:`, error)
        }
        
        setProgress(((i + 1) / totalContacts) * 100)
      }
      
      genomeStorage.batchStoreEnrichment(enrichmentResults)
      
      const updatedContacts = genomeStorage.applyEnrichmentToContacts(contacts)
      if (onContactsUpdated) {
        onContactsUpdated(updatedContacts)
      }
      
      updateStats()
      alert(`Successfully refreshed ${Object.keys(enrichmentResults).length} contacts!`)
      
    } catch (error) {
      console.error('Error during refresh:', error)
      alert('Error during refresh. Please try again.')
    } finally {
      setIsEnriching(false)
      setCurrentContact('')
      setProgress(0)
    }
  }, [staleContacts, contacts, onContactsUpdated, updateStats])

  // Export data
  const exportData = useCallback(() => {
    const data = genomeStorage.exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `genome-enrichment-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [])

  // Import data
  const importData = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string
        const success = genomeStorage.importData(data)
        
        if (success) {
          const updatedContacts = genomeStorage.applyEnrichmentToContacts(contacts)
          if (onContactsUpdated) {
            onContactsUpdated(updatedContacts)
          }
          updateStats()
          alert('Data imported successfully!')
        } else {
          alert('Error importing data. Please check the file format.')
        }
      } catch (error) {
        console.error('Error importing data:', error)
        alert('Error importing data. Please check the file format.')
      }
    }
    reader.readAsText(file)
  }, [contacts, onContactsUpdated, updateStats])

  return (
    <div className="space-y-4">
      {/* Storage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            Genome Enrichment Storage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{contacts.length}</div>
              <div className="text-sm text-blue-800">Total Contacts</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{contactsWithEnrichment.length}</div>
              <div className="text-sm text-green-800">Enriched</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{staleContacts.length}</div>
              <div className="text-sm text-yellow-800">Stale Data</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{contactsNeedingEnrichment.length}</div>
              <div className="text-sm text-orange-800">Need Enrichment</div>
            </div>
          </div>
          
          {stats.lastBatchUpdate && (
            <div className="text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Last updated: {new Date(stats.lastBatchUpdate).toLocaleString()}
              </div>
              {stats.nextScheduledUpdate && (
                <div className="flex items-center gap-2 mt-1">
                  <RefreshCw className="h-4 w-4" />
                  Next scheduled: {new Date(stats.nextScheduledUpdate).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enrichment Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            Enrichment Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Enrichment Progress */}
            {isEnriching && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Enriching contacts...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full" />
                {currentContact && (
                  <div className="text-sm text-gray-600">
                    Processing: {currentContact}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={enrichContacts}
                disabled={isEnriching || contactsNeedingEnrichment.length === 0}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Enrich {contactsNeedingEnrichment.length} Contacts
              </Button>
              
              <Button
                onClick={refreshStaleData}
                disabled={isEnriching || staleContacts.length === 0}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh {staleContacts.length} Stale
              </Button>
              
              <Button
                onClick={exportData}
                disabled={isEnriching}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export Data
              </Button>
              
              <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                <Upload className="h-4 w-4" />
                Import Data
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                />
              </label>
            </div>

            {/* Status Messages */}
            {contactsNeedingEnrichment.length === 0 && contactsWithEnrichment.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-800">All contacts are enriched with recent data!</span>
              </div>
            )}
            
            {staleContacts.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="text-yellow-800">
                  {staleContacts.length} contacts have stale data (older than 30 days)
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-purple-600" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              This system stores Genome enrichment data locally to avoid repeated API calls. 
              When deployed to a server, this will be replaced with proper database storage.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (confirm('Are you sure you want to clear all enrichment data?')) {
                    genomeStorage.clearAllData()
                    const updatedContacts = genomeStorage.applyEnrichmentToContacts(contacts)
                    if (onContactsUpdated) {
                      onContactsUpdated(updatedContacts)
                    }
                    updateStats()
                  }
                }}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Clear All Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
