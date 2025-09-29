// Optimized Genome API integration with better performance
import type { Contact } from '@/types/domain'

const GENOME_BASE_URL = 'https://genome.klick.com/y/api'
const AUTH_TOKEN = 'DA0EE33B-CFD1-4B64-AF39-C31B58F71359'

export interface GenomeCompetitor {
  agency_name: string
  contact_name: string
  contact_title: string
  contact_email?: string
  last_interaction_date?: string
  interaction_type?: string
  client_id: number
}

export interface GenomeKlickster {
  klickster_name: string
  klickster_email: string
  interaction_date: string
  interaction_type: string
  notes?: string
  contact_id: number
}

export interface GenomeApiResponse<T> {
  data: T[]
  total_count: number
  page_num: number
  page_size: number
  has_more: boolean
}

export interface EnrichmentProgress {
  total: number
  processed: number
  completed: number
  errors: number
  currentBatch: number
  totalBatches: number
  estimatedTimeRemaining?: number
}

export interface EnrichmentResult {
  contactId: string
  competitors: GenomeCompetitor[]
  klicksters: GenomeKlickster[]
  error?: string
}

class OptimizedGenomeApiService {
  private cache = new Map<string, any>()
  private requestQueue: Array<() => Promise<any>> = []
  private isProcessing = false
  private maxConcurrentRequests = 10

  private async makeRequest<T>(endpoint: string, useCache = true): Promise<T> {
    // Check cache first
    if (useCache && this.cache.has(endpoint)) {
      return this.cache.get(endpoint)
    }

    try {
      const response = await fetch(`${GENOME_BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Genome API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      // Cache successful responses
      if (useCache) {
        this.cache.set(endpoint, data)
      }
      
      return data
    } catch (error) {
      console.error('Genome API request failed:', error)
      throw error
    }
  }

  /**
   * Get agency competitors for a specific client
   */
  async getClientCompetitors(
    clientId: number, 
    pageNum: number = 1, 
    pageSize: number = 100 // Increased page size
  ): Promise<GenomeApiResponse<GenomeCompetitor>> {
    const endpoint = `/client_insights/client/${clientId}/competitors?page_num=${pageNum}&page_size=${pageSize}`
    return this.makeRequest<GenomeApiResponse<GenomeCompetitor>>(endpoint)
  }

  /**
   * Get Klicksters who have interacted with a specific contact
   */
  async getContactKlicksters(
    contactId: number,
    fromDate: string,
    toDate: string
  ): Promise<GenomeApiResponse<GenomeKlickster>> {
    const endpoint = `/client_insights/contact/${contactId}/klicksters?from_date=${fromDate}&to_date=${toDate}`
    return this.makeRequest<GenomeApiResponse<GenomeKlickster>>(endpoint)
  }

  /**
   * Process requests with concurrency control
   */
  private async processRequestQueue(): Promise<void> {
    if (this.isProcessing) return
    this.isProcessing = true

    while (this.requestQueue.length > 0) {
      const batch = this.requestQueue.splice(0, this.maxConcurrentRequests)
      await Promise.allSettled(batch.map(request => request()))
      
      // Small delay to avoid overwhelming the API
      if (this.requestQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    this.isProcessing = false
  }

  /**
   * Add request to queue
   */
  private queueRequest<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await request()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      
      // Start processing if not already running
      this.processRequestQueue()
    })
  }

  /**
   * Optimized batch enrichment with progress tracking
   */
  async enrichContactsOptimized(
    contacts: Contact[],
    onProgress?: (progress: EnrichmentProgress) => void
  ): Promise<Map<string, EnrichmentResult>> {
    const results = new Map<string, EnrichmentResult>()
    const startTime = Date.now()
    
    // Filter contacts that have Genome IDs
    const contactsWithIds = contacts.filter(contact => 
      contact.genomeCrmcontactId || contact.contactId
    )

    const total = contactsWithIds.length
    let processed = 0
    let completed = 0
    let errors = 0

    // Group contacts by client ID to reduce API calls
    const clientGroups = new Map<number, Contact[]>()
    const contactGroups = new Map<number, Contact[]>()

    contactsWithIds.forEach(contact => {
      if (contact.genomeCrmcontactId) {
        const clientId = parseInt(contact.genomeCrmcontactId)
        if (!isNaN(clientId)) {
          if (!clientGroups.has(clientId)) {
            clientGroups.set(clientId, [])
          }
          clientGroups.get(clientId)!.push(contact)
        }
      }

      if (contact.contactId) {
        const contactId = parseInt(contact.contactId)
        if (!isNaN(contactId)) {
          if (!contactGroups.has(contactId)) {
            contactGroups.set(contactId, [])
          }
          contactGroups.get(contactId)!.push(contact)
        }
      }
    })

    // Process client groups (competitors)
    const clientPromises = Array.from(clientGroups.entries()).map(async ([clientId, clientContacts]) => {
      try {
        const competitorsResponse = await this.queueRequest(() => 
          this.getClientCompetitors(clientId)
        )
        
        // Apply competitors to all contacts in this client group
        clientContacts.forEach(contact => {
          if (!results.has(contact.id)) {
            results.set(contact.id, {
              contactId: contact.id,
              competitors: [],
              klicksters: []
            })
          }
          results.get(contact.id)!.competitors = competitorsResponse.data
        })
        
        processed += clientContacts.length
        completed += clientContacts.length
        
        if (onProgress) {
          const elapsed = Date.now() - startTime
          const rate = processed / elapsed
          const remaining = total - processed
          const estimatedTimeRemaining = remaining / rate
          
          onProgress({
            total,
            processed,
            completed,
            errors,
            currentBatch: Math.ceil(processed / 10),
            totalBatches: Math.ceil(total / 10),
            estimatedTimeRemaining
          })
        }
      } catch (error) {
        console.error(`Error processing client ${clientId}:`, error)
        errors += clientContacts.length
        processed += clientContacts.length
      }
    })

    // Process contact groups (Klicksters)
    const contactPromises = Array.from(contactGroups.entries()).map(async ([contactId, contacts]) => {
      try {
        const toDate = new Date().toISOString().split('T')[0]
        const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        
        const klickstersResponse = await this.queueRequest(() => 
          this.getContactKlicksters(contactId, fromDate, toDate)
        )
        
        // Apply Klicksters to all contacts in this group
        contacts.forEach(contact => {
          if (!results.has(contact.id)) {
            results.set(contact.id, {
              contactId: contact.id,
              competitors: [],
              klicksters: []
            })
          }
          results.get(contact.id)!.klicksters = klickstersResponse.data
        })
        
        processed += contacts.length
        completed += contacts.length
        
        if (onProgress) {
          const elapsed = Date.now() - startTime
          const rate = processed / elapsed
          const remaining = total - processed
          const estimatedTimeRemaining = remaining / rate
          
          onProgress({
            total,
            processed,
            completed,
            errors,
            currentBatch: Math.ceil(processed / 10),
            totalBatches: Math.ceil(total / 10),
            estimatedTimeRemaining
          })
        }
      } catch (error) {
        console.error(`Error processing contact ${contactId}:`, error)
        errors += contacts.length
        processed += contacts.length
      }
    })

    // Wait for all requests to complete
    await Promise.allSettled([...clientPromises, ...contactPromises])

    return results
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

export const optimizedGenomeApiService = new OptimizedGenomeApiService()
