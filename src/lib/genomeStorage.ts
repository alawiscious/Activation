// Local storage system for Genome enrichment data
// This will be replaced with proper database storage when deployed to a server

import { Contact } from '../types/domain'

export interface GenomeEnrichmentData {
  contactId: string
  emailCount?: number
  meetingCount?: number
  totalActivity?: number
  latestMeetingDate?: string
  lastEmailDate?: string
  lastKlickster?: string
  linkedinLastPulled?: string
  genomeCrmcontactId?: string
  linkedinId?: string
  leadId?: string
  // Add other Genome API fields as needed
  lastUpdated: string
  source: 'genome_api' | 'manual_entry'
}

export interface GenomeStorageStats {
  totalContacts: number
  enrichedContacts: number
  lastBatchUpdate: string
  nextScheduledUpdate: string
}

class GenomeStorageManager {
  private storageKey = 'pharma-genome-enrichment-data'
  private statsKey = 'pharma-genome-storage-stats'

  // Get all enrichment data
  getAllEnrichmentData(): Record<string, GenomeEnrichmentData> {
    try {
      const data = localStorage.getItem(this.storageKey)
      return data ? JSON.parse(data) : {}
    } catch (error) {
      console.error('Error loading Genome enrichment data:', error)
      return {}
    }
  }

  // Get enrichment data for a specific contact
  getContactEnrichment(contactId: string): GenomeEnrichmentData | null {
    const allData = this.getAllEnrichmentData()
    return allData[contactId] || null
  }

  // Store enrichment data for a contact
  storeContactEnrichment(contactId: string, data: Partial<GenomeEnrichmentData>): void {
    try {
      const allData = this.getAllEnrichmentData()
      const existingData = allData[contactId] || {}
      
      allData[contactId] = {
        ...existingData,
        ...data,
        contactId,
        lastUpdated: new Date().toISOString(),
        source: data.source || existingData.source || 'genome_api'
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(allData))
      this.updateStats()
    } catch (error) {
      console.error('Error storing Genome enrichment data:', error)
    }
  }

  // Batch store enrichment data for multiple contacts
  batchStoreEnrichment(enrichmentData: Record<string, Partial<GenomeEnrichmentData>>): void {
    try {
      const allData = this.getAllEnrichmentData()
      const timestamp = new Date().toISOString()
      
      Object.entries(enrichmentData).forEach(([contactId, data]) => {
        const existingData = allData[contactId] || {}
        allData[contactId] = {
          ...existingData,
          ...data,
          contactId,
          lastUpdated: timestamp,
          source: data.source || existingData.source || 'genome_api'
        }
      })
      
      localStorage.setItem(this.storageKey, JSON.stringify(allData))
      this.updateStats()
    } catch (error) {
      console.error('Error batch storing Genome enrichment data:', error)
    }
  }

  // Check if contact has enrichment data
  hasEnrichmentData(contactId: string): boolean {
    const data = this.getContactEnrichment(contactId)
    return data !== null && data.lastUpdated !== undefined
  }

  // Check if enrichment data is stale (older than specified days)
  isEnrichmentDataStale(contactId: string, maxAgeDays: number = 30): boolean {
    const data = this.getContactEnrichment(contactId)
    if (!data || !data.lastUpdated) return true
    
    const lastUpdated = new Date(data.lastUpdated)
    const now = new Date()
    const daysSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24)
    
    return daysSinceUpdate > maxAgeDays
  }

  // Get contacts that need enrichment (no data or stale data)
  getContactsNeedingEnrichment(contacts: Contact[], maxAgeDays: number = 30): Contact[] {
    return contacts.filter(contact => 
      !this.hasEnrichmentData(contact.id) || 
      this.isEnrichmentDataStale(contact.id, maxAgeDays)
    )
  }

  // Apply enrichment data to contacts
  applyEnrichmentToContacts(contacts: Contact[]): Contact[] {
    const enrichmentData = this.getAllEnrichmentData()
    
    return contacts.map(contact => {
      const enrichment = enrichmentData[contact.id]
      if (!enrichment) return contact
      
      return {
        ...contact,
        emailCount: enrichment.emailCount || contact.emailCount,
        meetingCount: enrichment.meetingCount || contact.meetingCount,
        totalActivity: enrichment.totalActivity || contact.totalActivity,
        latestMeetingDate: enrichment.latestMeetingDate || contact.latestMeetingDate,
        lastEmailDate: enrichment.lastEmailDate || contact.lastEmailDate,
        lastKlickster: enrichment.lastKlickster || contact.lastKlickster,
        linkedinLastPulled: enrichment.linkedinLastPulled || contact.linkedinLastPulled,
        genomeCrmcontactId: enrichment.genomeCrmcontactId || contact.genomeCrmcontactId,
        contactId: enrichment.contactId || contact.contactId,
        linkedinId: enrichment.linkedinId || contact.linkedinId,
        leadId: enrichment.leadId || contact.leadId,
      }
    })
  }

  // Get storage statistics
  getStorageStats(): GenomeStorageStats {
    try {
      const stats = localStorage.getItem(this.statsKey)
      return stats ? JSON.parse(stats) : {
        totalContacts: 0,
        enrichedContacts: 0,
        lastBatchUpdate: '',
        nextScheduledUpdate: ''
      }
    } catch (error) {
      console.error('Error loading storage stats:', error)
      return {
        totalContacts: 0,
        enrichedContacts: 0,
        lastBatchUpdate: '',
        nextScheduledUpdate: ''
      }
    }
  }

  // Update storage statistics
  private updateStats(): void {
    try {
      const allData = this.getAllEnrichmentData()
      const enrichedCount = Object.keys(allData).length
      const now = new Date()
      const nextUpdate = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours from now
      
      const stats: GenomeStorageStats = {
        totalContacts: 0, // This would be set by the calling code
        enrichedContacts: enrichedCount,
        lastBatchUpdate: now.toISOString(),
        nextScheduledUpdate: nextUpdate.toISOString()
      }
      
      localStorage.setItem(this.statsKey, JSON.stringify(stats))
    } catch (error) {
      console.error('Error updating storage stats:', error)
    }
  }

  // Clear all enrichment data (for testing/reset)
  clearAllData(): void {
    try {
      localStorage.removeItem(this.storageKey)
      localStorage.removeItem(this.statsKey)
    } catch (error) {
      console.error('Error clearing Genome enrichment data:', error)
    }
  }

  // Export data for backup
  exportData(): string {
    const allData = this.getAllEnrichmentData()
    const stats = this.getStorageStats()
    return JSON.stringify({ enrichmentData: allData, stats }, null, 2)
  }

  // Import data from backup
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData)
      if (data.enrichmentData) {
        localStorage.setItem(this.storageKey, JSON.stringify(data.enrichmentData))
      }
      if (data.stats) {
        localStorage.setItem(this.statsKey, JSON.stringify(data.stats))
      }
      return true
    } catch (error) {
      console.error('Error importing Genome enrichment data:', error)
      return false
    }
  }
}

// Export singleton instance
export const genomeStorage = new GenomeStorageManager()

// Helper function to enrich contacts with stored data
export function enrichContactsWithStoredData(contacts: Contact[]): Contact[] {
  return genomeStorage.applyEnrichmentToContacts(contacts)
}

// Helper function to get contacts that need enrichment
export function getContactsNeedingEnrichment(contacts: Contact[], maxAgeDays: number = 30): Contact[] {
  return genomeStorage.getContactsNeedingEnrichment(contacts, maxAgeDays)
}
