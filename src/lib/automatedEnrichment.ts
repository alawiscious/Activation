// Automated enrichment system for running large-scale Genome API enrichment
// This system runs enrichment in the background and stores results remotely

import { Contact } from '../types/domain'
import { remoteGenomeStorage, type GenomeEnrichmentData } from './remoteGenomeStorage'

export interface EnrichmentJob {
  id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  totalContacts: number
  processedContacts: number
  startTime: string
  endTime?: string
  error?: string
  progress: number
}

export interface EnrichmentConfig {
  batchSize: number
  delayBetweenBatches: number
  maxRetries: number
  retryDelay: number
  autoSave: boolean
  autoSaveInterval: number
}

class AutomatedEnrichmentManager {
  private currentJob: EnrichmentJob | null = null
  private isRunning = false
  private config: EnrichmentConfig = {
    batchSize: 50,
    delayBetweenBatches: 2000, // 2 seconds
    maxRetries: 3,
    retryDelay: 5000, // 5 seconds
    autoSave: true,
    autoSaveInterval: 100 // Save every 100 contacts
  }

  // Start automated enrichment for all contacts
  async startMegaEnrichment(contacts: Contact[], onProgress?: (job: EnrichmentJob) => void): Promise<EnrichmentJob> {
    if (this.isRunning) {
      throw new Error('Enrichment is already running')
    }

    const jobId = `enrichment-${Date.now()}`
    this.currentJob = {
      id: jobId,
      status: 'pending',
      totalContacts: contacts.length,
      processedContacts: 0,
      startTime: new Date().toISOString(),
      progress: 0
    }

    this.isRunning = true
    this.currentJob.status = 'running'

    try {
      console.log(`🚀 Starting mega enrichment for ${contacts.length} contacts`)
      
      // Process contacts in batches
      const batches = this.createBatches(contacts, this.config.batchSize)
      let processedCount = 0

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i]
        console.log(`📦 Processing batch ${i + 1}/${batches.length} (${batch.length} contacts)`)

        try {
          const batchResults = await this.processBatch(batch)
          await this.saveBatchResults(batchResults)
          
          processedCount += batch.length
          this.currentJob.processedContacts = processedCount
          this.currentJob.progress = (processedCount / contacts.length) * 100

          if (onProgress) {
            onProgress({ ...this.currentJob })
          }

          // Auto-save checkpoint
          if (this.config.autoSave && processedCount % this.config.autoSaveInterval === 0) {
            console.log(`💾 Auto-saving checkpoint at ${processedCount} contacts`)
            await this.saveCheckpoint()
          }

          // Delay between batches to avoid rate limiting
          if (i < batches.length - 1) {
            await this.delay(this.config.delayBetweenBatches)
          }

        } catch (batchError) {
          console.error(`❌ Batch ${i + 1} failed:`, batchError)
          
          // Retry batch if configured
          if (this.config.maxRetries > 0) {
            console.log(`🔄 Retrying batch ${i + 1}...`)
            await this.delay(this.config.retryDelay)
            i-- // Retry this batch
            continue
          } else {
            throw batchError
          }
        }
      }

      this.currentJob.status = 'completed'
      this.currentJob.endTime = new Date().toISOString()
      this.currentJob.progress = 100

      console.log(`✅ Mega enrichment completed! Processed ${processedCount} contacts`)
      
      // Final save
      await this.saveCheckpoint()
      
