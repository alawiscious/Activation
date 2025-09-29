// Enhanced Genome API integration with comprehensive client insights
import type { Contact } from '@/types/domain'

const GENOME_BASE_URL = 'https://genome.klick.com/y/api'
const AUTH_TOKEN = 'DA0EE33B-CFD1-4B64-AF39-C31B58F71359'

// Enhanced data interfaces based on the actual API responses
export interface EmailSentimentTrend {
  blue_results: EmailSentimentCompany[]
  red_results: EmailSentimentCompany[]
  red_email_categories: SentimentCategory[]
}

export interface EmailSentimentCompany {
  id: number
  name: string
  blue_emails_30: number
  blue_emails_30_60: number
  blue_emails_60_90: number
  red_emails_30: number
  red_emails_30_60: number
  red_emails_60_90: number
}

export interface SentimentCategory {
  id: number
  name: string
  sentiment_topic: string
  count: number
}

export interface ContactSearchResult {
  id: number
  name: string
  email: string
  title: string
  company: string
  functional_group?: string
  job_level?: string
  location?: string
  linkedin_url?: string
}

export interface ContactDetails {
  id: number
  name: string
  email: string
  title: string
  company: string
  functional_group: string
  job_level: string
  location: string
  linkedin_url: string
  phone?: string
  bio?: string
  last_activity?: string
  status: 'active' | 'inactive' | 'blocked'
  
  // Enhanced LinkedIn Data
  photo_url?: string
  linkedin_headline?: string
  linkedin_summary?: string
  linkedin_id?: string
  linkedin_public_id?: string
  follower_count?: number
  latitude?: number
  longitude?: number
  
  // Rich Profile Data
  education?: LinkedInEducation[]
  positions?: LinkedInPosition[]
  skills?: LinkedInSkill[]
  certifications?: any[]
  languages?: any[]
  recommendations_given?: LinkedInRecommendation[]
  recommendations_received?: LinkedInRecommendation[]
  frequency_data?: FrequencyData[]
  tags?: any[]
  
  // Activity Metrics
  meeting_count?: number
  email_count?: number
  total_activity?: number
  latest_email_date?: string
  latest_meeting_date?: string
  as_of_date?: string
}

export interface ContactPeer {
  id: number
  name: string
  title: string
  company: string
  relationship_type: string
  connection_strength: number
}

export interface ContactMeeting {
  id: number
  title: string
  date: string
  duration: number
  participants: string[]
  meeting_type: string
  outcome?: string
}

export interface ContactNews {
  id: number
  title: string
  url: string
  published_date: string
  source: string
  sentiment: 'positive' | 'negative' | 'neutral'
  relevance_score: number
}

export interface ContactHeatmap {
  interaction_frequency: Record<string, number>
  preferred_communication_channels: string[]
  best_contact_times: string[]
  engagement_score: number
}

export interface FunctionalGroup {
  id: number
  name: string
  description: string
}

export interface JobFunction {
  id: number
  name: string
  category: string
}

export interface JobLevel {
  id: number
  name: string
  seniority: number
}

export interface GenomeNote {
  id: number
  note: string
  creation_datetime: string
  entity_id: number | null
  entity_type: string
  explicit_tags: Array<{
    name: string
    source: string
  }>
  is_private: boolean
  note_context_key: string | null
  note_context_value: string | null
  photo_url: string
  tags: Array<{
    entity_id: number
    entity_type: string
    tag: string
  }>
  user_id: number
  user_name: string
}

export interface CreateNoteParams {
  note: string
  entity_tag?: Record<string, any>
  explicit_tag?: string[]
  is_private?: boolean
}

export interface UpdateNoteParams {
  note: string
  entity_tag?: Record<string, any>
  explicit_tag?: string[]
  is_private?: boolean
}

export interface ContactStatusUpdate {
  not_a_contact?: boolean
  // Add other status fields as discovered
}

