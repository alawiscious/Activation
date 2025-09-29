// Memoized selectors for filtered data and pivots
import { createSelector } from 'reselect'
import type {
  CompanyState,
  Contact,
  Brand,
  RevenueRow,
  Filters,
  PivotSummary,
  BrandPivotSummary,
  RevenueChartData,
} from '@/types/domain'

// Helpers to parse title into role (Manager/Director/VP/C-Suite/IC) and seniority adjectives
function roleFromTitle(title: string): string {
  const t = (title || '').toLowerCase()
  // C‑Suite: strictly Chief __ Officer or C?O pattern
  if (/(chief\s+[a-z\s]+\s+officer)\b/.test(t)) return 'C-Suite'
  if (/\bc[a-z]{1,3}o\b/.test(t)) return 'C-Suite' // e.g., CEO, CFO, CMO, CRO, CDO
  // VP and SVP/EVP
  if (/(\bsvp\b|senior\s+vice\s+president|exec(?:utive)?\s+vp|evp\b)/.test(t)) return 'VP'
  if (/(\bvp\b|vice\s+president)/.test(t)) return 'VP'
  if (/(head\s+of|chair\b|chairperson|managing\s+director|sr\.?\s*director|senior\s+director|associate\s+director|assistant\s+director|director\b)/.test(t)) return 'Director'
  if (/(general\s+manager|sr\.?\s*manager|senior\s+manager|associate\s+manager|assistant\s+manager|manager\b|lead\b|principal\b)/.test(t)) return 'Manager'
  return 'Individual Contributor'
}

function senioritiesFromTitle(title: string): string[] {
  const tokens: string[] = []
  const t = (title || '').toLowerCase()
  if (/(^|\W)sr\.?($|\W)|senior\b/.test(t)) tokens.push('Senior')
  if (/(^|\W)jr\.?($|\W)|junior\b/.test(t)) tokens.push('Junior')
  if (/associate\b/.test(t)) tokens.push('Associate')
  if (/assistant\b/.test(t)) tokens.push('Assistant')
  if (/lead\b/.test(t)) tokens.push('Lead')
  if (/principal\b/.test(t)) tokens.push('Principal')
  if (/executive\b/.test(t)) tokens.push('Executive')
  return Array.from(new Set(tokens))
}

// Base selectors
export const selectContacts = (state: CompanyState) => state.contacts
export const selectBrands = (state: CompanyState) => state.brands
export const selectRevenueRows = (state: CompanyState) => state.revenueRows
export const selectFilters = (state: CompanyState) => state.filters

// Filtered contacts selector
export const selectFilteredContacts = createSelector(
  [selectContacts, selectFilters, selectBrands],
  (contacts: Contact[], filters: Filters, brands: Brand[]): Contact[] => {
    const brandStage = new Map<string, string>()
    const brandTherapeuticArea = new Map<string, string>()
    brands.forEach(b => {
      if (!b.name) return
      const key = b.name.toLowerCase()
      brandStage.set(key, (b.indicationMarketStatus || '').trim())
      brandTherapeuticArea.set(key, (b.therapeuticArea || '').trim())
    })
    return contacts.filter(contact => {
      if (contact.isIrrelevant) return false
      // Brand filter
      if (filters.brands.length > 0 && contact.brand) {
        if (!filters.brands.includes(contact.brand)) return false
      }

      // Therapeutic area filter
      if (filters.therapeuticAreas.length > 0) {
        const contactAreaRaw = (contact.therapeuticArea || '').trim()
        const contactArea = contactAreaRaw && contactAreaRaw.toLowerCase() !== 'unknown' ? contactAreaRaw : ''
        const mappedArea = contact.brand ? (brandTherapeuticArea.get(contact.brand.toLowerCase()) || '') : ''
        const matchContact = contactArea && filters.therapeuticAreas.includes(contactArea)
        const matchBrand = mappedArea && filters.therapeuticAreas.includes(mappedArea)
        if (!matchContact && !matchBrand) return false
      }

      // Functional area filter
      if (filters.functionalAreas.length > 0) {
        if (!filters.functionalAreas.includes(contact.functionalArea)) return false
      }

      // Role filter (derived from title)
      if (filters.roleLevels && filters.roleLevels.length > 0) {
        const role = roleFromTitle(contact.title)
        if (!filters.roleLevels.includes(role)) return false
      }

      // Seniority filter (derived from title adjectives)
      if (filters.seniorities && filters.seniorities.length > 0) {
        const sTokens = senioritiesFromTitle(contact.title)
        if (!sTokens.some(s => filters.seniorities!.includes(s))) return false
      }

      // Stage filter (via brand mapping)
      if (filters.stages && filters.stages.length > 0) {
        const stage = contact.brand ? (brandStage.get(contact.brand.toLowerCase()) || '') : ''
        if (!stage || !filters.stages.includes(stage)) return false
      }

      // Location filter (now filters by country)
      if (filters.locations && filters.locations.length > 0) {
        const contactLocation = (contact.location || '').trim()
        if (!contactLocation) return false
        
        const contactCountry = extractCountryFromLocation(contactLocation)
        if (!contactCountry || !filters.locations.includes(contactCountry)) return false
      }

      // Title search filter
      if (filters.titleSearch.trim()) {
        const searchTerm = filters.titleSearch.trim().toLowerCase()
        const title = contact.title.toLowerCase()
        if (!title.includes(searchTerm)) return false
      }

      // Known only filter
      if (filters.knownOnly && !contact.known) return false

      return true
    })
  }
)

