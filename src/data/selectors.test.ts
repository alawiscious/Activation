import { describe, it, expect } from 'vitest'
import { selectors } from './selectors'
import type { CompanyState, Contact, Brand, RevenueRow } from '@/types/domain'

describe('Selectors', () => {
  const mockContacts: Contact[] = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      title: 'Marketing Director',
      level: 'Director',
      functionalArea: 'Marketing',
      brand: 'Brand A',
      therapeuticArea: 'Oncology',
      known: true,
      dispositionToKlick: 'Positive',
      influenceLevel: 'Influencer',
      derivedLabel: 'Advocate',
      agencyAlignment: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      title: 'Sales Manager',
      level: 'Manager',
      functionalArea: 'Sales',
      brand: 'Brand B',
      therapeuticArea: 'Cardiology',
      known: false,
      dispositionToKlick: 'Neutral',
      influenceLevel: 'Gatekeeper',
      derivedLabel: 'Guarded Neutral',
      agencyAlignment: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      firstName: 'Bob',
      lastName: 'Johnson',
      email: 'bob@example.com',
      title: 'VP Marketing',
      level: 'VP',
      functionalArea: 'Marketing',
      brand: 'Brand A',
      therapeuticArea: 'Oncology',
      known: true,
      dispositionToKlick: 'Negative',
      influenceLevel: 'Decision Maker',
      derivedLabel: 'Detractor',
      agencyAlignment: 'Havas',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  const mockBrands: Brand[] = [
    {
      id: 'brand1',
      name: 'Brand A',
      status: 'Active',
      phase: 'Approved',
      therapeuticArea: 'Oncology',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'brand2',
      name: 'Brand B',
      status: 'In Pipeline',
      phase: 'Phase II',
      therapeuticArea: 'Cardiology',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  const mockRevenueRows: RevenueRow[] = [
    {
      id: 'rev1',
      brandId: 'brand1',
      year: 2026,
      wwSales: 1000000,
      usSales: 400000,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'rev2',
      brandId: 'brand1',
      year: 2027,
      wwSales: 1200000,
      usSales: 500000,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  const mockCompanyState: CompanyState = {
    id: 'company1',
    name: 'Test Company',
    slug: 'test-company',
    brands: mockBrands,
    contacts: mockContacts,
    revenueRows: mockRevenueRows,
    filters: {
      brands: [],
      therapeuticAreas: [],
      functionalAreas: [],
      levels: [],
      roleLevels: [],
      seniorities: [],
      titleSearch: '',
      knownOnly: false,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  describe('selectFilteredContacts', () => {
    it('should return all contacts when no filters are applied', () => {
      const result = selectors.selectFilteredContacts(mockCompanyState)
      expect(result).toHaveLength(3)
    })

    it('should filter by brand', () => {
      const stateWithFilters = {
        ...mockCompanyState,
        filters: {
          ...mockCompanyState.filters,
          brands: ['Brand A'],
        },
      }
      const result = selectors.selectFilteredContacts(stateWithFilters)
      expect(result).toHaveLength(2)
      expect(result.every(contact => contact.brand === 'Brand A')).toBe(true)
    })

    it('should filter by therapeutic area', () => {
      const stateWithFilters = {
        ...mockCompanyState,
        filters: {
          ...mockCompanyState.filters,
          therapeuticAreas: ['Oncology'],
        },
      }
      const result = selectors.selectFilteredContacts(stateWithFilters)
      expect(result).toHaveLength(2)
      expect(result.every(contact => contact.therapeuticArea === 'Oncology')).toBe(true)
    })

    it('should match therapeutic area via brand catalog when contact lacks one', () => {
      const contactsWithoutTA: Contact[] = mockCompanyState.contacts.map(contact =>
        contact.id === '2' ? { ...contact, therapeuticArea: '' } : contact
      )
      const stateWithFilters = {
        ...mockCompanyState,
        contacts: contactsWithoutTA,
        filters: {
          ...mockCompanyState.filters,
          therapeuticAreas: ['Cardiology'],
        },
      }
      const result = selectors.selectFilteredContacts(stateWithFilters)
      expect(result.some(contact => contact.id === '2')).toBe(true)
    })

    it('should filter by functional area', () => {
      const stateWithFilters = {
        ...mockCompanyState,
        filters: {
          ...mockCompanyState.filters,
          functionalAreas: ['Marketing'],
        },
      }
      const result = selectors.selectFilteredContacts(stateWithFilters)
      expect(result).toHaveLength(2)
      expect(result.every(contact => contact.functionalArea === 'Marketing')).toBe(true)
    })

    it('should filter by role level (derived from title)', () => {
      const stateWithFilters = {
        ...mockCompanyState,
        filters: {
          ...mockCompanyState.filters,
          roleLevels: ['Director'],
        },
      }
      const result = selectors.selectFilteredContacts(stateWithFilters)
      expect(result).toHaveLength(1)
      expect(result[0].level).toBe('Director')
    })

    it('should filter by title search', () => {
      const stateWithFilters = {
        ...mockCompanyState,
        filters: {
          ...mockCompanyState.filters,
          titleSearch: 'Marketing',
        },
      }
      const result = selectors.selectFilteredContacts(stateWithFilters)
      expect(result).toHaveLength(2)
      expect(result.every(contact => contact.title.includes('Marketing'))).toBe(true)
    })

    it('should filter by known only', () => {
      const stateWithFilters = {
        ...mockCompanyState,
        filters: {
          ...mockCompanyState.filters,
          knownOnly: true,
        },
      }
      const result = selectors.selectFilteredContacts(stateWithFilters)
      expect(result).toHaveLength(2)
      expect(result.every(contact => contact.known)).toBe(true)
    })
  })

  describe('selectBrandOptions', () => {
    it('should return unique brand names from contacts', () => {
      const result = selectors.selectBrandOptions(mockCompanyState)
      expect(result).toEqual(['Brand A', 'Brand B'])
    })
  })

  describe('selectTherapeuticAreaOptions', () => {
    it('should return unique therapeutic areas from contacts', () => {
      const result = selectors.selectTherapeuticAreaOptions(mockCompanyState)
      expect(result).toEqual(['Cardiology', 'Oncology'])
    })

    it('should include therapeutic areas sourced from brands', () => {
      const contactsWithoutTA: Contact[] = mockCompanyState.contacts.map(contact =>
        contact.id === '2' ? { ...contact, therapeuticArea: '' } : contact
      )
      const stateWithMissingAreas = {
        ...mockCompanyState,
        contacts: contactsWithoutTA,
      }
      const result = selectors.selectTherapeuticAreaOptions(stateWithMissingAreas)
      expect(result).toContain('Cardiology')
    })
  })

  describe('selectFunctionalAreaOptions', () => {
    it('should return unique functional areas from contacts', () => {
      const result = selectors.selectFunctionalAreaOptions(mockCompanyState)
      expect(result).toEqual(['Marketing', 'Sales'])
    })
  })

  describe('selectRoleOptions', () => {
    it('should return unique role levels derived from titles', () => {
      const result = selectors.selectRoleOptions(mockCompanyState)
      expect(result).toEqual(['VP', 'Director', 'Manager'])
    })
  })

  describe('selectPivotsByFunctionalArea', () => {
    it('should return pivot summaries grouped by functional area and level', () => {
      const result = selectors.selectPivotsByFunctionalArea(mockCompanyState)
      expect(result).toHaveLength(3)
      
      const marketingDirector = result.find(p => p.functionalArea === 'Marketing' && p.level === 'Director')
      expect(marketingDirector?.count).toBe(1)
      expect(marketingDirector?.knownCount).toBe(1)
      expect(marketingDirector?.unknownCount).toBe(0)
    })
  })

  describe('selectPivotsByBrand', () => {
    it('should return pivot summaries grouped by brand and therapeutic area', () => {
      const result = selectors.selectPivotsByBrand(mockCompanyState)
      expect(result).toHaveLength(2)
      
      const brandAOncology = result.find(p => p.brand === 'Brand A' && p.therapeuticArea === 'Oncology')
      expect(brandAOncology?.count).toBe(2)
      expect(brandAOncology?.knownCount).toBe(2)
      expect(brandAOncology?.unknownCount).toBe(0)
    })
  })

  describe('selectRevenueByBrand', () => {
    it('should group revenue rows by brand ID', () => {
      const result = selectors.selectRevenueByBrand(mockCompanyState)
      expect(result.has('brand1')).toBe(true)
      expect(result.get('brand1')).toHaveLength(2)
    })
  })

  describe('selectRevenueSeriesByBrand', () => {
    it('should return revenue chart data for a specific brand', () => {
      const getRevenueSeries = selectors.selectRevenueSeriesByBrand(mockCompanyState)
      const result = getRevenueSeries('brand1')
      
      expect(result).toHaveLength(2)
      expect(result[0].year).toBe(2026)
      expect(result[0].ww).toBe(1000000)
      expect(result[0].us).toBe(400000)
      expect(result[1].year).toBe(2027)
      expect(result[1].ww).toBe(1200000)
      expect(result[1].us).toBe(500000)
    })
  })

  describe('selectBrandsWithRevenue', () => {
    it('should return brands with revenue information', () => {
      const result = selectors.selectBrandsWithRevenue(mockCompanyState)
      expect(result).toHaveLength(2)
      
      const brandA = result.find(b => b.id === 'brand1')
      expect(brandA?.hasRevenue).toBe(true)
      expect(brandA?.revenueCount).toBe(2)
      
      const brandB = result.find(b => b.id === 'brand2')
      expect(brandB?.hasRevenue).toBe(false)
      expect(brandB?.revenueCount).toBe(0)
    })
  })

  describe('selectContactStats', () => {
    it('should return contact statistics', () => {
      const result = selectors.selectContactStats(mockCompanyState)
      expect(result.total).toBe(3)
      expect(result.known).toBe(2)
      expect(result.unknown).toBe(1)
      expect(result.byLevel.Director).toBe(1)
      expect(result.byLevel.Manager).toBe(1)
      expect(result.byLevel.VP).toBe(1)
      expect(result.byFunctionalArea.Marketing).toBe(2)
      expect(result.byFunctionalArea.Sales).toBe(1)
      expect(result.byDerivedLabel.Advocate).toBe(1)
      expect(result.byDerivedLabel['Guarded Neutral']).toBe(1)
      expect(result.byDerivedLabel.Detractor).toBe(1)
    })
  })
})