export interface UserNote {
  id: number
  note: string
  creation_datetime: string
  entity_id: number
  entity_type: string
  explicit_tags: Array<{
    name: string
    source: string
  }>
  is_private: boolean
  note_context_key?: string
  note_context_value?: string
  tags: Array<{
    entity_id: number
    entity_type: string
    tag: string
  }>
  user_id: number
}

export interface NoteTagUpdate {
  entity_tag?: Record<string, any>
  explicit_tag?: string[]
}

export interface ExplicitTag {
  id: number
  name: string
}

export interface UserPreference {
  id?: number
  entity_type: string
  entity_id: number
  preference_type: string
  created_at?: string
  updated_at?: string
}

export interface UserPreferenceParams {
  preference_type?: string
  entity_type?: string
}

export interface ContactCompetitorParams {
  page_num?: number
  page_size?: number
  q?: string
  from_date?: string
  to_date?: string
  sort_by?: 'meeting_count' | 'email_count'
}

export interface ContactSearchParams {
  q?: string
  csts?: number[]
  clients?: number[]
  job_levels?: number[]
  job_functions?: string[]
  function_groups?: string[]
  competitor_contact_ids?: number[]
  competitor_company_ids?: number[]
  page_num?: number
  page_size?: number
  favorites_only?: boolean
  include_non_klick?: boolean
  contact_status?: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    first: number
    has_next: boolean
    has_prev: boolean
    last: number
    next: number | null
    page_num: number
    page_size: number
    pages: number
    prev: number | null
    total: number
  }
}

export interface JobLevel {
  seniority_level: number
  seniority_level_desc: string
}

export interface CompetitorContactStatusUpdate {
  not_a_contact?: boolean
}

export interface CompetitorContactSearchParams {
  q?: string
  csts?: number[]
  clients?: number[]
  job_levels?: number[]
  job_functions?: string[]
  function_groups?: string[]
  include_non_klick?: boolean
  competitors?: number[]
  page_num?: number
  page_size?: number
  favorites_only?: boolean
  contact_status?: boolean
}

export interface CompetitorCompanySearchParams {
  q?: string
  csts?: number[]
  clients?: number[]
  favorites_only?: boolean
  page_num?: number
  page_size?: number
}

export interface ClientOpportunity {
  id: number
  title: string
  description?: string
  value?: number
  currency?: string
  stage?: string
  probability?: number
  expected_close_date?: string
  created_date?: string
  updated_date?: string
  status: 'active' | 'won' | 'lost' | 'on_hold'
  source?: string
  contact_id?: number
  contact_name?: string
  contact_email?: string
}

export interface CompetitorCompanyDetails {
  id: number
  company: string
  description: string
  domain: string[]
  employee_count: number
  is_competitor: boolean
  is_favorite: boolean
  linkedin_id: string
  logo_url: string
  website_url: string
  total_companies: number
  total_contacts: number
  created_by?: string
  created_date: string
  updated_by?: string
  updated_date: string
}

export interface ClientSearchParams {
  q?: string
  csts?: number[]
  clients?: number[]
  competitor_contact_ids?: number[]
  competitor_company_ids?: number[]
  page_num?: number
  page_size?: number
  include_red_emails?: boolean
  favorites_only?: boolean
}

export interface ClientSearchResult {
  id: number
  name: string
  status: string
  industry?: string
  size?: string
  location?: string
  website?: string
  relationship_status?: string
  last_activity?: string
  email_sentiment_score?: number
  total_emails?: number
  red_emails?: number
  blue_emails?: number
}

export interface ClientSearchResponse {
  data: ClientSearchResult[]
  pagination: {
    first: number
    has_next: boolean
    has_prev: boolean
    last: number
    next: number | null
    page_num: number
    page_size: number
    pages: number
    prev: number | null
    total: number
  }
}

export interface CompetitorCompany {
  id: number
  name: string
  industry: string
  size: string
  location: string
  website: string
  relationship_status: 'competitor' | 'partner' | 'neutral'
}

export interface LinkedInEducation {
  id: number
  degree_name: string | null
  end_month: number
  end_year: number
  field_of_study: string | null
  last_updated: string
  linkedin_url: string
  person_id: number
  school_logo: string | null
  school_name: string
  start_month: number
  start_year: number
}

