// BigQuery integration for Genome revenue data
import type { RevenueRow } from '@/types/domain'

export interface BigQueryRevenueData {
  brand_name: string
  company_name: string
  therapeutic_area: string
  indication: string
  year: number
  quarter?: number
  worldwide_revenue: number
  us_revenue: number
  revenue_currency: string
  data_source: string
  last_updated: string
}

export interface BigQueryConfig {
  projectId: string
  datasetId: string
  tableId: string
  credentials?: any // Google Cloud credentials
}

export interface RevenueQueryOptions {
  brands?: string[]
  companies?: string[]
  therapeuticAreas?: string[]
  years?: number[]
  quarters?: number[]
  limit?: number
}

class BigQueryRevenueService {
  private config: BigQueryConfig
  private cache = new Map<string, BigQueryRevenueData[]>()
  private cacheExpiry = new Map<string, number>()
  private readonly CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

  constructor(config: BigQueryConfig) {
    this.config = config
  }

  /**
   * Generate BigQuery SQL for revenue data
   */
  private generateRevenueQuery(options: RevenueQueryOptions = {}): string {
    const {
      brands = [],
      companies = [],
      therapeuticAreas = [],
      years = [],
      quarters = [],
      limit = 10000
    } = options

    let whereConditions: string[] = []

    // Add brand filters
    if (brands.length > 0) {
      const brandList = brands.map(brand => `'${brand.replace(/'/g, "''")}'`).join(', ')
      whereConditions.push(`brand_name IN (${brandList})`)
    }

    // Add company filters
    if (companies.length > 0) {
      const companyList = companies.map(company => `'${company.replace(/'/g, "''")}'`).join(', ')
      whereConditions.push(`company_name IN (${companyList})`)
    }

    // Add therapeutic area filters
    if (therapeuticAreas.length > 0) {
      const taList = therapeuticAreas.map(ta => `'${ta.replace(/'/g, "''")}'`).join(', ')
      whereConditions.push(`therapeutic_area IN (${taList})`)
    }

    // Add year filters
    if (years.length > 0) {
      const yearList = years.join(', ')
      whereConditions.push(`year IN (${yearList})`)
    }

    // Add quarter filters
    if (quarters.length > 0) {
      const quarterList = quarters.join(', ')
      whereConditions.push(`quarter IN (${quarterList})`)
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : ''

    return `
      SELECT 
        brand_name,
        company_name,
        therapeutic_area,
        indication,
        year,
        quarter,
        worldwide_revenue,
        us_revenue,
        revenue_currency,
        data_source,
        last_updated
      FROM \`${this.config.projectId}.${this.config.datasetId}.${this.config.tableId}\`
      ${whereClause}
      ORDER BY year DESC, quarter DESC, worldwide_revenue DESC
      LIMIT ${limit}
    `
  }

  /**
   * Execute BigQuery and return revenue data
   */
  async fetchRevenueData(options: RevenueQueryOptions = {}): Promise<BigQueryRevenueData[]> {
    const cacheKey = JSON.stringify(options)
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const expiry = this.cacheExpiry.get(cacheKey) || 0
      if (Date.now() < expiry) {
        console.log('Returning cached BigQuery revenue data')
        return this.cache.get(cacheKey)!
      }
    }

    try {
      // This would be replaced with actual BigQuery client
      const query = this.generateRevenueQuery(options)
      console.log('BigQuery SQL:', query)
      
      // Mock implementation - replace with actual BigQuery client
      const mockData: BigQueryRevenueData[] = await this.mockBigQueryCall(options)
      
      // Cache the results
      this.cache.set(cacheKey, mockData)
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION)
      
      return mockData
    } catch (error) {
      console.error('BigQuery revenue fetch failed:', error)
      throw error
    }
  }

  /**
   * Mock BigQuery call - replace with actual implementation
   */
  private async mockBigQueryCall(_options: RevenueQueryOptions): Promise<BigQueryRevenueData[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Generate mock data based on options
    const mockData: BigQueryRevenueData[] = []
    const currentYear = new Date().getFullYear()
    
    for (let year = currentYear - 2; year <= currentYear; year++) {
      for (let quarter = 1; quarter <= 4; quarter++) {
        mockData.push({
          brand_name: 'Mock Brand A',
          company_name: 'Mock Company',
          therapeutic_area: 'Oncology',
          indication: 'Breast Cancer',
          year,
          quarter,
          worldwide_revenue: Math.random() * 1000000000 + 500000000,
          us_revenue: Math.random() * 500000000 + 200000000,
          revenue_currency: 'USD',
          data_source: 'BigQuery',
          last_updated: new Date().toISOString()
        })
      }
    }
    
    return mockData
  }

  /**
   * Get revenue data for specific brands
   */
  async getBrandRevenue(brandNames: string[]): Promise<BigQueryRevenueData[]> {
    return this.fetchRevenueData({ brands: brandNames })
  }

  /**
   * Get revenue data for specific companies
   */
  async getCompanyRevenue(companyNames: string[]): Promise<BigQueryRevenueData[]> {
    return this.fetchRevenueData({ companies: companyNames })
  }

  /**
   * Get revenue data for specific therapeutic areas
   */
  async getTherapeuticAreaRevenue(therapeuticAreas: string[]): Promise<BigQueryRevenueData[]> {
    return this.fetchRevenueData({ therapeuticAreas })
  }

  /**
   * Get latest revenue data (most recent year/quarter)
   */
  async getLatestRevenue(options: RevenueQueryOptions = {}): Promise<BigQueryRevenueData[]> {
    const allData = await this.fetchRevenueData(options)
    
    // Group by brand and get latest entry for each
    const latestByBrand = new Map<string, BigQueryRevenueData>()
    
    allData.forEach(entry => {
      const key = `${entry.brand_name}-${entry.company_name}`
      const existing = latestByBrand.get(key)
      
      if (!existing || 
          entry.year > existing.year || 
          (entry.year === existing.year && (entry.quarter || 0) > (existing.quarter || 0))) {
        latestByBrand.set(key, entry)
      }
    })
    
    return Array.from(latestByBrand.values())
  }

  /**
   * Convert BigQuery data to RevenueRow format
   */
  convertToRevenueRows(bigQueryData: BigQueryRevenueData[]): RevenueRow[] {
    return bigQueryData.map((entry, index) => ({
      id: `bq-${index}`,
      brandId: `brand-${entry.brand_name.toLowerCase().replace(/\s+/g, '-')}`,
      product: entry.brand_name,
      company: entry.company_name,
      therapeuticArea: entry.therapeutic_area,
      indication: entry.indication,
      year: entry.year,
      quarter: entry.quarter?.toString(),
      ww: entry.worldwide_revenue,
      us: entry.us_revenue,
      currency: entry.revenue_currency,
      dataSource: entry.data_source,
      lastUpdated: entry.last_updated,
      createdAt: new Date(),
      updatedAt: new Date()
    }))
  }

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
}

// Default configuration - update with your actual BigQuery details
const defaultConfig: BigQueryConfig = {
  projectId: 'your-genome-project',
  datasetId: 'revenue_data',
  tableId: 'brand_revenue'
}

export const bigQueryRevenueService = new BigQueryRevenueService(defaultConfig)
