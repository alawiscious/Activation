import { describe, it, expect } from 'vitest'
import {
  transformBrandCsvRow,
  transformContactCsvRow,
  transformRevenueCsvRow,
  transformBrandsCsv,
  transformContactsCsv,
  transformRevenueCsv,
} from './transformers'
import type { BrandCsvRow, ContactCsvRow, RevenueCsvRow } from '@/types/domain'

describe('CSV Transformers', () => {
  describe('transformBrandCsvRow', () => {
    it('should transform a valid brand CSV row', () => {
      const row: BrandCsvRow = {
        brand: 'Test Brand',
        status: 'Active',
        phase: 'Approved',
        therapeutic_area: 'Oncology',
        revenue_2026: '1000000',
        revenue_2027: '1200000',
      }

      const result = transformBrandCsvRow(row, 0)

      expect(result.brand.name).toBe('Test Brand')
      expect(result.brand.status).toBe('Active')
      expect(result.brand.phase).toBe('Approved')
      expect(result.brand.therapeuticArea).toBe('Oncology')
      expect(result.revenueRows).toHaveLength(2)
      expect(result.revenueRows[0].year).toBe(2026)
      expect(result.revenueRows[0].wwSales).toBe(1000000)
      expect(result.errors).toHaveLength(0)
    })

    it('should handle missing brand name with error', () => {
      const row: BrandCsvRow = {
        brand: '',
        status: 'Active',
        phase: 'Approved',
        therapeutic_area: 'Oncology',
      }

      const result = transformBrandCsvRow(row, 0)

      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].message).toBe('Brand name is required')
    })

    it('should normalize status and phase values', () => {
      const row: BrandCsvRow = {
        brand: 'Test Brand',
        status: 'pipeline',
        phase: 'phase 2',
        therapeutic_area: 'Oncology',
      }

      const result = transformBrandCsvRow(row, 0)

      expect(result.brand.status).toBe('In Pipeline')
      expect(result.brand.phase).toBe('Phase II')
    })
  })

  describe('transformContactCsvRow', () => {
    it('should transform a valid contact CSV row', () => {
      const row: ContactCsvRow = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        title: 'Marketing Director',
        level: 'Director',
        functional_area: 'Marketing',
        brand: 'Test Brand',
        therapeutic_area: 'Oncology',
        known: 'true',
        company: 'Acme Pharma',
      }

      const result = transformContactCsvRow(row, 0)

      expect(result.contact.firstName).toBe('John')
      expect(result.contact.lastName).toBe('Doe')
      expect(result.contact.email).toBe('john.doe@example.com')
      expect(result.contact.title).toBe('Marketing Director')
      expect(result.contact.level).toBe('Director')
      expect(result.contact.functionalArea).toBe('Marketing')
      expect(result.contact.brand).toBe('Test Brand')
      expect(result.contact.therapeuticArea).toBe('Oncology')
      expect(result.contact.known).toBe(true)
      expect(result.contact.dispositionToKlick).toBe('Neutral')
      expect(result.contact.influenceLevel).toBe('Influencer')
      expect(result.contact.agencyAlignment).toBeUndefined()
      expect(result.contact.derivedLabel).toBe('Steady Influence')
      expect(result.errors).toHaveLength(0)
      expect(result.companyName).toBe('Acme Pharma')
      expect(result.companySlug).toBe('acme-pharma')
      expect(result.groupKey).toBe('acme-pharma')
    })

    it('should handle missing required fields with errors', () => {
      const row: ContactCsvRow = {
        first_name: '',
        last_name: '',
        email: '',
        title: 'Marketing Director',
        level: 'Director',
        functional_area: 'Marketing',
        known: 'false',
      }

      const result = transformContactCsvRow(row, 0)

      expect(result.errors).toHaveLength(3)
      expect(result.errors.some(e => e.message === 'First name is required')).toBe(true)
      expect(result.errors.some(e => e.message === 'Last name is required')).toBe(true)
      expect(result.errors.some(e => e.message === 'Email is required')).toBe(true)
    })

    it('should derive classification details for negative contacts', () => {
      const row: ContactCsvRow = {
        first_name: 'Alex',
        last_name: 'Ramos',
        email: 'alex.ramos@example.com',
        title: 'Procurement Lead',
        level: 'Manager',
        functional_area: 'Procurement',
        brand: 'Test Brand',
        therapeutic_area: 'Oncology',
        known: 'true',
        disposition_to_klick: 'Negative',
        influence_level: 'Decision Maker',
        agency_alignment: 'Havas',
        company_slug: 'sumitomo-pharma',
      }

      const result = transformContactCsvRow(row, 0)

      expect(result.contact.dispositionToKlick).toBe('Negative')
      expect(result.contact.influenceLevel).toBe('Decision Maker')
      expect(result.contact.agencyAlignment).toBe('Havas')
      expect(result.contact.derivedLabel).toBe('Detractor')
      expect(result.companySlug).toBe('sumitomo-pharma')
      expect(result.groupKey).toBe('sumitomo-pharma')
      expect(result.groupKey).toBe('sumitomo-pharma')
    })
  })

  describe('transformRevenueCsvRow', () => {
    it('should transform a valid revenue CSV row', () => {
      const row: RevenueCsvRow = {
        product: 'Test Product',
        brand: 'Test Brand',
        therapeutic_area: 'Oncology',
        year: '2026',
        ww_sales: '1000000',
        us_sales: '400000',
      }

      const result = transformRevenueCsvRow(row, 0)

      expect(result.revenueRow.year).toBe(2026)
      expect(result.revenueRow.wwSales).toBe(1000000)
      expect(result.revenueRow.usSales).toBe(400000)
      expect(result.errors).toHaveLength(0)
    })

    it('should handle invalid year with error', () => {
      const row: RevenueCsvRow = {
        product: 'Test Product',
        brand: 'Test Brand',
        therapeutic_area: 'Oncology',
        year: 'invalid',
        ww_sales: '1000000',
      }

      const result = transformRevenueCsvRow(row, 0)

      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].message).toBe('Invalid year value')
    })
  })

  describe('transformBrandsCsv', () => {
    it('should transform multiple brand rows', () => {
      const rows: BrandCsvRow[] = [
        {
          brand: 'Brand 1',
          status: 'Active',
          phase: 'Approved',
          therapeutic_area: 'Oncology',
          revenue_2026: '1000000',
        },
        {
          brand: 'Brand 2',
          status: 'In Pipeline',
          phase: 'Phase II',
          therapeutic_area: 'Cardiology',
          revenue_2027: '2000000',
        },
      ]

      const result = transformBrandsCsv(rows)

      expect(result.data).toHaveLength(2)
      expect(result.totalRows).toBe(2)
      expect(result.successCount).toBe(2)
      expect(result.errorCount).toBe(0)
    })
  })

  describe('transformContactsCsv', () => {
    it('should transform multiple contact rows', () => {
      const rows: ContactCsvRow[] = [
        {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          title: 'Director',
          level: 'Director',
          functional_area: 'Marketing',
          known: 'true',
          company: 'Acme Pharma',
        },
        {
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
          title: 'Manager',
          level: 'Manager',
          functional_area: 'Sales',
          known: 'false',
          company_slug: 'beta-labs',
        },
      ]

      const result = transformContactsCsv(rows)

      expect(result.data).toHaveLength(2)
      expect(result.totalRows).toBe(2)
      expect(result.successCount).toBe(2)
      expect(result.errorCount).toBe(0)
      expect(result.data[0].contact.email).toBe('john@example.com')
      expect(result.data[0].companySlug).toBe('acme-pharma')
      expect(result.data[0].groupKey).toBe('acme-pharma')
      expect(result.data[1].companySlug).toBe('beta-labs')
      expect(result.data[1].groupKey).toBe('beta-labs')
    })
  })

  describe('transformRevenueCsv', () => {
    it('should transform multiple revenue rows', () => {
      const rows: RevenueCsvRow[] = [
        {
          product: 'Product 1',
          brand: 'Brand 1',
          therapeutic_area: 'Oncology',
          year: '2026',
          ww_sales: '1000000',
        },
        {
          product: 'Product 2',
          brand: 'Brand 2',
          therapeutic_area: 'Cardiology',
          year: '2027',
          ww_sales: '2000000',
        },
      ]

      const result = transformRevenueCsv(rows)

      expect(result.data).toHaveLength(2)
      expect(result.totalRows).toBe(2)
      expect(result.successCount).toBe(2)
      expect(result.errorCount).toBe(0)
    })
  })
})