export interface LinkedInPosition {
  id: number
  agency_department_id: number | null
  company_location: string
  company_logo: string
  company_name: string
  contract_type: string | null
  description: string
  end_month: number | null
  end_year: number | null
  functional_area_desc: string | null
  functional_area_id: number | null
  last_updated: string
  linkedin_id: string
  linkedin_url: string
  person_id: number
  seniority_desc: string | null
  seniority_level: number | null
  start_month: number
  start_year: number
  title: string
}

export interface LinkedInSkill {
  id: number
  skill: string
}

export interface LinkedInRecommendation {
  id: number
  recommender_name: string
  recommender_title: string
  recommender_company: string
  recommendation_text: string
  relationship_type: string
  created_date: string
}

export interface FrequencyData {
  cumulative_count: string
  interaction_type: string
  week_start: string
  weekly_count: number
}

export interface CompetitorContact {
  id: number
  competitor_contact_id: number
  crm_competitor_id: number
  person_id: number
  first_name: string
  last_name: string
  title: string
  company: string
  curr_company: string
  email: string
  email_domain: string
  email_count: number
  functional_area: string
  functional_group: string
  seniority_level: number
  seniority_level_desc: string
  location: string
  is_competitor: boolean
  is_favorite: boolean
  not_a_contact: boolean
  total_activity: number
  meeting_count: number
  latest_email_date: string
  latest_meeting_date: string
  as_of_date: string
  company_count: number
  domain: string[]
  photo_url: string
  
  // Rich LinkedIn Data
  education: LinkedInEducation[]
  positions: LinkedInPosition[]
  skills: LinkedInSkill[]
  certifications: any[]
  languages: any[]
  recommendations_given: LinkedInRecommendation[]
  recommendations_received: LinkedInRecommendation[]
  frequency_data: FrequencyData[]
  tags: any[]
}

class EnhancedGenomeApiService {
  private cache = new Map<string, any>()
  private cacheExpiry = new Map<string, number>()
  private readonly CACHE_DURATION = 15 * 60 * 1000 // 15 minutes for dynamic data
  

