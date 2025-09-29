// Genome API integration for contact enrichment
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

class GenomeApiService {
  private async makeRequest<T>(endpoint: string): Promise<T> {
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

      return await response.json()
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
    pageSize: number = 20
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
   * Enrich a contact with Genome data
   */
  async enrichContact(contact: Contact): Promise<{
    competitors: GenomeCompetitor[]
    klicksters: GenomeKlickster[]
  }> {
    const results = {
      competitors: [] as GenomeCompetitor[],
      klicksters: [] as GenomeKlickster[]
    }

    try {
      // Get competitors if we have a client ID
      if (contact.genomeCrmcontactId) {
        const clientId = parseInt(contact.genomeCrmcontactId)
        if (!isNaN(clientId)) {
          const competitorsResponse = await this.getClientCompetitors(clientId)
          results.competitors = competitorsResponse.data
        }
      }

      // Get Klicksters if we have a contact ID
      if (contact.contactId) {
        const contactId = parseInt(contact.contactId)
        if (!isNaN(contactId)) {
          // Get last 30 days of interactions
          const toDate = new Date().toISOString().split('T')[0]
          const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          
          const klickstersResponse = await this.getContactKlicksters(contactId, fromDate, toDate)
          results.klicksters = klickstersResponse.data
        }
      }
    } catch (error) {
      console.error('Failed to enrich contact with Genome data:', error)
    }

    return results
  }

  /**
   * Batch enrich multiple contacts
   */
  async enrichContacts(contacts: Contact[]): Promise<Map<string, {
    competitors: GenomeCompetitor[]
    klicksters: GenomeKlickster[]
  }>> {
    const results = new Map()
    
    // Process in batches to avoid overwhelming the API
    const batchSize = 5
    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (contact) => {
        const enrichment = await this.enrichContact(contact)
        results.set(contact.id, enrichment)
      })
      
      await Promise.all(batchPromises)
      
      // Add a small delay between batches
      if (i + batchSize < contacts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    return results
  }
}

export const genomeApiService = new GenomeApiService()
