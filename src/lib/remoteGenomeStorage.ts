// Remote storage system for Genome enrichment data
// This stores enrichment data on a remote server instead of localStorage

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
  lastUpdated: string
  source: 'genome_api' | 'manual_entry'
}

export interface GenomeStorageStats {
  totalContacts: number
  enrichedContacts: number
  lastBatchUpdate: string
  nextScheduledUpdate: string
}

// Remote storage configuration
const REMOTE_STORAGE_CONFIG = {
  // Option 1: AWS S3 (Recommended for production)
  s3: {
    bucket: 'activation-genome-data',
    region: 'us-east-1',
    keyPrefix: 'enrichment/'
  },
  
  // Option 2: GitHub (Free, good for development)
  github: {
    repo: 'KlickInc/activation-genome-data',
    branch: 'main',
    path: 'enrichment/'
  },
  
  // Option 3: Custom API endpoint
  api: {
    baseUrl: 'https://api.activation.klickcloud.net',
    endpoints: {
      get: '/genome/enrichment',
      store: '/genome/enrichment',
      batch: '/genome/enrichment/batch'
    }
  }
}

class RemoteGenomeStorageManager {
  private storageType: 's3' | 'github' | 'api' | 'local'
  private fallbackToLocal: boolean = true

  constructor() {
    // Determine storage type from environment
    this.storageType = (import.meta as any)?.env?.VITE_GENOME_STORAGE_TYPE || 'local'
    this.fallbackToLocal = (import.meta as any)?.env?.VITE_GENOME_FALLBACK_LOCAL !== 'false'
  }

  // Get all enrichment data from remote storage
  async getAllEnrichmentData(): Promise<Record<string, GenomeEnrichmentData>> {
    try {
      switch (this.storageType) {
        case 's3':
          return await this.getFromS3()
        case 'github':
          return await this.getFromGitHub()
        case 'api':
          return await this.getFromAPI()
        default:
          return this.getFromLocalStorage()
      }
    } catch (error) {
      console.error('Error loading from remote storage:', error)
      if (this.fallbackToLocal) {
        console.log('Falling back to localStorage')
        return this.getFromLocalStorage()
      }
      throw error
    }
  }

  // Store enrichment data to remote storage
  async storeContactEnrichment(contactId: string, data: Partial<GenomeEnrichmentData>): Promise<void> {
    const enrichmentData: GenomeEnrichmentData = {
      contactId,
      lastUpdated: new Date().toISOString(),
      source: 'genome_api',
      ...data
    } as GenomeEnrichmentData

    try {
      switch (this.storageType) {
        case 's3':
          await this.storeToS3(contactId, enrichmentData)
          break
        case 'github':
          await this.storeToGitHub(contactId, enrichmentData)
          break
        case 'api':
          await this.storeToAPI(contactId, enrichmentData)
          break
        default:
          this.storeToLocalStorage(contactId, enrichmentData)
      }
    } catch (error) {
      console.error('Error storing to remote storage:', error)
      if (this.fallbackToLocal) {
        console.log('Falling back to localStorage')
        this.storeToLocalStorage(contactId, enrichmentData)
      } else {
        throw error
      }
    }
  }

  // Batch store enrichment data
  async batchStoreEnrichment(enrichmentData: Record<string, Partial<GenomeEnrichmentData>>): Promise<void> {
    const enrichedData: Record<string, GenomeEnrichmentData> = {}
    
    for (const [contactId, data] of Object.entries(enrichmentData)) {
      enrichedData[contactId] = {
        contactId,
        lastUpdated: new Date().toISOString(),
        source: 'genome_api',
        ...data
      } as GenomeEnrichmentData
    }

    try {
      switch (this.storageType) {
        case 's3':
          await this.batchStoreToS3(enrichedData)
          break
        case 'github':
          await this.batchStoreToGitHub(enrichedData)
          break
        case 'api':
          await this.batchStoreToAPI(enrichedData)
          break
        default:
          this.batchStoreToLocalStorage(enrichedData)
      }
    } catch (error) {
      console.error('Error batch storing to remote storage:', error)
      if (this.fallbackToLocal) {
        console.log('Falling back to localStorage')
        this.batchStoreToLocalStorage(enrichedData)
      } else {
        throw error
      }
    }
  }

  // S3 Storage Methods
  private async getFromS3(): Promise<Record<string, GenomeEnrichmentData>> {
    // Implementation would use AWS SDK
    // For now, return empty object
    console.log('S3 storage not yet implemented')
    return {}
  }

  private async storeToS3(_contactId: string, _data: GenomeEnrichmentData): Promise<void> {
    console.log('S3 storage not yet implemented')
  }

  private async batchStoreToS3(_data: Record<string, GenomeEnrichmentData>): Promise<void> {
    console.log('S3 batch storage not yet implemented')
  }

