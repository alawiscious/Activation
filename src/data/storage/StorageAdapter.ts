// Storage adapter interface for pluggable persistence layer
import type { StorageAdapter, CompanyState } from '@/types/domain'
import { IndexedDbAdapter } from './IndexedDbAdapter'

export { type StorageAdapter } from '@/types/domain'

// In-memory fallback for SSR/Node environments
export class InMemoryAdapter implements StorageAdapter {
  private storage = new Map<string, CompanyState>()

  async load(companySlug: string): Promise<CompanyState | null> {
    return this.storage.get(companySlug) || null
  }

  async save(companySlug: string, state: CompanyState): Promise<void> {
    this.storage.set(companySlug, state)
  }

  async delete(companySlug: string): Promise<void> {
    this.storage.delete(companySlug)
  }

  async listCompanies(): Promise<{ slug: string; name: string; updatedAt: Date }[]> {
    return Array.from(this.storage.entries()).map(([slug, state]) => ({
      slug,
      name: state.name,
      updatedAt: state.updatedAt,
    }))
  }
}

// Factory function to get the appropriate storage adapter
export function createStorageAdapter(): StorageAdapter {
  // Check if we're in a browser environment with IndexedDB support
  if (typeof window !== 'undefined' && 'indexedDB' in window) {
    // Use IndexedDB in the browser
    return new IndexedDbAdapter()
  }
  
  // Fallback to in-memory for SSR/Node environments
  return new InMemoryAdapter()
}