// Filter options selectors
export const selectBrandOptions = createSelector(
  [selectBrands],
  (brandsList: Brand[]): string[] => {
    const brands = new Set<string>()
    // Show all brands from the master upload for this account
    brandsList.forEach(brand => {
      if (brand.name) brands.add(brand.name)
    })
    return Array.from(brands).filter(Boolean).sort()
  }
)

export const selectStageOptions = createSelector(
  [selectBrands],
  (brandsList: Brand[]): string[] => {
    const st = new Set<string>()
    // Show all stages from the master upload for this account
    brandsList.forEach(b => { 
      const s = (b.indicationMarketStatus || '').trim()
      if (s) st.add(s) 
    })
    return Array.from(st).sort((a,b)=>a.localeCompare(b))
  }
)

export const selectTherapeuticAreaOptions = createSelector(
  [selectBrands],
  (brandsList: Brand[]): string[] => {
    const areas = new Set<string>()
    // Show all therapeutic areas from the master upload for this account
    brandsList.forEach(brand => {
      const value = (brand.therapeuticArea || '').trim()
      if (value) areas.add(value)
    })
    return Array.from(areas).sort((a, b) => a.localeCompare(b))
  }
)

export const selectFunctionalAreaOptions = createSelector(
  [selectContacts],
  (contacts: Contact[]): string[] => {
    const areas = new Set<string>()
    contacts.forEach(contact => {
      if (contact.isIrrelevant) return
      areas.add(contact.functionalArea)
    })
    return Array.from(areas).sort()
  }
)

// Helper function to extract country from location string
const extractCountryFromLocation = (location: string): string => {
  if (!location || !location.trim()) return ''
  
  const locationStr = location.trim()
  
  // Common patterns to extract country from location strings
  // Examples: "New York, USA" -> "USA", "London, UK" -> "UK", "Toronto, Canada" -> "Canada"
  // "San Francisco, CA, USA" -> "USA", "Berlin, Germany" -> "Germany"
  
  // Split by common separators
  const parts = locationStr.split(/[,;|]/).map(part => part.trim())
  
  // If we have multiple parts, the last one is usually the country
  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1]
    
    // Common country abbreviations and names
    const countryMappings: Record<string, string> = {
      'USA': 'United States',
      'US': 'United States',
      'UK': 'United Kingdom',
      'UAE': 'United Arab Emirates',
      'CA': 'Canada', // Only if it's clearly a country, not California
    }
    
    // Check if it's a known country abbreviation
    if (countryMappings[lastPart.toUpperCase()]) {
      return countryMappings[lastPart.toUpperCase()]
    }
    
    // If it's a 2-letter code that could be a state, check if it's actually a country
    if (lastPart.length === 2 && lastPart.match(/^[A-Z]{2}$/)) {
      // Common US state codes - if it's one of these, look for the country in previous parts
      const usStates = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY']
      
      if (usStates.includes(lastPart.toUpperCase())) {
        // This is a US state, look for USA/US in the string
        const fullLocation = locationStr.toUpperCase()
        if (fullLocation.includes('USA') || fullLocation.includes('US')) {
          return 'United States'
        }
      }
    }
    
    // Return the last part as-is if it looks like a country name
    return lastPart
  }
  
  // If only one part, return it as-is
  return locationStr
}

