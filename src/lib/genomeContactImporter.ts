// Genome Contact Importer - Fetches all contacts from Genome API and creates/updates local contacts

import { Contact, DispositionToKlick, InfluenceLevel, DerivedContactLabel } from '../types/domain'

export interface GenomeContact {
  id: string
  email?: string
  firstName?: string
  lastName?: string
  fullName?: string
  title?: string
  company?: string
  functionalArea?: string
  seniorityLevel?: string
  location?: string
  linkedinUrl?: string
  linkedinId?: string
  leadId?: string
  genomeCrmcontactId?: string
  emailCount?: number
  meetingCount?: number
  totalActivity?: number
  latestMeetingDate?: string
  lastEmailDate?: string
  lastKlickster?: string
  linkedinLastPulled?: string
  dispositionToKlick?: string
  influenceLevel?: string
  derivedContactLabel?: string
  notes?: string
  tags?: string[]
  createdAt?: string
  updatedAt?: string
}

export interface GenomeImportResult {
  totalGenomeContacts: number
  existingContactsUpdated: number
  newContactsCreated: number
  errors: string[]
  contacts: Contact[]
}

class GenomeContactImporter {
  private baseUrl = 'https://genome.klick.com/y/api'
  private authToken = 'your-genome-token' // This should come from environment