      return this.currentJob

    } catch (error) {
      this.currentJob.status = 'failed'
      this.currentJob.error = error instanceof Error ? error.message : 'Unknown error'
      this.currentJob.endTime = new Date().toISOString()
      
      console.error('❌ Mega enrichment failed:', error)
      throw error
      
    } finally {
      this.isRunning = false
    }
  }

  // Process a batch of contacts
  private async processBatch(contacts: Contact[]): Promise<Record<string, GenomeEnrichmentData>> {
    const results: Record<string, GenomeEnrichmentData> = {}
    
    // Process contacts in parallel (with concurrency limit)
    const concurrencyLimit = 10
    const chunks = this.createBatches(contacts, concurrencyLimit)
    
    for (const chunk of chunks) {
      const chunkPromises = chunk.map(contact => this.enrichContact(contact))
      const chunkResults = await Promise.allSettled(chunkPromises)
      
      chunkResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          results[chunk[index].id] = result.value
        } else {
          console.warn(`Failed to enrich contact ${chunk[index].id}:`, result.status === 'rejected' ? result.reason : 'Unknown error')
        }
      })
    }
    
    return results
  }

  // Enrich a single contact (simulated Genome API call)
  private async enrichContact(contact: Contact): Promise<GenomeEnrichmentData | null> {
    try {
      // Simulate API call delay
      await this.delay(Math.random() * 1000 + 500) // 500-1500ms
      
      // Simulate enrichment data (replace with actual Genome API calls)
      const enrichmentData: GenomeEnrichmentData = {
        contactId: contact.id,
        emailCount: Math.floor(Math.random() * 50),
        meetingCount: Math.floor(Math.random() * 20),
        totalActivity: Math.floor(Math.random() * 70),
        latestMeetingDate: this.getRandomDate(),
        lastEmailDate: this.getRandomDate(),
        lastKlickster: Math.random() > 0.3 ? 'Yes' : 'No',
        linkedinLastPulled: new Date().toISOString().split('T')[0],
        genomeCrmcontactId: `gcrm-${contact.id}`,
        linkedinId: `li-${contact.id}`,
        leadId: `l-${contact.id}`,
        lastUpdated: new Date().toISOString(),
        source: 'genome_api'
      }
      
      return enrichmentData
      
    } catch (error) {
      console.error(`Error enriching contact ${contact.id}:`, error)
      return null
    }
  }

  // Save batch results to remote storage
  private async saveBatchResults(results: Record<string, GenomeEnrichmentData>): Promise<void> {
    try {
      await remoteGenomeStorage.batchStoreEnrichment(results)
      console.log(`💾 Saved ${Object.keys(results).length} enrichment records`)
    } catch (error) {
      console.error('Error saving batch results:', error)
      throw error
    }
  }

  // Save checkpoint to remote storage
  private async saveCheckpoint(): Promise<void> {
    if (!this.currentJob) return
    
    try {
      // Save job status to remote storage
      const checkpointData = {
        jobId: this.currentJob.id,
        status: this.currentJob.status,
        progress: this.currentJob.progress,
        processedContacts: this.currentJob.processedContacts,
        totalContacts: this.currentJob.totalContacts,
        lastUpdated: new Date().toISOString()
      }
      
      // Store checkpoint in remote storage
      await remoteGenomeStorage.storeContactEnrichment('__checkpoint__', checkpointData as any)
      console.log('✅ Checkpoint saved')
      
    } catch (error) {
      console.error('Error saving checkpoint:', error)
    }
  }

  // Create batches from array
  private createBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = []
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize))
    }
    return batches
  }

  // Delay utility
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Get random date within last 6 months
  private getRandomDate(): string {
    const now = new Date()
    const sixMonthsAgo = new Date(now.getTime() - (6 * 30 * 24 * 60 * 60 * 1000))
    const randomTime = sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime())
    return new Date(randomTime).toISOString().split('T')[0]
  }

  // Get current job status
  getCurrentJob(): EnrichmentJob | null {
    return this.currentJob
  }

  // Check if enrichment is running
  isEnrichmentRunning(): boolean {
    return this.isRunning
  }

  // Update configuration
  updateConfig(newConfig: Partial<EnrichmentConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  // Stop current enrichment
  async stopEnrichment(): Promise<void> {
    if (this.isRunning && this.currentJob) {
      this.currentJob.status = 'failed'
      this.currentJob.error = 'Stopped by user'
      this.currentJob.endTime = new Date().toISOString()
      
      await this.saveCheckpoint()
      this.isRunning = false
      
      console.log('🛑 Enrichment stopped by user')
    }
  }
}

// Export singleton instance
export const automatedEnrichment = new AutomatedEnrichmentManager()

// Helper function to start mega enrichment
export async function startMegaEnrichment(contacts: Contact[], onProgress?: (job: EnrichmentJob) => void): Promise<EnrichmentJob> {
  return automatedEnrichment.startMegaEnrichment(contacts, onProgress)
}

// Helper function to check if enrichment is running
export function isEnrichmentRunning(): boolean {
  return automatedEnrichment.isEnrichmentRunning()
}

// Helper function to get current job
export function getCurrentEnrichmentJob(): EnrichmentJob | null {
  return automatedEnrichment.getCurrentJob()
}
