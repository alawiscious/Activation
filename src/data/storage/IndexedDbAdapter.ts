// IndexedDB implementation of StorageAdapter
import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { StorageAdapter, CompanyState } from '@/types/domain'

interface PharmaVisualPivotDB extends DBSchema {
  companies: {
    key: string // company slug
    value: CompanyState
    indexes: { 'by-updated': Date }
  }
}

export class IndexedDbAdapter implements StorageAdapter {
  private db: IDBPDatabase<PharmaVisualPivotDB> | null = null
  private dbPromise: Promise<IDBPDatabase<PharmaVisualPivotDB>> | null = null

  private async getDB(): Promise<IDBPDatabase<PharmaVisualPivotDB>> {
    if (this.db) return this.db
    
    if (!this.dbPromise) {
      this.dbPromise = openDB<PharmaVisualPivotDB>('pharma-visual-pivot', 1, {
        upgrade(db) {
          // Create companies store
          if (!db.objectStoreNames.contains('companies')) {
            const store = db.createObjectStore('companies', { keyPath: 'slug' })
            store.createIndex('by-updated', 'updatedAt')
          }
        },
      })
    }
    
    this.db = await this.dbPromise
    return this.db
  }

  async load(companySlug: string): Promise<CompanyState | null> {
    try {
      const db = await this.getDB()
      const state = await db.get('companies', companySlug)
      
      if (!state) return null
      
      // Convert date strings back to Date objects
      return {
        ...state,
        createdAt: new Date(state.createdAt),
        updatedAt: new Date(state.updatedAt),
        brands: state.brands.map(brand => ({
          ...brand,
          createdAt: new Date(brand.createdAt),
          updatedAt: new Date(brand.updatedAt),
        })),
        contacts: state.contacts.map(contact => ({
          ...contact,
          createdAt: new Date(contact.createdAt),
          updatedAt: new Date(contact.updatedAt),
        })),
        revenueRows: state.revenueRows.map(revenue => ({
          ...revenue,
          createdAt: new Date(revenue.createdAt),
          updatedAt: new Date(revenue.updatedAt),
        })),
        orgCharts: (state as any).orgCharts
          ? (state as any).orgCharts.map((chart: any) => ({
              ...chart,
              createdAt: new Date(chart.createdAt),
              updatedAt: new Date(chart.updatedAt),
            }))
          : [],
        currentOrgChartId: (state as any).currentOrgChartId ?? null,
      }
    } catch (error) {
      console.error('Failed to load company state from IndexedDB:', error)
      return null
    }
  }

  async save(companySlug: string, state: CompanyState): Promise<void> {
    try {
      const db = await this.getDB()
      await db.put('companies', {
        ...state,
        slug: companySlug, // Ensure slug is set
        updatedAt: new Date(), // Update timestamp
      })
    } catch (error) {
      console.error('Failed to save company state to IndexedDB:', error)
      throw error
    }
  }

  async delete(companySlug: string): Promise<void> {
    try {
      const db = await this.getDB()
      await db.delete('companies', companySlug)
    } catch (error) {
      console.error('Failed to delete company state from IndexedDB:', error)
      throw error
    }
  }

  async listCompanies(): Promise<{ slug: string; name: string; updatedAt: Date }[]> {
    try {
      const db = await this.getDB()
      const companies = await db.getAllFromIndex('companies', 'by-updated')
      
      return companies
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .map(company => ({
          slug: company.slug,
          name: company.name,
          updatedAt: company.updatedAt,
        }))
    } catch (error) {
      console.error('Failed to list companies from IndexedDB:', error)
      return []
    }
  }

  // Migration helper to import from localStorage
  async migrateFromLocalStorage(): Promise<void> {
    try {
      const localStorageData = localStorage.getItem('pharma-visual-pivot-state')
      if (!localStorageData) return

      const oldState = JSON.parse(localStorageData)
      
      // Convert old state format to new CompanyState format
      const companyState: CompanyState = {
        id: 'migrated-company',
        name: 'Migrated Company',
        slug: 'migrated-company',
        brands: oldState.brands || [],
        contacts: oldState.contacts || [],
        revenueRows: oldState.revenueRows || [],
        filters: oldState.filters || {
          brands: [],
          therapeuticAreas: [],
          functionalAreas: [],
          levels: [],
          titleSearch: '',
          knownOnly: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await this.save('migrated-company', companyState)
      
      // Clear localStorage after successful migration
      localStorage.removeItem('pharma-visual-pivot-state')
      
      console.log('Successfully migrated data from localStorage to IndexedDB')
    } catch (error) {
      console.error('Failed to migrate from localStorage:', error)
    }
  }
}