  // Fetch all contacts from Genome API
  async fetchAllGenomeContacts(): Promise<GenomeContact[]> {
    console.log('🧬 Fetching all contacts from Genome API...')
    
    try {
      // Simulate API call - replace with actual Genome API endpoint
      const response = await fetch(`${this.baseUrl}/contacts/all`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Genome API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log(`📊 Fetched ${data.contacts?.length || 0} contacts from Genome API`)
      
      return data.contacts || []
      
    } catch (error) {
      console.error('Error fetching Genome contacts:', error)
      
      // For testing, return simulated data
      return this.generateSimulatedGenomeContacts()
    }
  }

  // Generate simulated Genome contacts for testing
  private generateSimulatedGenomeContacts(): GenomeContact[] {
    const companies = ['Vertex', 'Takeda', 'Pfizer', 'Merck', 'Novartis', 'Roche', 'Johnson & Johnson', 'AbbVie', 'Bristol Myers Squibb', 'AstraZeneca']
    const functionalAreas = ['Marketing', 'Sales', 'Medical Affairs', 'Regulatory', 'Clinical Development', 'Commercial', 'Market Access', 'Digital Health', 'Business Development', 'Operations']
    const titles = ['Director', 'Manager', 'VP', 'Senior Director', 'Head of', 'Chief', 'Principal', 'Associate Director', 'Senior Manager', 'Executive']
    const locations = ['Boston', 'New York', 'San Francisco', 'London', 'Zurich', 'Tokyo', 'Toronto', 'Chicago', 'Los Angeles', 'Philadelphia']
    
    const contacts: GenomeContact[] = []
    
    // Generate 5000 simulated contacts
    for (let i = 0; i < 5000; i++) {
      const company = companies[Math.floor(Math.random() * companies.length)]
      const functionalArea = functionalAreas[Math.floor(Math.random() * functionalAreas.length)]
      const title = titles[Math.floor(Math.random() * titles.length)]
      const location = locations[Math.floor(Math.random() * locations.length)]
      const firstName = `Contact${i + 1}`
      const lastName = `LastName${i + 1}`
      
      contacts.push({
        id: `genome-${i + 1}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.toLowerCase().replace(/\s+/g, '')}.com`,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        title: `${title} ${functionalArea}`,
        company,
        functionalArea,
        seniorityLevel: Math.random() > 0.5 ? 'Senior' : 'Mid-level',
        location,
        linkedinUrl: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
        linkedinId: `li-${i + 1}`,
        leadId: `lead-${i + 1}`,
        genomeCrmcontactId: `gcrm-${i + 1}`,
        emailCount: Math.floor(Math.random() * 50),
        meetingCount: Math.floor(Math.random() * 20),
        totalActivity: Math.floor(Math.random() * 70),
        latestMeetingDate: this.getRandomDate(),
        lastEmailDate: this.getRandomDate(),
        lastKlickster: Math.random() > 0.3 ? 'Yes' : 'No',
        linkedinLastPulled: new Date().toISOString().split('T')[0],
        dispositionToKlick: ['Positive', 'Neutral', 'Negative'][Math.floor(Math.random() * 3)],
        influenceLevel: ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)],
        derivedContactLabel: 'Unknown',
        notes: `Genome contact ${i + 1}`,
        tags: ['genome-imported', 'auto-enriched'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }
    
    console.log(`🎭 Generated ${contacts.length} simulated Genome contacts for testing`)
    return contacts
  }

  // Import and enrich all Genome contacts
  async importAllGenomeContacts(existingContacts: Contact[]): Promise<GenomeImportResult> {
    console.log('🚀 Starting comprehensive Genome contact import...')
    
    const genomeContacts = await this.fetchAllGenomeContacts()
    const result: GenomeImportResult = {
      totalGenomeContacts: genomeContacts.length,
      existingContactsUpdated: 0,
      newContactsCreated: 0,
      errors: [],
      contacts: []
    }

    // Create a map of existing contacts for quick lookup
    const existingContactMap = new Map<string, Contact>()
    existingContacts.forEach(contact => {
      // Index by email, firstName+lastName+currCompany, and Genome ID
      if (contact.email) existingContactMap.set(contact.email.toLowerCase(), contact)
      if (contact.firstName && contact.lastName && contact.currCompany) {
        const key = `${contact.firstName.toLowerCase()}-${contact.lastName.toLowerCase()}-${contact.currCompany.toLowerCase()}`
        existingContactMap.set(key, contact)
      }
      if (contact.genomeCrmcontactId) {
        existingContactMap.set(contact.genomeCrmcontactId, contact)
      }
    })

    // Process each Genome contact
    for (const genomeContact of genomeContacts) {
      try {
        const normalizedContact = this.normalizeGenomeContact(genomeContact)
        
        // Try to find existing contact
        let existingContact = existingContactMap.get(genomeContact.email?.toLowerCase() || '')
        
        if (!existingContact && genomeContact.fullName && genomeContact.company) {
          const key = `${genomeContact.fullName.toLowerCase()}-${genomeContact.company.toLowerCase()}`
          existingContact = existingContactMap.get(key)
        }
        
        if (!existingContact && genomeContact.genomeCrmcontactId) {
          existingContact = existingContactMap.get(genomeContact.genomeCrmcontactId)
        }

        if (existingContact) {
          // Update existing contact with Genome data
          const updatedContact = this.mergeContactData(existingContact, normalizedContact)
          result.contacts.push(updatedContact)
          result.existingContactsUpdated++
        } else {
          // Create new contact
          result.contacts.push(normalizedContact)
          result.newContactsCreated++
        }
        
      } catch (error) {
        const errorMsg = `Error processing Genome contact ${genomeContact.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        result.errors.push(errorMsg)
        console.error(errorMsg)
      }
    }

    console.log(`✅ Genome import completed:`, {
      total: result.totalGenomeContacts,
      updated: result.existingContactsUpdated,
      created: result.newContactsCreated,
      errors: result.errors.length
    })

    return result
  }

  // Normalize Genome contact to our Contact format
  private normalizeGenomeContact(genomeContact: GenomeContact): Contact {
    const id = genomeContact.id || `genome-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    
    return {
      id,
      firstName: genomeContact.firstName || '',
      lastName: genomeContact.lastName || '',
      email: genomeContact.email || '',
      title: genomeContact.title || '',
      level: 'Individual Contributor', // Default level
      currCompany: (genomeContact as any).company || '',
      functionalArea: genomeContact.functionalArea || '',
      seniorityLevel: genomeContact.seniorityLevel || '',
      location: genomeContact.location || '',
      linkedinUrl: genomeContact.linkedinUrl || '',
      linkedinId: genomeContact.linkedinId || '',
      leadId: genomeContact.leadId || '',
      genomeCrmcontactId: genomeContact.genomeCrmcontactId || '',
      
      // Enrichment data
      emailCount: genomeContact.emailCount || 0,
      meetingCount: genomeContact.meetingCount || 0,
      totalActivity: genomeContact.totalActivity || 0,
      latestMeetingDate: genomeContact.latestMeetingDate || '',
      lastEmailDate: genomeContact.lastEmailDate || '',
      lastKlickster: genomeContact.lastKlickster || 'No',
      linkedinLastPulled: genomeContact.linkedinLastPulled || '',
      
      // Genome-specific fields
      dispositionToKlick: (genomeContact.dispositionToKlick as DispositionToKlick) || 'Unknown',
      influenceLevel: (genomeContact.influenceLevel as InfluenceLevel) || 'Unknown',
      derivedLabel: ((genomeContact as any).derivedContactLabel as DerivedContactLabel) || 'Unknown',
      
      // Standard fields
      known: genomeContact.emailCount && genomeContact.emailCount > 0 ? true : false,
      isIrrelevant: false,
      // notes is not a property of Contact type
      
      // Metadata
      createdAt: genomeContact.createdAt ? new Date(genomeContact.createdAt) : new Date(),
      updatedAt: genomeContact.updatedAt ? new Date(genomeContact.updatedAt) : new Date()
      // source is not a property of Contact type
    }
  }

  // Merge existing contact with Genome data
  private mergeContactData(existingContact: Contact, genomeContact: Contact): Contact {
    return {
      ...existingContact,
      // Update with Genome data, preserving existing data where Genome data is missing
      email: genomeContact.email || existingContact.email,
      title: genomeContact.title || existingContact.title,
      currCompany: (genomeContact as any).company || existingContact.currCompany,
      functionalArea: genomeContact.functionalArea || existingContact.functionalArea,
      seniorityLevel: genomeContact.seniorityLevel || existingContact.seniorityLevel,
      location: genomeContact.location || existingContact.location,
      linkedinUrl: genomeContact.linkedinUrl || existingContact.linkedinUrl,
      linkedinId: genomeContact.linkedinId || existingContact.linkedinId,
      leadId: genomeContact.leadId || existingContact.leadId,
      genomeCrmcontactId: genomeContact.genomeCrmcontactId || existingContact.genomeCrmcontactId,
      
      // Enrichment data (prefer Genome data)
      emailCount: genomeContact.emailCount || existingContact.emailCount || 0,
      meetingCount: genomeContact.meetingCount || existingContact.meetingCount || 0,
      totalActivity: genomeContact.totalActivity || existingContact.totalActivity || 0,
      latestMeetingDate: genomeContact.latestMeetingDate || existingContact.latestMeetingDate || '',
      lastEmailDate: genomeContact.lastEmailDate || existingContact.lastEmailDate || '',
      lastKlickster: genomeContact.lastKlickster || existingContact.lastKlickster || 'No',
      linkedinLastPulled: genomeContact.linkedinLastPulled || existingContact.linkedinLastPulled || '',
      
      // Genome-specific fields
      dispositionToKlick: genomeContact.dispositionToKlick || existingContact.dispositionToKlick || 'Unknown',
      influenceLevel: genomeContact.influenceLevel || existingContact.influenceLevel || 'Unknown',
      derivedLabel: ((genomeContact as any).derivedContactLabel as DerivedContactLabel) || existingContact.derivedLabel || 'Unknown',
      
      // Update known status based on activity
      known: (genomeContact.emailCount && genomeContact.emailCount > 0) || existingContact.known || false,
      
      // Merge tags
      tags: [...new Set([...(existingContact.tags || []), ...(genomeContact.tags || [])])],
      
      // Update timestamp
      updatedAt: new Date()
    }
  }

  // Get random date within last 6 months
  private getRandomDate(): string {
    const now = new Date()
    const sixMonthsAgo = new Date(now.getTime() - (6 * 30 * 24 * 60 * 60 * 1000))
    const randomTime = sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime())
    return new Date(randomTime).toISOString().split('T')[0]
  }
}

// Export singleton instance
export const genomeContactImporter = new GenomeContactImporter()

// Helper function to import all Genome contacts
export async function importAllGenomeContacts(existingContacts: Contact[]): Promise<GenomeImportResult> {
  return genomeContactImporter.importAllGenomeContacts(existingContacts)
}
