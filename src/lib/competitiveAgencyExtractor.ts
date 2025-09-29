// Competitive Agency Extractor - Identifies all competitive agencies from Genome API
import { enhancedGenomeApiService } from './enhancedGenomeApi'

export interface CompetitiveAgency {
  id: number
  name: string
  industry: string
  size: string
  location: string
  website?: string
  relationshipStatus: 'competitor' | 'partner' | 'neutral'
  lastActivity?: string
  totalContacts?: number
  totalMeetings?: number
  totalEmails?: number
}

export interface AgencyExtractionResult {
  agencies: CompetitiveAgency[]
  totalFound: number
  lastUpdated: string
  extractionMethod: 'genome_api' | 'manual_analysis'
}

class CompetitiveAgencyExtractor {
  private extractedAgencies: Map<string, CompetitiveAgency> = new Map()
  private lastExtraction: Date | null = null

  /**
   * Extract all competitive agencies from Genome API
   */
  async extractAllCompetitiveAgencies(): Promise<AgencyExtractionResult> {
    try {
      console.log('Starting competitive agency extraction from Genome API...')
      
      // Search for competitor companies with broad parameters
      const searchParams = {
        q: '', // Empty query to get all results
        page_num: 1,
        page_size: 1000, // Large page size to get comprehensive results
        sort_by: 'name' as const
      }

      const competitorCompanies = await enhancedGenomeApiService.searchCompetitorCompanies(searchParams)
      
      // Filter and process results
      const agencies: CompetitiveAgency[] = []
      
      if (competitorCompanies.data && Array.isArray(competitorCompanies.data)) {
        for (const company of competitorCompanies.data) {
          // Filter for agencies (not pharmaceutical companies)
          if (this.isAgency(company)) {
            const agency: CompetitiveAgency = {
              id: company.id,
              name: company.name,
              industry: company.industry || 'Unknown',
              size: company.size || 'Unknown',
              location: company.location || 'Unknown',
              website: company.website,
              relationshipStatus: company.relationship_status || 'competitor',
              lastActivity: (company as any).last_activity
            }
            
            agencies.push(agency)
            this.extractedAgencies.set(company.name.toLowerCase(), agency)
          }
        }
      }

      this.lastExtraction = new Date()
      
      console.log(`Extracted ${agencies.length} competitive agencies from Genome API`)
      
      return {
        agencies: agencies.sort((a, b) => a.name.localeCompare(b.name)),
        totalFound: agencies.length,
        lastUpdated: this.lastExtraction.toISOString(),
        extractionMethod: 'genome_api'
      }
      
    } catch (error) {
      console.error('Error extracting competitive agencies:', error)
      
      // Fallback to known competitive agencies if API fails
      return this.getFallbackAgencies()
    }
  }

  /**
   * Determine if a company is an agency (not a pharmaceutical company)
   */
  private isAgency(company: any): boolean {
    const name = company.name?.toLowerCase() || ''
    const industry = company.industry?.toLowerCase() || ''
    
    // Agency indicators
    const agencyKeywords = [
      'agency', 'advertising', 'marketing', 'communications', 'digital', 'creative',
      'consulting', 'strategy', 'media', 'public relations', 'pr', 'brand',
      'interactive', 'social', 'content', 'design', 'studio', 'group',
      'partners', 'associates', 'collective', 'network', 'worldwide', 'global'
    ]
    
    // Pharmaceutical company indicators (to exclude)
    const pharmaKeywords = [
      'pharmaceutical', 'pharma', 'biotech', 'biotechnology', 'medical device',
      'healthcare', 'therapeutics', 'drug', 'medicine', 'clinical', 'research',
      'laboratories', 'labs', 'inc', 'corp', 'corporation', 'company'
    ]
    
    // Check if it's clearly an agency
    const hasAgencyKeywords = agencyKeywords.some(keyword => 
      name.includes(keyword) || industry.includes(keyword)
    )
    
    // Check if it's clearly a pharma company
    const hasPharmaKeywords = pharmaKeywords.some(keyword => 
      name.includes(keyword) || industry.includes(keyword)
    )
    
    // If it has agency keywords and not pharma keywords, it's likely an agency
    if (hasAgencyKeywords && !hasPharmaKeywords) {
      return true
    }
    
    // If it has pharma keywords, it's likely not an agency
    if (hasPharmaKeywords) {
      return false
    }
    
    // For ambiguous cases, check industry
    if (industry.includes('advertising') || industry.includes('marketing') || 
        industry.includes('communications') || industry.includes('consulting')) {
      return true
    }
    
    return false
  }

