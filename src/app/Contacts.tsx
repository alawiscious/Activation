import { usePharmaVisualPivotStore } from '@/data/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ContactsWorkspace } from '@/components/Contacts/ContactsWorkspace'
import { Building2, Users, Search } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { SectionButtons } from '@/components/Shared/SectionButtons'
import { Navigation } from '@/components/Shared/Navigation'
import KnownContactManager from '@/components/Contacts/KnownContactManager'
import { SmartGenomeEnrichment } from '@/components/Contacts/SmartGenomeEnrichment'
import { AutomatedEnrichmentManager } from '@/components/Contacts/AutomatedEnrichmentManager'
import { ComprehensiveGenomeImporter } from '@/components/Contacts/ComprehensiveGenomeImporter'
import type { Contact } from '@/types/domain'

export function Contacts() {
  console.log('🚀 Contacts component loaded!')
  const navigate = useNavigate()
  const { currentCompanySlug, companies, setCurrentCompany, updateContact } = usePharmaVisualPivotStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [contactFilter, setContactFilter] = useState<'all' | 'known' | 'unknown'>('all')
  const [selectedFunctionalAreas, setSelectedFunctionalAreas] = useState<string[]>([])
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'info' | 'warning'; message: string } | null>(null)
  const [companySearchTerm, setCompanySearchTerm] = useState('')
  
  const currentCompany = currentCompanySlug ? companies[currentCompanySlug] : null

  // Get ALL contacts from ALL companies for comprehensive import - heavily optimized
  const allContacts = useMemo(() => {
    // Use the unified "all-data" company if available (much faster)
    const allDataCompany = companies['all-data']
    if (allDataCompany && allDataCompany.contacts.length > 0) {
      // For very large datasets, limit to first 20k contacts for performance
      const contacts = allDataCompany.contacts.filter(contact => !contact.isIrrelevant)
      return contacts.length > 20000 ? contacts.slice(0, 20000) : contacts
    }
    
    // Fallback: aggregate from individual companies (slower)
    const allContactsList: Contact[] = []
    Object.values(companies).forEach(company => {
      allContactsList.push(...company.contacts.filter(contact => !contact.isIrrelevant))
    })
    return allContactsList.length > 20000 ? allContactsList.slice(0, 20000) : allContactsList
  }, [companies])

  const activeContacts = useMemo(() => {
    if (!currentCompany) return []
    // Show all contacts, no artificial limit
    return currentCompany.contacts.filter(contact => !contact.isIrrelevant)
  }, [currentCompany])

  // 3) Debug render path
  useEffect(() => {
    console.info('🔍 Contacts page render debug:', {
      currentCompanySlug,
      companyCount: Object.keys(companies).length,
      currentCompany: currentCompany?.name,
      currentCompanyContacts: currentCompany?.contacts?.length || 0,
      activeContactsCount: activeContacts.length,
      allContactsCount: allContacts.length,
      companies: Object.keys(companies)
    })
    
    // Immediate debug - show first contact if any
    if (currentCompany?.contacts && currentCompany.contacts.length > 0) {
      console.info('🔍 First contact sample:', currentCompany.contacts[0])
    }
    if (allContacts.length > 0) {
      console.info('🔍 First allContacts sample:', allContacts[0])
    }
    
    // Quick sanity checks - always run
    (window as any).__contacts = allContacts;
    console.info('contacts count', (window as any).__contacts?.length);
    console.info('sample keys', Object.keys((window as any).__contacts?.[0] || {}));
    console.info('sample contact', (window as any).__contacts?.[0]);
  }, [currentCompanySlug, companies, currentCompany, activeContacts, allContacts])

  const matchesCurrentStatus = (contact: Contact) => {
    if (contactFilter === 'known') return contact.known === true
    if (contactFilter === 'unknown') return contact.known === false
    return true
  }

  const matchingActiveContacts = useMemo(() => {
    return activeContacts.filter(matchesCurrentStatus)
  }, [activeContacts, contactFilter])

  const functionalAreaEntries = useMemo(() => {
    const stats = new Map<string, { active: number; irrelevant: number }>()

    // Optimize: only process contacts once, cache the results
    const contactsToProcess = allContacts.length > 2000 ? 
      allContacts.slice(0, 2000) : // Limit to first 2k for performance
      allContacts

    contactsToProcess.forEach(contact => {
      const area = contact.functionalArea?.trim() || 'Unknown'
      const entry = stats.get(area) ?? { active: 0, irrelevant: 0 }

      if (contact.isIrrelevant) {
        entry.irrelevant += 1
        stats.set(area, entry)
        return
      }

      if (!matchesCurrentStatus(contact)) {
        stats.set(area, entry)
        return
      }

      entry.active += 1
      stats.set(area, entry)
    })

    return Array.from(stats.entries())
      .map(([area, counts]) => ({ area, ...counts }))
      .filter(entry => entry.active > 0 || entry.irrelevant > 0)
      .sort((a, b) => {
        const aActiveFlag = a.active > 0 ? 1 : 0
        const bActiveFlag = b.active > 0 ? 1 : 0
        if (aActiveFlag !== bActiveFlag) return bActiveFlag - aActiveFlag
        if (a.active !== b.active) return b.active - a.active
        if (a.irrelevant !== b.irrelevant) return a.irrelevant - b.irrelevant
        return a.area.localeCompare(b.area)
      })
  }, [allContacts, contactFilter])

  useEffect(() => {
    setSelectedFunctionalAreas(prev => {
      const valid = prev.filter(area => functionalAreaEntries.some(entry => entry.area === area))
      return valid.length === prev.length ? prev : valid
    })
  }, [functionalAreaEntries])

  useEffect(() => {
    setActionFeedback(null)
  }, [selectedFunctionalAreas, contactFilter])

  const selectedActiveContacts = useMemo(() => {
    if (selectedFunctionalAreas.length === 0) return []
    const areaSet = new Set(selectedFunctionalAreas)
    
    // Optimize: limit processing for performance
    const contactsToProcess = allContacts.length > 2000 ? 
      allContacts.slice(0, 2000) : 
      allContacts
      
    return contactsToProcess.filter(contact => {
      const area = contact.functionalArea?.trim() || 'Unknown'
      if (!areaSet.has(area)) return false
      return matchesCurrentStatus(contact)
    })
  }, [allContacts, selectedFunctionalAreas, contactFilter])

  const selectedIrrelevantContacts = useMemo(() => {
    if (selectedFunctionalAreas.length === 0) return []
    const areaSet = new Set(selectedFunctionalAreas)
    
    // Optimize: limit processing for performance
    const contactsToProcess = allContacts.length > 2000 ? 
      allContacts.slice(0, 2000) : 
      allContacts
      
    return contactsToProcess.filter(contact => {
      if (!contact.isIrrelevant) return false
      const area = contact.functionalArea?.trim() || 'Unknown'
      return areaSet.has(area)
    })
  }, [allContacts, selectedFunctionalAreas])

  const handleToggleFunctionalArea = (area: string) => {
    setSelectedFunctionalAreas(prev =>
      prev.includes(area) ? prev.filter(item => item !== area) : [...prev, area]
    )
  }

  const handleClearFunctionalAreaSelection = () => {
    setSelectedFunctionalAreas([])
  }

  const handleMarkIrrelevant = () => {
    if (!selectedActiveContacts.length) {
      setActionFeedback({ type: 'warning', message: 'No contacts match the current selection.' })
      return
    }

    selectedActiveContacts.forEach(contact => {
      updateContact(contact.id, { dispositionToKlick: 'Negative', known: false, isIrrelevant: true })
    })

    setActionFeedback({
      type: 'success',
      message: `${selectedActiveContacts.length} contacts marked as irrelevant and moved to the bottom of this list.`,
    })
  }

  const handleRestoreIrrelevant = () => {
    if (!selectedIrrelevantContacts.length) {
      setActionFeedback({ type: 'warning', message: 'Select an irrelevant functional area to restore contacts.' })
      return
    }

    selectedIrrelevantContacts.forEach(contact => {
      updateContact(contact.id, { isIrrelevant: false })
    })

    setActionFeedback({
      type: 'info',
      message: `${selectedIrrelevantContacts.length} contacts restored from the irrelevant list.`,
    })
  }

  const handleLoadIntoManager = () => {
    if (!selectedActiveContacts.length) {
      setActionFeedback({ type: 'warning', message: 'Select at least one functional area first.' })
      return
    }

    navigate('/import-manager', {
      state: {
        source: 'contacts-functional-areas',
        functionalAreas: selectedFunctionalAreas,
        contactFilter,
        contactIds: selectedActiveContacts.map(contact => contact.id),
      },
    })

    setActionFeedback({
      type: 'info',
      message: `${selectedActiveContacts.length} contacts queued for Import Manager.`,
    })
  }

  const uniqueProductCount = useMemo(() => {
    if (!currentCompany?.brands?.length) {
      return 0
    }

    const uniqueNames = new Set<string>()
    currentCompany.brands.forEach(brand => {
      const normalized = brand.name?.trim().toLowerCase()
      if (normalized) {
        uniqueNames.add(normalized)
      }
    })

    return uniqueNames.size
  }, [currentCompany?.brands])

  const indicationEntryCount = useMemo(() => {
    if (!currentCompany?.brands?.length) {
      return 0
    }

    const brandsWithIndications = new Set<string>()
    currentCompany.brands.forEach(brand => {
      const trimmed = brand.indication?.trim()
      if (trimmed) {
        const key = (brand.id || `${brand.name}-${trimmed}`).toString().toLowerCase()
        brandsWithIndications.add(key)
      }
    })

    return brandsWithIndications.size
  }, [currentCompany?.brands])
  
  // Filter companies based on search term
  const filteredCompanies = Object.values(companies).filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const handleCompanySelect = (companySlug: string) => {
    setCurrentCompany(companySlug)
    setSearchTerm('')
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-end justify-between gap-6 mb-6">
            <div>
              <button
                type="button"
                className="text-primary underline mb-4 block"
                onClick={() => navigate(-1)}
              >
                ← Back
              </button>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-green-800 bg-clip-text text-transparent mb-3">
                Contacts
              </h1>
              <p className="text-lg text-muted-foreground font-light">
                Manage and analyze pharmaceutical industry contacts
              </p>
              
            {/* Company Selection - Optimized */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="font-semibold text-blue-800 mb-2">Select Company:</h3>
              
              {/* Company Search */}
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Search companies..."
                  value={companySearchTerm}
                  onChange={(e) => setCompanySearchTerm(e.target.value)}
                  className="w-full p-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <select
                value={currentCompanySlug || ''}
                onChange={(e) => setCurrentCompany(e.target.value)}
                className="w-full p-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="Select company to view contacts"
              >
                <option value="">Choose a company...</option>
                {Object.values(companies)
                  .filter(company => company.name !== 'All Data') // Exclude the unified company from main list
                  .filter(company => 
                    companySearchTerm === '' || 
                    company.name.toLowerCase().includes(companySearchTerm.toLowerCase())
                  )
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .slice(0, 100) // Limit to first 100 companies for performance
                  .map(company => (
                    <option key={company.slug} value={company.slug}>
                      {company.name} ({company.contacts?.length || 0} contacts)
                    </option>
                  ))}
                {Object.values(companies).filter(company => 
                  company.name !== 'All Data' && 
                  (companySearchTerm === '' || company.name.toLowerCase().includes(companySearchTerm.toLowerCase()))
                ).length > 100 && (
                  <option disabled>... and {Object.values(companies).filter(company => 
                    company.name !== 'All Data' && 
                    (companySearchTerm === '' || company.name.toLowerCase().includes(companySearchTerm.toLowerCase()))
                  ).length - 100} more companies</option>
                )}
              </select>
              {currentCompany && (
                <p className="text-sm text-blue-700 mt-2">
                  Selected: <strong>{currentCompany.name}</strong> with {currentCompany.contacts?.length || 0} contacts
                </p>
              )}
              <p className="text-xs text-blue-600 mt-1">
                Showing first 100 companies for performance. Use search to find specific companies.
              </p>
            </div>
            </div>
          </div>
        </div>

        {/* Section Buttons */}
        <SectionButtons showCollapseTier={false} />

      {!currentCompany ? (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-slate-100">
          <CardContent className="pt-8 pb-8">
            <div className="text-center py-8">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Users className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-green-800 mb-3">No Company Selected</h3>
              <p className="text-muted-foreground mb-6 text-lg">
                Please select a company to view and manage contacts.
              </p>
              <Link 
                to="/import-manager" 
                className="inline-flex items-center gap-3 h-12 px-6 rounded-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-green-100 text-green-700 text-sm font-semibold hover:from-green-100 hover:to-green-200 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Building2 className="h-5 w-5" />
                Go to Import Manager
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Company Info */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-blue-100">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                {currentCompany.name}
              </CardTitle>
              <p className="text-muted-foreground">Contact management and analysis</p>
            </CardHeader>
            <CardContent>
              {/* First Row: Company, Contacts, Brands */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="text-center p-6 bg-white rounded-2xl shadow-lg border-2 border-blue-200">
                  <div className="text-4xl font-bold text-blue-600 mb-2">{Object.keys(companies).length}</div>
                  <div className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Companies</div>
                </div>
                <div className="text-center p-6 bg-white rounded-2xl shadow-lg border-2 border-amber-200">
                  <div className="text-4xl font-bold text-amber-600 mb-2">{indicationEntryCount}</div>
                  <div className="text-sm font-semibold text-amber-700 uppercase tracking-wide">Indications</div>
                </div>
                <div className="text-center p-6 bg-white rounded-2xl shadow-lg border-2 border-purple-200">
                  <div className="text-4xl font-bold text-purple-600 mb-2">{uniqueProductCount}</div>
                  <div className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Products</div>
                </div>
                <div className="text-center p-6 bg-white rounded-2xl shadow-lg border-2 border-green-200">
                  <div className="text-4xl font-bold text-green-600 mb-2">{allContacts.length}</div>
                  <div className="text-sm font-semibold text-green-700 uppercase tracking-wide">Contacts</div>
                  {allContacts.length > 10000 && (
                    <div className="text-xs text-green-600 mt-1">*Limited to 20k for performance</div>
                  )}
                </div>
              </div>

              {/* Contact Status */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-4 text-gray-700">Contact Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(() => {
                    // Optimize: use sample for large datasets
                    const contactsToProcess = allContacts.length > 10000 ? 
                      allContacts.slice(0, 10000) : 
                      allContacts
                    const knownContacts = contactsToProcess.filter(contact => 
                      contact.known === true
                    ).length
                    const unknownContacts = contactsToProcess.length - knownContacts
                    
                    return (
                      <>
                        <button 
                          className={`text-center p-6 bg-white rounded-2xl shadow-lg border-2 transition-colors cursor-pointer ${
                            contactFilter === 'known' 
                              ? 'border-green-400 bg-green-50' 
                              : 'border-green-200 hover:border-green-300'
                          }`}
                          onClick={() => setContactFilter(contactFilter === 'known' ? 'all' : 'known')}
                        >
                          <div className="text-3xl font-bold text-green-600 mb-2">{knownContacts}</div>
                          <div className="text-sm font-semibold text-green-700 uppercase tracking-wide">Known to Klicksters</div>
                        </button>
                        <button 
                          className={`text-center p-6 bg-white rounded-2xl shadow-lg border-2 transition-colors cursor-pointer ${
                            contactFilter === 'unknown' 
                              ? 'border-orange-400 bg-orange-50' 
                              : 'border-orange-200 hover:border-orange-300'
                          }`}
                          onClick={() => setContactFilter(contactFilter === 'unknown' ? 'all' : 'unknown')}
                        >
                          <div className="text-3xl font-bold text-orange-600 mb-2">{unknownContacts}</div>
                          <div className="text-sm font-semibold text-orange-700 uppercase tracking-wide">Not Known</div>
                        </button>
                      </>
                    )
                  })()}
                </div>
              </div>

              {/* Contacts per Functional Area */}
              <div className="mb-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h4 className="text-lg font-semibold text-gray-700">Contacts by Functional Area</h4>
                  <div className="text-right">
                    {functionalAreaEntries.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {matchingActiveContacts.length} contacts match the current status filter
                      </span>
                    )}
                    {allContacts.length > 10000 && (
                      <div className="text-xs text-blue-600 mt-1">*Based on first 2k contacts for performance</div>
                    )}
                  </div>
                </div>

                {actionFeedback && (
                  <div
                    className={`mb-4 rounded-lg border px-3 py-2 text-xs font-medium ${
                      actionFeedback.type === 'success'
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : actionFeedback.type === 'warning'
                        ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                        : 'bg-blue-50 border-blue-200 text-blue-700'
                    }`}
                  >
                    {actionFeedback.message}
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {functionalAreaEntries.map(({ area, active, irrelevant }) => {
                    const isSelected = selectedFunctionalAreas.includes(area)
                    const isIrrelevantGroup = active === 0 && irrelevant > 0
                    return (
                      <button
                        key={area}
                        onClick={() => handleToggleFunctionalArea(area)}
                        className={`text-center p-4 rounded-xl shadow border transition-colors ${
                          isSelected
                            ? 'bg-blue-100 border-blue-300 text-blue-700'
                            : isIrrelevantGroup
                              ? 'bg-gray-100 border-gray-200 text-gray-500'
                              : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <div className={`text-2xl font-bold mb-1 ${isIrrelevantGroup ? 'opacity-60' : ''}`}>{active}</div>
                        <div className="text-xs font-medium uppercase tracking-wide">{area}</div>
                        {isIrrelevantGroup && (
                          <div className="mt-1 text-[10px] text-muted-foreground">
                            {irrelevant} hidden
                          </div>
                        )}
                      </button>
                    )
                  })}
                  {functionalAreaEntries.length === 0 && (
                    <div className="col-span-full text-center text-sm text-muted-foreground border rounded-xl py-6">
                      No contacts match the current status filter.
                    </div>
                  )}
                </div>

                {selectedFunctionalAreas.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="text-xs text-muted-foreground">
                      {selectedActiveContacts.length} active contact{selectedActiveContacts.length === 1 ? '' : 's'} selected across {selectedFunctionalAreas.length}{' '}
                      functional area{selectedFunctionalAreas.length === 1 ? '' : 's'}.
                      {selectedIrrelevantContacts.length > 0 && (
                        <span className="ml-1">
                          • {selectedIrrelevantContacts.length} currently marked as irrelevant.
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleMarkIrrelevant}
                        disabled={selectedActiveContacts.length === 0}
                      >
                        Mark as Irrelevant
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleRestoreIrrelevant}
                        disabled={selectedIrrelevantContacts.length === 0}
                      >
                        Restore from Irrelevant
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleLoadIntoManager}
                        disabled={selectedActiveContacts.length === 0}
                      >
                        Load into Manager
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleClearFunctionalAreaSelection}>
                        Clear Selection
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Company Search */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Companies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Search for a company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-lg"
                />
                {searchTerm && filteredCompanies.length > 0 && (
                  <div className="max-h-60 overflow-y-auto border rounded-lg bg-white shadow-sm">
                    {filteredCompanies.slice(0, 10).map(company => (
                      <button
                        key={company.slug}
                        onClick={() => handleCompanySelect(company.slug)}
                        className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0 flex items-center gap-3"
                      >
                        <Building2 className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="font-medium">{company.name}</div>
                          <div className="text-sm text-gray-500">
                            {company.contacts.length} contacts • {company.brands.length} brands
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contacts Workspace */}
          <div className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">
                Contacts
                {contactFilter !== 'all' && (
                  <span className="ml-2 text-sm font-normal text-gray-600">
                    ({contactFilter === 'known' ? 'Known to Klicksters' : 'Not Known'})
                  </span>
                )}
              </h3>
              
              {/* Known Contact Manager */}
              <div className="mb-6">
                <KnownContactManager 
                  contacts={activeContacts}
                  onContactsUpdate={(updatedContacts) => {
                    // Update contacts in the store
                    updatedContacts.forEach(contact => {
                      updateContact(contact.id, { known: contact.known })
                    })
                    setActionFeedback({
                      type: 'success',
                      message: `Updated known status for ${updatedContacts.length} contacts`
                    })
                  }}
                />
              </div>

              {/* Performance Warning */}
              {currentCompany && currentCompany.contacts.length > 1000 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Performance Notice:</strong> Dataset has {currentCompany.contacts.length} contacts. 
                    Showing first 1,000 for optimal performance. Use filters to narrow down results.
                  </p>
                </div>
              )}

              {/* Comprehensive Genome Import */}
              <div className="mb-6">
                <ComprehensiveGenomeImporter 
                  allContacts={allContacts}
                  onContactsUpdated={(contacts) => {
                    console.log('Comprehensive import completed:', contacts.length, 'contacts')
                    setActionFeedback({
                      type: 'success',
                      message: `Comprehensive Genome import completed! Processed ${contacts.length} contacts.`
                    })
                  }}
                />
              </div>

              {/* Automated Mega Enrichment */}
              <div className="mb-6">
                <AutomatedEnrichmentManager 
                  contacts={activeContacts}
                  onEnrichmentComplete={(job) => {
                    console.log('Mega enrichment completed:', job)
                    setActionFeedback({
                      type: 'success',
                      message: `Mega enrichment completed! Processed ${job.processedContacts} contacts.`
                    })
                  }}
                />
              </div>

              {/* Smart Genome Enrichment */}
              <div className="mb-6">
                <SmartGenomeEnrichment 
                  contacts={activeContacts}
                  onContactsUpdated={(enrichedContacts) => {
                    // Update contacts with enrichment data
                    enrichedContacts.forEach(contact => {
                      updateContact(contact.id, {
                        emailCount: contact.emailCount,
                        meetingCount: contact.meetingCount,
                        totalActivity: contact.totalActivity,
                        latestMeetingDate: contact.latestMeetingDate,
                        lastEmailDate: contact.lastEmailDate,
                        lastKlickster: contact.lastKlickster,
                        linkedinLastPulled: contact.linkedinLastPulled,
                        genomeCrmcontactId: contact.genomeCrmcontactId,
                        contactId: contact.contactId,
                        linkedinId: contact.linkedinId,
                        leadId: contact.leadId,
                      })
                    })
                    setActionFeedback({
                      type: 'success',
                      message: `Updated enrichment data for ${enrichedContacts.length} contacts`
                    })
                  }}
                />
              </div>
              
              <ContactsWorkspace 
                contactFilter={contactFilter} 
                selectedFunctionalAreas={selectedFunctionalAreas}
              />
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  )
}