export const selectLocationOptions = createSelector(
  [selectContacts],
  (contacts: Contact[]): string[] => {
    const countries = new Set<string>()
    contacts.forEach(contact => {
      if (contact.location && contact.location.trim()) {
        const country = extractCountryFromLocation(contact.location)
        if (country) {
          countries.add(country)
        }
      }
    })
    return Array.from(countries).sort()
  }
)

export const selectRoleOptions = createSelector(
  [selectContacts],
  (contacts: Contact[]): string[] => {
    const levels = new Set<string>()
    contacts.forEach(c => levels.add(roleFromTitle(c.title)))
    const order = ['C-Suite', 'VP', 'Director', 'Manager', 'Individual Contributor']
    const values = Array.from(levels)
    const sorted: string[] = []
    order.forEach(o => { if (values.includes(o)) sorted.push(o) })
    values.forEach(v => { if (!sorted.includes(v)) sorted.push(v) })
    return sorted
  }
)

export const selectSeniorityOptions = createSelector(
  [selectContacts],
  (contacts: Contact[]): string[] => {
    const set = new Set<string>()
    contacts.forEach(c => senioritiesFromTitle(c.title).forEach(s => set.add(s)))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }
)


// Pivot summaries
export const selectPivotsByFunctionalArea = createSelector(
  [selectFilteredContacts],
  (contacts: Contact[]): PivotSummary[] => {
    const pivotMap = new Map<string, PivotSummary>()

    contacts.forEach(contact => {
      const key = `${contact.functionalArea}-${contact.level}`
      
      if (!pivotMap.has(key)) {
        pivotMap.set(key, {
          functionalArea: contact.functionalArea,
          level: contact.level,
          count: 0,
          knownCount: 0,
          unknownCount: 0,
        })
      }

      const pivot = pivotMap.get(key)!
      pivot.count++
      if (contact.known) {
        pivot.knownCount++
      } else {
        pivot.unknownCount++
      }
    })

    return Array.from(pivotMap.values()).sort((a, b) => {
      if (a.functionalArea !== b.functionalArea) {
        return a.functionalArea.localeCompare(b.functionalArea)
      }
      return a.level.localeCompare(b.level)
    })
  }
)

export const selectPivotsByBrand = createSelector(
  [selectFilteredContacts],
  (contacts: Contact[]): BrandPivotSummary[] => {
    const pivotMap = new Map<string, BrandPivotSummary>()

    contacts.forEach(contact => {
      if (!contact.brand || !contact.therapeuticArea) return

      const key = `${contact.brand}-${contact.therapeuticArea}`
      
      if (!pivotMap.has(key)) {
        pivotMap.set(key, {
          brand: contact.brand,
          therapeuticArea: contact.therapeuticArea,
          count: 0,
          knownCount: 0,
          unknownCount: 0,
        })
      }

      const pivot = pivotMap.get(key)!
      pivot.count++
      if (contact.known) {
        pivot.knownCount++
      } else {
        pivot.unknownCount++
      }
    })

    return Array.from(pivotMap.values()).sort((a, b) => {
      if (a.brand !== b.brand) {
        return a.brand.localeCompare(b.brand)
      }
      return a.therapeuticArea.localeCompare(b.therapeuticArea)
    })
  }
)

