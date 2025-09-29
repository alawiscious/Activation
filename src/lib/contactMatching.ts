// Contact matching utilities for Genome API integration
import type { Contact } from '@/types/domain'

export interface GenomeContact {
  id: string
  name: string
  email?: string
  title?: string
  company?: string
  genome_crmcontact_id?: string
  contact_id?: string
}

export interface MatchResult {
  contact: Contact
  genomeContact: GenomeContact
  confidence: number
  matchType: 'email' | 'name_company' | 'name_title' | 'fuzzy'
}

export interface MatchingOptions {
  emailWeight: number
  nameWeight: number
  companyWeight: number
  titleWeight: number
  minConfidence: number
}

const DEFAULT_OPTIONS: MatchingOptions = {
  emailWeight: 0.4,
  nameWeight: 0.3,
  companyWeight: 0.2,
  titleWeight: 0.1,
  minConfidence: 0.6
}

export class ContactMatcher {
  private options: MatchingOptions

  constructor(options: Partial<MatchingOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  /**
   * Normalize text for comparison
   */
  private normalize(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
  }

  /**
   * Calculate similarity between two strings using Levenshtein distance
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = this.normalize(str1)
    const s2 = this.normalize(str2)
    
    if (s1 === s2) return 1.0
    
    const maxLength = Math.max(s1.length, s2.length)
    if (maxLength === 0) return 1.0
    
    const distance = this.levenshteinDistance(s1, s2)
    return 1 - (distance / maxLength)
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        )
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  /**
   * Match a single contact with Genome contacts
   */
  matchContact(contact: Contact, genomeContacts: GenomeContact[]): MatchResult[] {
    const matches: MatchResult[] = []

    for (const genomeContact of genomeContacts) {
      let confidence = 0
      let matchType: MatchResult['matchType'] = 'fuzzy'

      // Email match (highest confidence)
      if (contact.email && genomeContact.email) {
        const emailSimilarity = this.calculateSimilarity(contact.email, genomeContact.email)
        if (emailSimilarity > 0.8) {
          confidence += this.options.emailWeight * emailSimilarity
          matchType = 'email'
        }
      }

      // Name match
      if (contact.firstName && contact.lastName && genomeContact.name) {
        const fullName = `${contact.firstName} ${contact.lastName}`
        const nameSimilarity = this.calculateSimilarity(fullName, genomeContact.name)
        confidence += this.options.nameWeight * nameSimilarity
      }

      // Company match
      if (contact.currCompany && genomeContact.company) {
        const companySimilarity = this.calculateSimilarity(contact.currCompany, genomeContact.company)
        confidence += this.options.companyWeight * companySimilarity
      }

      // Title match
      if (contact.title && genomeContact.title) {
        const titleSimilarity = this.calculateSimilarity(contact.title, genomeContact.title)
        confidence += this.options.titleWeight * titleSimilarity
      }

      // Only include matches above minimum confidence
      if (confidence >= this.options.minConfidence) {
        matches.push({
          contact,
          genomeContact,
          confidence,
          matchType
        })
      }
    }

    // Sort by confidence (highest first)
    return matches.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Match multiple contacts with Genome contacts
   */
  matchContacts(contacts: Contact[], genomeContacts: GenomeContact[]): Map<string, MatchResult[]> {
    const results = new Map<string, MatchResult[]>()

    for (const contact of contacts) {
      const matches = this.matchContact(contact, genomeContacts)
      if (matches.length > 0) {
        results.set(contact.id, matches)
      }
    }

    return results
  }

  /**
   * Get the best match for each contact
   */
  getBestMatches(contacts: Contact[], genomeContacts: GenomeContact[]): Map<string, MatchResult> {
    const allMatches = this.matchContacts(contacts, genomeContacts)
    const bestMatches = new Map<string, MatchResult>()

    for (const [contactId, matches] of allMatches) {
      if (matches.length > 0) {
        bestMatches.set(contactId, matches[0]) // First match is highest confidence
      }
    }

    return bestMatches
  }

  /**
   * Generate a report of matching results
   */
  generateMatchReport(contacts: Contact[], genomeContacts: GenomeContact[]): {
    totalContacts: number
    matchedContacts: number
    matchRate: number
    matchesByType: Record<string, number>
    unmatchedContacts: Contact[]
    lowConfidenceMatches: MatchResult[]
  } {
    const bestMatches = this.getBestMatches(contacts, genomeContacts)
    
    const matchesByType: Record<string, number> = {}
    const lowConfidenceMatches: MatchResult[] = []
    const unmatchedContacts: Contact[] = []

    for (const contact of contacts) {
      const bestMatch = bestMatches.get(contact.id)
      if (bestMatch) {
        matchesByType[bestMatch.matchType] = (matchesByType[bestMatch.matchType] || 0) + 1
        
        if (bestMatch.confidence < 0.8) {
          lowConfidenceMatches.push(bestMatch)
        }
      } else {
        unmatchedContacts.push(contact)
      }
    }

    return {
      totalContacts: contacts.length,
      matchedContacts: bestMatches.size,
      matchRate: bestMatches.size / contacts.length,
      matchesByType,
      unmatchedContacts,
      lowConfidenceMatches
    }
  }
}

export const contactMatcher = new ContactMatcher()