  private async makeRequest<T>(endpoint: string, useCache = true): Promise<T> {
    const cacheKey = endpoint
    
    // Check cache first
    if (useCache && this.cache.has(cacheKey)) {
      const expiry = this.cacheExpiry.get(cacheKey) || 0
      if (Date.now() < expiry) {
        return this.cache.get(cacheKey)
      }
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
      if (useCache && data.status === 'success') {
        this.cache.set(cacheKey, data.data)
        this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION)
      }
      
      return data.data
    } catch (error) {
      console.error('Enhanced Genome API request failed:', error)
      throw error
    }
  }

  // ===== EMAIL SENTIMENT & RELATIONSHIP INTELLIGENCE =====

  /**
   * Get email sentiment trends across all clients
   * This shows which clients have positive vs negative communication patterns
   */
  async getEmailSentimentTrends(): Promise<EmailSentimentTrend> {
    return this.makeRequest<EmailSentimentTrend>('/client_insights/client/email_sentiment_trend')
  }

  /**
   * Get sentiment analysis for a specific client
   */
  async getClientSentiment(clientId: number): Promise<EmailSentimentCompany | null> {
    const trends = await this.getEmailSentimentTrends()
    
    // Find client in both blue and red results
    const blueResult = trends.blue_results.find(c => c.id === clientId)
    const redResult = trends.red_results.find(c => c.id === clientId)
    
    if (blueResult) return blueResult
    if (redResult) return redResult
    
    return null
  }

  /**
   * Get sentiment categories for problematic clients
   */
  async getSentimentCategories(): Promise<SentimentCategory[]> {
    const trends = await this.getEmailSentimentTrends()
    return trends.red_email_categories
  }

  // ===== CONTACT SEARCH & DISCOVERY =====


  /**
   * Search for competitor contacts with advanced filtering
   */
  async searchCompetitorContacts(searchParams: CompetitorContactSearchParams): Promise<PaginatedResponse<CompetitorContact>> {
    const endpoint = '/client_insights/competitors/contacts/search'
    
    try {
      const response = await fetch(`${GENOME_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchParams)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(`Genome API error for ${endpoint}: ${response.status} - ${errorData.message || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Error searching competitor contacts for ${endpoint}:`, error)
      throw error
    }
  }

  /**
   * Get detailed competitor contact information
   */
  async getCompetitorContact(contactId: number): Promise<CompetitorContact> {
    return this.makeRequest<CompetitorContact>(`/client_insights/competitors/contacts/${contactId}`)
  }

  /**
   * Update competitor contact status
   */
  async updateCompetitorContactStatus(contactId: number, statusUpdate: CompetitorContactStatusUpdate): Promise<any> {
    const endpoint = `/client_insights/competitors/contacts/${contactId}/status`
    
    try {
      const response = await fetch(`${GENOME_BASE_URL}${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(statusUpdate)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(`Genome API error for ${endpoint}: ${response.status} - ${errorData.message || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Error updating competitor contact status for ${endpoint}:`, error)
      throw error
    }
  }

  /**
   * Get full contact details
   */
  async getContactDetails(contactId: number): Promise<ContactDetails> {
    return this.makeRequest<ContactDetails>(`/client_insights/contact/${contactId}`)
  }

  /**
   * Advanced contact search with comprehensive filtering
   */
  async searchContacts(searchParams: ContactSearchParams): Promise<PaginatedResponse<ContactSearchResult>> {
    const endpoint = '/client_insights/contact/search'
    
    try {
      const response = await fetch(`${GENOME_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchParams)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(`Genome API error for ${endpoint}: ${response.status} - ${errorData.message || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Error searching contacts for ${endpoint}:`, error)
      throw error
    }
  }

  // ===== RELATIONSHIP INTELLIGENCE =====

  /**
   * Get contact's professional network (peers) with optional date filtering
   */
  async getContactPeers(contactId: number, fromDate?: string, toDate?: string): Promise<ContactPeer[]> {
    let endpoint = `/client_insights/contact/${contactId}/peers`
    
    if (fromDate || toDate) {
      const params = new URLSearchParams()
      if (fromDate) params.append('from_date', fromDate)
      if (toDate) params.append('to_date', toDate)
      endpoint += `?${params.toString()}`
    }
    
    return this.makeRequest<ContactPeer[]>(endpoint)
  }

  /**
   * Get contact's competitive relationships with advanced filtering
   */
  async getContactCompetitors(contactId: number, params?: ContactCompetitorParams): Promise<PaginatedResponse<CompetitorContact>> {
    let endpoint = `/client_insights/contact/${contactId}/competitors`
    
    if (params) {
      const searchParams = new URLSearchParams()
      if (params.page_num) searchParams.append('page_num', params.page_num.toString())
      if (params.page_size) searchParams.append('page_size', params.page_size.toString())
      if (params.q) searchParams.append('q', params.q)
      if (params.from_date) searchParams.append('from_date', params.from_date)
      if (params.to_date) searchParams.append('to_date', params.to_date)
      if (params.sort_by) searchParams.append('sort_by', params.sort_by)
      
      if (searchParams.toString()) {
        endpoint += `?${searchParams.toString()}`
      }
    }
    
    return this.makeRequest<PaginatedResponse<CompetitorContact>>(endpoint)
  }

  /**
   * Get contact's interaction patterns (heatmap)
   */
  async getContactHeatmap(contactId: number): Promise<ContactHeatmap> {
    return this.makeRequest<ContactHeatmap>(`/client_insights/contact/${contactId}/heatmap`)
  }

  // ===== ACTIVITY & ENGAGEMENT =====

  /**
   * Get contact's meeting history with optional date filtering
   */
  async getContactMeetings(contactId: number, fromDate?: string, toDate?: string): Promise<ContactMeeting[]> {
    let endpoint = `/client_insights/contact/${contactId}/meetings`
    
    if (fromDate || toDate) {
      const params = new URLSearchParams()
      if (fromDate) params.append('from_date', fromDate)
      if (toDate) params.append('to_date', toDate)
      endpoint += `?${params.toString()}`
    }
    
    return this.makeRequest<ContactMeeting[]>(endpoint)
  }

  /**
   * Update contact status
   */
  async updateContactStatus(contactId: number, statusUpdate: ContactStatusUpdate): Promise<any> {
    const endpoint = `/client_insights/contact/${contactId}/status`
    
    try {
      const response = await fetch(`${GENOME_BASE_URL}${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(statusUpdate)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(`Genome API error for ${endpoint}: ${response.status} - ${errorData.message || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Error updating contact status for ${endpoint}:`, error)
      throw error
    }
  }

  /**
   * Get recent news/mentions about contact with optional date filtering
   */
  async getContactNews(contactId: number, fromDate?: string): Promise<ContactNews[]> {
    let endpoint = `/client_insights/contact/${contactId}/news`
    
    if (fromDate) {
      endpoint += `?from_date=${fromDate}`
    }
    
    return this.makeRequest<ContactNews[]>(endpoint)
  }

  /**
   * Get contact-specific notes
   */
  async getContactNotes(contactId: number): Promise<GenomeNote[]> {
    return this.makeRequest<GenomeNote[]>(`/client_insights/contact/${contactId}/notes`)
  }

  /**
   * Create a note for a specific contact
   */
  async createContactNote(contactId: number, noteParams: CreateNoteParams): Promise<GenomeNote> {
    const endpoint = `/client_insights/contact/${contactId}/notes`
    
    try {
      const response = await fetch(`${GENOME_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteParams)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(`Genome API error for ${endpoint}: ${response.status} - ${errorData.message || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Error creating contact note for ${endpoint}:`, error)
      throw error
    }
  }

  /**
   * Update a specific contact note
   */
  async updateContactNote(contactId: number, noteId: number, noteParams: UpdateNoteParams): Promise<GenomeNote> {
    const endpoint = `/client_insights/contact/${contactId}/note/${noteId}`
    
    try {
      const response = await fetch(`${GENOME_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteParams)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(`Genome API error for ${endpoint}: ${response.status} - ${errorData.message || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Error updating contact note for ${endpoint}:`, error)
      throw error
    }
  }

  /**
   * Delete a specific contact note
   */
  async deleteContactNote(noteId: number): Promise<any> {
    const endpoint = `/client_insights/contact/note/${noteId}`
    
    try {
      const response = await fetch(`${GENOME_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(`Genome API error for ${endpoint}: ${response.status} - ${errorData.message || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Error deleting contact note for ${endpoint}:`, error)
      throw error
    }
  }

  /**
   * Get contact's Klickster interactions with optional date filtering
   */
  async getContactKlicksters(contactId: number, fromDate?: string, toDate?: string): Promise<any[]> {
    let endpoint = `/client_insights/contact/${contactId}/klicksters`
    
    if (fromDate || toDate) {
      const params = new URLSearchParams()
      if (fromDate) params.append('from_date', fromDate)
      if (toDate) params.append('to_date', toDate)
      endpoint += `?${params.toString()}`
    }
    
    return this.makeRequest<any[]>(endpoint)
  }

  // ===== ORGANIZATIONAL INTELLIGENCE =====

  /**
   * Get available functional groups
   */
  async getFunctionalGroups(): Promise<string[]> {
    return this.makeRequest<string[]>('/client_insights/contact/functional_groups')
  }

  /**
   * Get job functions taxonomy
   */
  async getJobFunctions(): Promise<string[]> {
    return this.makeRequest<string[]>('/client_insights/contact/job_functions')
  }

  /**
   * Get job levels/seniority with detailed descriptions
   */
  async getJobLevels(): Promise<JobLevel[]> {
    return this.makeRequest<JobLevel[]>('/client_insights/contact/job_levels')
  }

  // ===== COMPETITIVE INTELLIGENCE =====

  /**
   * Search for competitor companies with advanced filtering
   */
  async searchCompetitorCompanies(searchParams: CompetitorCompanySearchParams): Promise<PaginatedResponse<CompetitorCompany>> {
    const endpoint = '/client_insights/competitors/companies/search'
    
    try {
      const response = await fetch(`${GENOME_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchParams)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(`Genome API error for ${endpoint}: ${response.status} - ${errorData.message || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Error searching competitor companies for ${endpoint}:`, error)
      throw error
    }
  }

  /**
   * Get competitor company details
   */
  async getCompetitorCompany(companyId: number): Promise<CompetitorCompanyDetails> {
    return this.makeRequest<CompetitorCompanyDetails>(`/client_insights/competitor-company/${companyId}`)
  }

  /**
   * Get competitor company activity heatmap
   */
  async getCompetitorCompanyHeatmap(companyId: number): Promise<ContactHeatmap> {
    return this.makeRequest<ContactHeatmap>(`/client_insights/competitor-company/${companyId}/heatmap`)
  }

  // ===== CLIENT INTELLIGENCE =====

  /**
   * Search for clients with advanced filtering
   */
  async searchClients(searchParams: ClientSearchParams): Promise<ClientSearchResponse> {
    const endpoint = '/client_insights/client/search'
    
    try {
      const response = await fetch(`${GENOME_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchParams)
      })

      if (!response.ok) {
        throw new Error(`Client search API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Client search request failed:', error)
      throw error
    }
  }

  /**
   * Get client competitors
   */
  async getClientCompetitors(clientId: number): Promise<CompetitorContact[]> {
    return this.makeRequest<CompetitorContact[]>(`/client_insights/client/${clientId}/competitors`)
  }

  /**
   * Get client activity heatmap
   */
  async getClientHeatmap(clientId: number): Promise<ContactHeatmap> {
    return this.makeRequest<ContactHeatmap>(`/client_insights/client/${clientId}/heatmap`)
  }

  /**
   * Get client meeting history with date filtering
   */
  async getClientMeetings(
    clientId: number, 
    fromDate?: string, 
    toDate?: string
  ): Promise<ContactMeeting[]> {
    let endpoint = `/client_insights/client/${clientId}/meetings`
    
    // Add date parameters if provided
    const params = new URLSearchParams()
    if (fromDate) params.append('from_date', fromDate)
    if (toDate) params.append('to_date', toDate)
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`
    }
    
    return this.makeRequest<ContactMeeting[]>(endpoint)
  }

  /**
   * Get client news/mentions
   */
  async getClientNews(clientId: number): Promise<ContactNews[]> {
    return this.makeRequest<ContactNews[]>(`/client_insights/client/${clientId}/news`)
  }

  /**
   * Get client Klickster interactions with date filtering
   */
  async getClientKlicksters(
    clientId: number, 
    fromDate?: string, 
    toDate?: string
  ): Promise<any[]> {
    let endpoint = `/client_insights/client/${clientId}/klicksters`
    
    // Add date parameters if provided
    const params = new URLSearchParams()
    if (fromDate) params.append('from_date', fromDate)
    if (toDate) params.append('to_date', toDate)
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`
    }
    
    return this.makeRequest<any[]>(endpoint)
  }

  // ===== NOTE MANAGEMENT =====

  /**
   * Get client notes
   */
  async getClientNotes(clientId: number): Promise<GenomeNote[]> {
    return this.makeRequest<GenomeNote[]>(`/client_insights/client/${clientId}/notes`)
  }

  /**
   * Get specific user note
   */
  async getUserNote(noteId: number): Promise<UserNote> {
    return this.makeRequest<UserNote>(`/client_insights/user_note/${noteId}`)
  }

  /**
   * Update note tags
   */
  async updateNoteTags(noteId: number, tagUpdate: NoteTagUpdate): Promise<UserNote> {
    const endpoint = `/client_insights/user_note/${noteId}/tag`
    
    try {
      const response = await fetch(`${GENOME_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tagUpdate)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(`Genome API error for ${endpoint}: ${response.status} - ${errorData.message || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Error updating note tags for ${endpoint}:`, error)
      throw error
    }
  }

  /**
   * Get available explicit tags
   */
  async getExplicitTags(): Promise<ExplicitTag[]> {
    return this.makeRequest<ExplicitTag[]>('/client_insights/user_notes/explicit_tags')
  }

  // ===== USER PREFERENCES =====

  /**
   * Get user preferences
   */
  async getUserPreferences(params?: UserPreferenceParams): Promise<UserPreference[]> {
    let endpoint = '/client_insights/user_preference'
    
    if (params) {
      const searchParams = new URLSearchParams()
      if (params.preference_type) searchParams.append('preference_type', params.preference_type)
      if (params.entity_type) searchParams.append('entity_type', params.entity_type)
      
      if (searchParams.toString()) {
        endpoint += `?${searchParams.toString()}`
      }
    }
    
    return this.makeRequest<UserPreference[]>(endpoint)
  }

  /**
   * Add user preference
   */
  async addUserPreference(preference: Omit<UserPreference, 'id' | 'created_at' | 'updated_at'>): Promise<UserPreference> {
    const endpoint = '/client_insights/user_preference'
    
    try {
      const response = await fetch(`${GENOME_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preference)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(`Genome API error for ${endpoint}: ${response.status} - ${errorData.message || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Error adding user preference for ${endpoint}:`, error)
      throw error
    }
  }

  /**
   * Remove user preference
   */
  async removeUserPreference(preference: Omit<UserPreference, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    const endpoint = '/client_insights/user_preference'
    
    try {
      const response = await fetch(`${GENOME_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preference)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(`Genome API error for ${endpoint}: ${response.status} - ${errorData.message || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Error removing user preference for ${endpoint}:`, error)
      throw error
    }
  }

  /**
   * Get client opportunities
   */
  async getClientOpportunities(clientId: number): Promise<ClientOpportunity[]> {
    return this.makeRequest<ClientOpportunity[]>(`/client_insights/client/${clientId}/opportunities`)
  }

  /**
   * Create a new client note
   */
  async createClientNote(clientId: number, noteParams: CreateNoteParams): Promise<GenomeNote> {
    const endpoint = `/client_insights/client/${clientId}/notes`
    
    try {
      const response = await fetch(`${GENOME_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteParams)
      })

      if (!response.ok) {
        throw new Error(`Create note API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      console.error('Create note request failed:', error)
      throw error
    }
  }

  /**
   * Update an existing client note
   */
  async updateClientNote(
    clientId: number, 
    noteId: number, 
    noteParams: UpdateNoteParams
  ): Promise<GenomeNote> {
    const endpoint = `/client_insights/client/${clientId}/note/${noteId}`
    
    try {
      const response = await fetch(`${GENOME_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteParams)
      })

      if (!response.ok) {
        throw new Error(`Update note API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      console.error('Update note request failed:', error)
      throw error
    }
  }

  /**
   * Delete a client note
   */
  async deleteClientNote(clientId: number, noteId: number): Promise<boolean> {
    const endpoint = `/client_insights/client/${clientId}/note/${noteId}`
    
    try {
      const response = await fetch(`${GENOME_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`Delete note API error: ${response.status} ${response.statusText}`)
      }

      return true
    } catch (error) {
      console.error('Delete note request failed:', error)
      throw error
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
    this.cacheExpiry.clear()
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

  /**
   * Enrich a contact with comprehensive Genome data using real IDs from contact data
   */
  async enrichContactComprehensively(contact: Contact): Promise<{
    sentiment?: EmailSentimentCompany
    clientCompetitors?: CompetitorContact[]
    clientHeatmap?: any
    clientKlicksters?: any[]
    clientMeetings?: ContactMeeting[]
    clientNews?: ContactNews[]
    clientNotes?: GenomeNote[]
    clientOpportunities?: ClientOpportunity[]
    peers?: ContactPeer[]
    contactCompetitors?: CompetitorContact[]
    contactHeatmap?: ContactHeatmap
    meetings?: ContactMeeting[]
    news?: ContactNews[]
    klicksters?: any[]
  }> {
    const results: any = {}

    try {
      // Get client-level data if we have a genomeCrmcontactId (client ID)
      if (contact.genomeCrmcontactId) {
        const clientId = parseInt(contact.genomeCrmcontactId)
        if (!isNaN(clientId)) {
          console.log(`Enriching client data for client ID: ${clientId} (${contact.currCompany})`)
          
          // Get date range for Klickster interactions (last 30 days)
          const toDate = new Date().toISOString().split('T')[0]
          const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

          const [sentiment, clientCompetitors, clientHeatmap, clientKlicksters, clientMeetings, clientNews, clientNotes, clientOpportunities] = await Promise.allSettled([
            this.getClientSentiment(clientId),
            this.getClientCompetitors(clientId),
            this.getClientHeatmap(clientId),
            this.getClientKlicksters(clientId, fromDate, toDate),
            this.getClientMeetings(clientId, fromDate, toDate),
            this.getClientNews(clientId),
            this.getClientNotes(clientId),
            this.getClientOpportunities(clientId)
          ])

          if (sentiment.status === 'fulfilled') results.sentiment = sentiment.value
          if (clientCompetitors.status === 'fulfilled') results.clientCompetitors = clientCompetitors.value
          if (clientHeatmap.status === 'fulfilled') results.clientHeatmap = clientHeatmap.value
          if (clientKlicksters.status === 'fulfilled') results.clientKlicksters = clientKlicksters.value
          if (clientMeetings.status === 'fulfilled') results.clientMeetings = clientMeetings.value
          if (clientNews.status === 'fulfilled') results.clientNews = clientNews.value
          if (clientNotes.status === 'fulfilled') results.clientNotes = clientNotes.value
          if (clientOpportunities.status === 'fulfilled') results.clientOpportunities = clientOpportunities.value
        }
      }

      // Get contact-specific data if we have a contactId
      if (contact.contactId) {
        const contactId = parseInt(contact.contactId)
        if (!isNaN(contactId)) {
          console.log(`Enriching contact data for contact ID: ${contactId} (${contact.firstName} ${contact.lastName})`)
          
          const [peers, contactCompetitors, contactHeatmap, meetings, news, klicksters] = await Promise.allSettled([
            this.getContactPeers(contactId),
            this.getContactCompetitors(contactId),
            this.getContactHeatmap(contactId),
            this.getContactMeetings(contactId),
            this.getContactNews(contactId),
            this.getContactKlicksters(contactId)
          ])

          if (peers.status === 'fulfilled') results.peers = peers.value
          if (contactCompetitors.status === 'fulfilled') results.contactCompetitors = contactCompetitors.value
          if (contactHeatmap.status === 'fulfilled') results.contactHeatmap = contactHeatmap.value
          if (meetings.status === 'fulfilled') results.meetings = meetings.value
          if (news.status === 'fulfilled') results.news = news.value
          if (klicksters.status === 'fulfilled') results.klicksters = klicksters.value
        }
      }

      return results
    } catch (error) {
      console.error('Comprehensive contact enrichment failed:', error)
      return results
    }
  }

  /**
   * Get all unique client IDs from contacts for batch operations
   */
  getUniqueClientIds(contacts: Contact[]): number[] {
    const clientIds = new Set<number>()
    
    contacts.forEach(contact => {
      if (contact.genomeCrmcontactId) {
        const clientId = parseInt(contact.genomeCrmcontactId)
        if (!isNaN(clientId)) {
          clientIds.add(clientId)
        }
      }
    })
    
    return Array.from(clientIds)
  }

  /**
   * Get all unique contact IDs from contacts for batch operations
   */
  getUniqueContactIds(contacts: Contact[]): number[] {
    const contactIds = new Set<number>()
    
    contacts.forEach(contact => {
      if (contact.contactId) {
        const contactId = parseInt(contact.contactId)
        if (!isNaN(contactId)) {
          contactIds.add(contactId)
        }
      }
    })
    
    return Array.from(contactIds)
  }
}

export const enhancedGenomeApiService = new EnhancedGenomeApiService()