// Revenue selectors
export const selectRevenueByBrand = createSelector(
  [selectRevenueRows, selectBrands],
  (revenueRows: RevenueRow[], _brands: Brand[]) => {
    const revenueByBrand = new Map<string, RevenueRow[]>()
    
    revenueRows.forEach(revenue => {
      if (!revenueByBrand.has(revenue.brandId)) {
        revenueByBrand.set(revenue.brandId, [])
      }
      revenueByBrand.get(revenue.brandId)!.push(revenue)
    })

    return revenueByBrand
  }
)

export const selectRevenueSeriesByBrand = createSelector(
  [selectRevenueByBrand],
  (revenueByBrand: Map<string, RevenueRow[]>) => {
    return (brandId: string): RevenueChartData[] => {
      const brandRevenue = revenueByBrand.get(brandId) || []
      
      // Group by year and create chart data
      const yearMap = new Map<number, RevenueChartData>()
      
      brandRevenue.forEach(revenue => {
        if (!yearMap.has(revenue.year)) {
          yearMap.set(revenue.year, {
            year: revenue.year,
            ww: null,
            us: null,
          })
        }
        
        const chartData = yearMap.get(revenue.year)!
        if (revenue.wwSales !== null && revenue.wwSales !== undefined) {
          chartData.ww = revenue.wwSales
        }
        if (revenue.usSales !== null && revenue.usSales !== undefined) {
          chartData.us = revenue.usSales
        }
      })

      return Array.from(yearMap.values()).sort((a, b) => a.year - b.year)
    }
  }
)

// Brand with revenue selector
export const selectBrandsWithRevenue = createSelector(
  [selectBrands, selectRevenueByBrand],
  (brands: Brand[], revenueByBrand: Map<string, RevenueRow[]>) => {
    return brands.map(brand => ({
      ...brand,
      hasRevenue: revenueByBrand.has(brand.id),
      revenueCount: revenueByBrand.get(brand.id)?.length || 0,
    }))
  }
)

// Statistics selectors
export const selectContactStats = createSelector(
  [selectFilteredContacts],
  (contacts: Contact[]) => {
    const total = contacts.length
    const known = contacts.filter(c => c.known).length
    const unknown = total - known
    
    const byLevel = contacts.reduce((acc, contact) => {
      acc[contact.level] = (acc[contact.level] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byFunctionalArea = contacts.reduce((acc, contact) => {
      acc[contact.functionalArea] = (acc[contact.functionalArea] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byDerivedLabel = contacts.reduce((acc, contact) => {
      acc[contact.derivedLabel] = (acc[contact.derivedLabel] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total,
      known,
      unknown,
      byLevel,
      byFunctionalArea,
      byDerivedLabel,
    }
  }
)

// Search and filter utilities
export const selectContactsBySearch = createSelector(
  [selectFilteredContacts],
  (contacts: Contact[]) => {
    return (searchTerm: string): Contact[] => {
      if (!searchTerm.trim()) return contacts
      
      const term = searchTerm.toLowerCase()
      return contacts.filter(contact => {
        return (
          contact.firstName.toLowerCase().includes(term) ||
          contact.lastName.toLowerCase().includes(term) ||
          contact.email.toLowerCase().includes(term) ||
          contact.title.toLowerCase().includes(term) ||
          contact.functionalArea.toLowerCase().includes(term) ||
          (contact.brand && contact.brand.toLowerCase().includes(term)) ||
          (contact.therapeuticArea && contact.therapeuticArea.toLowerCase().includes(term))
        )
      })
    }
  }
)

// Export all selectors for easy access
export const selectors = {
  // Base selectors
  selectContacts,
  selectBrands,
  selectRevenueRows,
  selectFilters,
  
  // Filtered data
  selectFilteredContacts,
  
  // Filter options
  selectBrandOptions,
  selectTherapeuticAreaOptions,
  selectFunctionalAreaOptions,
  selectLocationOptions,
  selectStageOptions,
  selectRoleOptions,
  selectSeniorityOptions,
  
  // Pivots
  selectPivotsByFunctionalArea,
  selectPivotsByBrand,
  
  // Revenue
  selectRevenueByBrand,
  selectRevenueSeriesByBrand,
  selectBrandsWithRevenue,
  
  // Statistics
  selectContactStats,
  
  // Search
  selectContactsBySearch,
}