  // GitHub Storage Methods
  private async getFromGitHub(): Promise<Record<string, GenomeEnrichmentData>> {
    try {
      const config = REMOTE_STORAGE_CONFIG.github
      const url = `https://raw.githubusercontent.com/${config.repo}/${config.branch}/${config.path}enrichment-data.json`
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`GitHub fetch failed: ${response.status}`)
      }
      
      const data = await response.json()
      return data.enrichmentData || {}
    } catch (error) {
      console.error('Error fetching from GitHub:', error)
      throw error
    }
  }

  private async storeToGitHub(_contactId: string, _data: GenomeEnrichmentData): Promise<void> {
    // GitHub storage requires API calls with authentication
    // This would need to be implemented with GitHub API
    console.log('GitHub storage not yet implemented')
  }

  private async batchStoreToGitHub(_data: Record<string, GenomeEnrichmentData>): Promise<void> {
    console.log('GitHub batch storage not yet implemented')
  }

  // API Storage Methods
  private async getFromAPI(): Promise<Record<string, GenomeEnrichmentData>> {
    try {
      const config = REMOTE_STORAGE_CONFIG.api
      const response = await fetch(`${config.baseUrl}${config.endpoints.get}`)
      
      if (!response.ok) {
        throw new Error(`API fetch failed: ${response.status}`)
      }
      
      const result = await response.json()
      return result.enrichmentData || {}
    } catch (error) {
      console.error('Error fetching from API:', error)
      throw error
    }
  }

  private async storeToAPI(contactId: string, data: GenomeEnrichmentData): Promise<void> {
    try {
      const config = REMOTE_STORAGE_CONFIG.api
      const response = await fetch(`${config.baseUrl}${config.endpoints.store}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contactId, data })
      })
      
      if (!response.ok) {
        throw new Error(`API store failed: ${response.status}`)
      }
    } catch (error) {
      console.error('Error storing to API:', error)
      throw error
    }
  }

  private async batchStoreToAPI(data: Record<string, GenomeEnrichmentData>): Promise<void> {
    try {
      const config = REMOTE_STORAGE_CONFIG.api
      const response = await fetch(`${config.baseUrl}${config.endpoints.batch}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enrichmentData: data })
      })
      
      if (!response.ok) {
        throw new Error(`API batch store failed: ${response.status}`)
      }
    } catch (error) {
      console.error('Error batch storing to API:', error)
      throw error
    }
  }

  // Local Storage Fallback Methods
  private getFromLocalStorage(): Record<string, GenomeEnrichmentData> {
    try {
      const data = localStorage.getItem('pharma-genome-enrichment-data')
      return data ? JSON.parse(data) : {}
    } catch (error) {
      console.error('Error loading from localStorage:', error)
      return {}
    }
  }

  private storeToLocalStorage(contactId: string, data: GenomeEnrichmentData): void {
    try {
      const allData = this.getFromLocalStorage()
      allData[contactId] = data
      localStorage.setItem('pharma-genome-enrichment-data', JSON.stringify(allData))
    } catch (error) {
      console.error('Error storing to localStorage:', error)
    }
  }

  private batchStoreToLocalStorage(data: Record<string, GenomeEnrichmentData>): void {
    try {
      const allData = this.getFromLocalStorage()
      Object.assign(allData, data)
      localStorage.setItem('pharma-genome-enrichment-data', JSON.stringify(allData))
    } catch (error) {
      console.error('Error batch storing to localStorage:', error)
    }
  }

  // Export/Import functionality
  async exportData(): Promise<string> {
    const allData = await this.getAllEnrichmentData()
    return JSON.stringify({ enrichmentData: allData }, null, 2)
  }

  async importData(jsonData: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonData)
      if (data.enrichmentData) {
        await this.batchStoreEnrichment(data.enrichmentData)
        return true
      }
      return false
    } catch (error) {
      console.error('Error importing data:', error)
      return false
    }
  }
}

// Export singleton instance
export const remoteGenomeStorage = new RemoteGenomeStorageManager()

// Helper function to enrich contacts with stored data
export async function enrichContactsWithRemoteData(contacts: Contact[]): Promise<Contact[]> {
  try {
    const enrichmentData = await remoteGenomeStorage.getAllEnrichmentData()
    
    return contacts.map(contact => {
      const enrichment = enrichmentData[contact.id]
      if (enrichment) {
        return {
          ...contact,
          emailCount: enrichment.emailCount,
          meetingCount: enrichment.meetingCount,
          totalActivity: enrichment.totalActivity,
          latestMeetingDate: enrichment.latestMeetingDate,
          lastEmailDate: enrichment.lastEmailDate,
          lastKlickster: enrichment.lastKlickster,
          linkedinLastPulled: enrichment.linkedinLastPulled,
          genomeCrmcontactId: enrichment.genomeCrmcontactId,
          contactId: enrichment.contactId,
          linkedinId: enrichment.linkedinId,
          leadId: enrichment.leadId,
        }
      }
      return contact
    })
  } catch (error) {
    console.error('Error enriching contacts with remote data:', error)
    return contacts
  }
}