  /**
   * Get fallback list of known competitive agencies
   */
  private getFallbackAgencies(): AgencyExtractionResult {
    const knownAgencies: CompetitiveAgency[] = [
      // Major Global Agencies
      { id: 1, name: 'WPP', industry: 'Advertising', size: 'Large', location: 'Global', relationshipStatus: 'competitor' },
      { id: 2, name: 'Omnicom Group', industry: 'Advertising', size: 'Large', location: 'Global', relationshipStatus: 'competitor' },
      { id: 3, name: 'Publicis Groupe', industry: 'Advertising', size: 'Large', location: 'Global', relationshipStatus: 'competitor' },
      { id: 4, name: 'Interpublic Group (IPG)', industry: 'Advertising', size: 'Large', location: 'Global', relationshipStatus: 'competitor' },
      { id: 5, name: 'Dentsu', industry: 'Advertising', size: 'Large', location: 'Global', relationshipStatus: 'competitor' },
      
      // Healthcare-Specific Agencies
      { id: 6, name: 'Area23', industry: 'Healthcare Marketing', size: 'Medium', location: 'US', relationshipStatus: 'competitor' },
      { id: 7, name: 'Evoke', industry: 'Healthcare Marketing', size: 'Medium', location: 'US', relationshipStatus: 'competitor' },
      { id: 8, name: 'Havas Health & You', industry: 'Healthcare Marketing', size: 'Large', location: 'Global', relationshipStatus: 'competitor' },
      { id: 9, name: 'FCB Health', industry: 'Healthcare Marketing', size: 'Large', location: 'Global', relationshipStatus: 'competitor' },
      { id: 10, name: 'Ogilvy Health', industry: 'Healthcare Marketing', size: 'Large', location: 'Global', relationshipStatus: 'competitor' },
      { id: 11, name: 'Saatchi & Saatchi Wellness', industry: 'Healthcare Marketing', size: 'Medium', location: 'US', relationshipStatus: 'competitor' },
      { id: 12, name: 'CDM New York', industry: 'Healthcare Marketing', size: 'Medium', location: 'US', relationshipStatus: 'competitor' },
      { id: 13, name: 'Grey Health', industry: 'Healthcare Marketing', size: 'Medium', location: 'US', relationshipStatus: 'competitor' },
      { id: 14, name: 'Sudler & Hennessey', industry: 'Healthcare Marketing', size: 'Medium', location: 'US', relationshipStatus: 'competitor' },
      { id: 15, name: 'AbelsonTaylor', industry: 'Healthcare Marketing', size: 'Medium', location: 'US', relationshipStatus: 'competitor' },
      { id: 16, name: 'Intouch Solutions', industry: 'Digital Healthcare', size: 'Medium', location: 'US', relationshipStatus: 'competitor' },
      { id: 17, name: 'Heartbeat', industry: 'Healthcare Marketing', size: 'Medium', location: 'US', relationshipStatus: 'competitor' },
      { id: 18, name: 'DDB Health', industry: 'Healthcare Marketing', size: 'Medium', location: 'US', relationshipStatus: 'competitor' },
      { id: 19, name: 'McCann Health', industry: 'Healthcare Marketing', size: 'Large', location: 'Global', relationshipStatus: 'competitor' },
      { id: 20, name: 'VMLY&R Health', industry: 'Healthcare Marketing', size: 'Large', location: 'Global', relationshipStatus: 'competitor' },
      
      // Digital/Specialized Agencies
      { id: 21, name: 'Accenture Interactive', industry: 'Digital Consulting', size: 'Large', location: 'Global', relationshipStatus: 'competitor' },
      { id: 22, name: 'Deloitte Digital', industry: 'Digital Consulting', size: 'Large', location: 'Global', relationshipStatus: 'competitor' },
      { id: 23, name: 'PwC Digital', industry: 'Digital Consulting', size: 'Large', location: 'Global', relationshipStatus: 'competitor' },
      { id: 24, name: 'McKinsey & Company', industry: 'Strategy Consulting', size: 'Large', location: 'Global', relationshipStatus: 'competitor' },
      { id: 25, name: 'BCG', industry: 'Strategy Consulting', size: 'Large', location: 'Global', relationshipStatus: 'competitor' },
      { id: 26, name: 'Bain & Company', industry: 'Strategy Consulting', size: 'Large', location: 'Global', relationshipStatus: 'competitor' },
      
      // Creative Agencies
      { id: 27, name: 'TBWA\\WorldHealth', industry: 'Healthcare Marketing', size: 'Medium', location: 'US', relationshipStatus: 'competitor' },
      { id: 28, name: 'Leo Burnett', industry: 'Advertising', size: 'Large', location: 'Global', relationshipStatus: 'competitor' },
      { id: 29, name: 'BBDO', industry: 'Advertising', size: 'Large', location: 'Global', relationshipStatus: 'competitor' },
      { id: 30, name: 'Droga5', industry: 'Creative Agency', size: 'Medium', location: 'US', relationshipStatus: 'competitor' },
      
      // Media Agencies
      { id: 31, name: 'GroupM', industry: 'Media', size: 'Large', location: 'Global', relationshipStatus: 'competitor' },
      { id: 32, name: 'OMD', industry: 'Media', size: 'Large', location: 'Global', relationshipStatus: 'competitor' },
      { id: 33, name: 'PHD', industry: 'Media', size: 'Large', location: 'Global', relationshipStatus: 'competitor' },
      { id: 34, name: 'Mindshare', industry: 'Media', size: 'Large', location: 'Global', relationshipStatus: 'competitor' },
      
      // Boutique/Specialized
      { id: 35, name: 'The Bloc', industry: 'Healthcare Marketing', size: 'Small', location: 'US', relationshipStatus: 'competitor' },
      { id: 36, name: 'Caliber Group', industry: 'Healthcare Marketing', size: 'Small', location: 'US', relationshipStatus: 'competitor' },
      { id: 37, name: 'DDB Remedy', industry: 'Healthcare Marketing', size: 'Medium', location: 'US', relationshipStatus: 'competitor' },
      { id: 38, name: 'Fishawack Health', industry: 'Healthcare Marketing', size: 'Medium', location: 'Global', relationshipStatus: 'competitor' },
      { id: 39, name: 'Syneos Health', industry: 'Healthcare Marketing', size: 'Large', location: 'Global', relationshipStatus: 'competitor' },
      { id: 40, name: 'Real Chemistry', industry: 'Healthcare Marketing', size: 'Medium', location: 'US', relationshipStatus: 'competitor' }
    ]

    return {
      agencies: knownAgencies,
      totalFound: knownAgencies.length,
      lastUpdated: new Date().toISOString(),
      extractionMethod: 'manual_analysis'
    }
  }

  /**
   * Get cached agencies
   */
  getCachedAgencies(): CompetitiveAgency[] {
    return Array.from(this.extractedAgencies.values()).sort((a, b) => a.name.localeCompare(b.name))
  }

  /**
   * Check if extraction is stale (older than 24 hours)
   */
  isExtractionStale(): boolean {
    if (!this.lastExtraction) return true
    const hoursSinceExtraction = (Date.now() - this.lastExtraction.getTime()) / (1000 * 60 * 60)
    return hoursSinceExtraction > 24
  }

  /**
   * Clear cached data
   */
  clearCache(): void {
    this.extractedAgencies.clear()
    this.lastExtraction = null
  }
}

export const competitiveAgencyExtractor = new CompetitiveAgencyExtractor()
