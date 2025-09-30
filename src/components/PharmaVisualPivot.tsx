import { useState, useEffect, useRef, useMemo } from 'react'
import { usePharmaVisualPivotStore } from '@/data/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CSVColumnMapper } from '@/components/CSVMapping/CSVColumnMapper'
import { Building2, Users, TrendingUp, BarChartBig, FileText, Rss, Calculator, Stethoscope } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { CompanyMapping } from '@/components/CSVMapping/CSVColumnMapper'
import { Navigation } from '@/components/Shared/Navigation'

export function PharmaVisualPivot() {
  console.log('🚀 PharmaVisualPivot component loaded!')
  const {
    currentCompanySlug,
    companies,
    isLoading,
    error,
    createCompany,
    autoRunIfEnabled,
    clearAutoSources,
    clearAllData,
    clearError,
    hydrateFromStorage,
    isHydrated,
  } = usePharmaVisualPivotStore()

  const [importErrors, setImportErrors] = useState<string[]>([])
  const [showCSVMapping, setShowCSVMapping] = useState(false)
  const [csvMappingData, setCsvMappingData] = useState<{
    masterCompanies: string[]
    contactCompanies: string[]
    csvData: string
  } | null>(null)

  const autoRunTriggeredRef = useRef(false)

  const summaryMetrics = useMemo(() => {
    const companyList = Object.values(companies)

    const brandNames = new Set<string>()
    const indicationEntries = new Set<string>()
    let contactsTotal = 0

    companyList.forEach(company => {
      contactsTotal += company.contacts?.length ?? 0
      company.brands?.forEach(brand => {
        const normalizedName = brand.name?.trim().toLowerCase()
        if (normalizedName) {
          brandNames.add(normalizedName)
        }

        const trimmedIndication = brand.indication?.trim()
        if (trimmedIndication) {
          const key = brand.id
            ? `brand-${String(brand.id).toLowerCase()}`
            : `name-${(normalizedName || brand.name?.trim() || '').toLowerCase()}::ind-${trimmedIndication.toLowerCase()}`
          indicationEntries.add(key)
        }
      })
    })

    return {
      totalCompanies: companyList.length,
      totalContacts: contactsTotal,
      uniqueProductCount: brandNames.size,
      indicationEntryCount: indicationEntries.size,
    }
  }, [companies])

  useEffect(() => {
    if (!isHydrated) {
      hydrateFromStorage()
      return
    }

    // Auto-run logic - always try to load data if not already triggered
    const skip = autoRunTriggeredRef.current
    if (!skip) {
      autoRunTriggeredRef.current = true
      console.log('🚀 Main component: Starting auto-import sequence')
      
      // Immediate attempt
      Promise.resolve().then(async () => {
        try {
          console.log('📡 Attempting auto-import...')
          await autoRunIfEnabled()
          console.log('✅ Auto-import completed successfully')
        } catch (error) {
          console.warn('⚠️ Auto-import failed, retrying in 1 second:', error)
          // Faster retry
          setTimeout(async () => {
            try {
              console.log('🔄 Retry attempt 1...')
              await autoRunIfEnabled()
              console.log('✅ Retry successful')
            } catch (retryError) {
              console.warn('⚠️ Retry 1 failed, trying again in 2 seconds:', retryError)
              // Second retry
              setTimeout(async () => {
                try {
                  console.log('🔄 Retry attempt 2...')
                  await autoRunIfEnabled()
                  console.log('✅ Retry 2 successful')
                } catch (retryError2) {
                  console.warn('⚠️ All retries failed:', retryError2)
                }
              }, 2000)
            }
          }, 1000)
        }
      }).catch(() => {
        console.warn('⚠️ Auto-import error in main component')
      })
    }
  }, [isHydrated, currentCompanySlug, companies, createCompany, autoRunIfEnabled])

  const handleCSVMappingComplete = async (mapping: CompanyMapping[]) => {
    if (!csvMappingData) return

    try {
      setImportErrors([])
      clearError()

      // Apply the mapping to the CSV data before importing
      // const Papa = await import('papaparse')
      // const parseResult = Papa.parse(csvMappingData.csvData, {
      //   header: true,
      //   skipEmptyLines: true,
      //   transformHeader: (header) => header.toLowerCase().replace(/\s+/g, '_'),
      // })

      // Create a mapping object for quick lookup
      const companyMapping: { [key: string]: string } = {}
      mapping.forEach(map => {
        map.contactCompanies.forEach((contactCompany: string) => {
          companyMapping[contactCompany] = map.masterCompany
        })
      })

      // Transform the data with the mapping
      // const transformedData = parseResult.data.map((row: any) => {
      //   const originalCompany = row.curr_company || row.brand
      //   const mappedCompany = originalCompany ? companyMapping[originalCompany] || originalCompany : originalCompany
      //   
      //   return {
      //     ...row,
      //     curr_company: mappedCompany,
      //     brand: mappedCompany, // Also update brand field for consistency
      //   }
      // })

      // Convert back to CSV and import
      // const transformedCSV = Papa.unparse(transformedData)
      // Note: This would need to be implemented in the store
      // const result = await importContactsCsv(transformedCSV)

      setShowCSVMapping(false)
      setCsvMappingData(null)
    } catch (err) {
      setImportErrors([err instanceof Error ? err.message : 'Failed to import mapped data'])
    }
  }

  const handleCSVMappingCancel = () => {
    setShowCSVMapping(false)
    setCsvMappingData(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6">
        {/* CSV Mapping Interface */}
        {showCSVMapping && csvMappingData && (
          <div className="mb-8">
            <CSVColumnMapper
              masterCompanies={csvMappingData.masterCompanies}
              contactCompanies={csvMappingData.contactCompanies}
              onMappingComplete={handleCSVMappingComplete}
              onCancel={handleCSVMappingCancel}
            />
          </div>
        )}

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-end justify-between gap-6 mb-6">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-3">
                Pharma Visual Pivot
              </h1>
              <p className="text-lg text-muted-foreground font-light">
                Advanced pharmaceutical intelligence and portfolio management
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  console.log('🔄 Manual reload triggered')
                  try {
                    // Clear existing data first
                    console.log('🧹 Clearing existing data...')
                    clearAllData()
                    
                    // Reset the trigger flag to allow re-running
                    autoRunTriggeredRef.current = false
                    await autoRunIfEnabled()
                    console.log('✅ Manual reload successful')
                  } catch (error) {
                    console.warn('⚠️ Manual reload failed:', error)
                  }
                }}
                disabled={isLoading}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-lg border border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 text-sm font-medium hover:from-gray-100 hover:to-gray-200 transition-all duration-200 shadow-sm disabled:opacity-50"
              >
                <FileText className="h-4 w-4" />
                {isLoading ? 'Loading...' : 'Reload Data'}
              </button>
              <Link to="/analytics" className="inline-flex items-center gap-2 h-11 px-5 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 text-sm font-medium hover:from-blue-100 hover:to-blue-200 transition-all duration-200 shadow-sm">
                <BarChartBig className="h-4 w-4" />
                Analytics
              </Link>
              <Link to="/agencies" className="inline-flex items-center gap-2 h-11 px-5 rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 text-sm font-medium hover:from-purple-100 hover:to-purple-200 transition-all duration-200 shadow-sm">
                <Building2 className="h-4 w-4" />
                Agencies
              </Link>
              <Link to="/contacts" className="inline-flex items-center gap-2 h-11 px-5 rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-green-100 text-green-700 text-sm font-medium hover:from-green-100 hover:to-green-200 transition-all duration-200 shadow-sm">
                <Users className="h-4 w-4" />
                Contacts
              </Link>
              <Link to="/feed" className="inline-flex items-center gap-2 h-11 px-5 rounded-lg border border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 text-sm font-medium hover:from-orange-100 hover:to-orange-200 transition-all duration-200 shadow-sm">
                <Rss className="h-4 w-4" />
                Feed
              </Link>
              <Link to="/import-manager" className="inline-flex items-center gap-2 h-11 px-5 rounded-lg border border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 text-sm font-medium hover:from-gray-100 hover:to-gray-200 transition-all duration-200 shadow-sm">
                <FileText className="h-4 w-4" />
                Import Manager
              </Link>
            </div>
          </div>
        </div>

        {/* Data Loading Section */}
        {isLoading && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <div>
                <h3 className="font-semibold text-blue-900">Loading Data...</h3>
                <p className="text-sm text-blue-700">
                  Fetching master data from remote source. Please wait...
                </p>
              </div>
            </div>
          </div>
        )}
        
        {Object.keys(companies).length === 0 && !isLoading && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900">No Data Loaded</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Load the master data to get started. This simulates an API call that's always available.
                </p>
              </div>
              <button
                onClick={async () => {
                  console.log('🔄 Manual load triggered')
                  try {
                    // Reset the trigger flag to allow re-running
                    autoRunTriggeredRef.current = false
                    await autoRunIfEnabled()
                    console.log('✅ Manual load successful')
                  } catch (error) {
                    console.warn('⚠️ Manual load failed:', error)
                  }
                }}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
              >
                Load Master Data
              </button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-destructive">{error}</p>
                <Button variant="ghost" size="sm" onClick={clearError}>
                  ×
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Import Errors Summary */}
        {importErrors.length > 0 && (
          <Card className="mb-6 border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Import Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {importErrors.length} import errors occurred. Focus on mapping first, then review errors if needed.
              </p>
            </CardContent>
          </Card>
        )}

        {/* System Overview Dashboard */}
        <div className="space-y-8">
          {/* Data Upload Confirmation */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900">Data Successfully Loaded</h3>
                    <p className="text-sm text-green-700">
                      Master data has been imported and is ready for analysis
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      console.log('🔄 Force reload triggered')
                      try {
                        // Reset the trigger flag to allow re-running
                        autoRunTriggeredRef.current = false
                        await autoRunIfEnabled()
                        console.log('✅ Force reload successful')
                      } catch (error) {
                        console.warn('⚠️ Force reload failed:', error)
                      }
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    Reload Data
                  </button>
                  <button
                    onClick={() => {
                      console.log('🧹 Clearing auto-sources')
                      clearAutoSources()
                    }}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                  >
                    Clear Auto-Sources
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 hover:shadow-xl transition-all duration-300 group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/30 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
              <CardContent className="pt-8 pb-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Companies</p>
                    <p className="text-4xl font-bold text-blue-800 mt-2">{summaryMetrics.totalCompanies}</p>
                    <p className="text-sm text-blue-600 mt-2 font-medium">Pharmaceutical companies loaded</p>
                  </div>
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Building2 className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-50 via-purple-100 to-purple-50 hover:shadow-xl transition-all duration-300 group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200/30 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
              <CardContent className="pt-8 pb-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Products</p>
                    <p className="text-4xl font-bold text-purple-800 mt-2">
                      {summaryMetrics.uniqueProductCount}
                    </p>
                    <p className="text-sm text-purple-600 mt-2 font-medium">Unique brands and products available</p>
                  </div>
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-amber-50 via-amber-100 to-amber-50 hover:shadow-xl transition-all duration-300 group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-200/30 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
              <CardContent className="pt-8 pb-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-amber-700 uppercase tracking-wide">Indications</p>
                    <p className="text-4xl font-bold text-amber-800 mt-2">{summaryMetrics.indicationEntryCount}</p>
                    <p className="text-sm text-amber-600 mt-2 font-medium">Indication entries across all brands</p>
                  </div>
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Stethoscope className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-50 via-green-100 to-green-50 hover:shadow-xl transition-all duration-300 group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-200/30 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
              <CardContent className="pt-8 pb-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">Contacts</p>
                    <p className="text-4xl font-bold text-green-800 mt-2">
                      {summaryMetrics.totalContacts}
                    </p>
                    <p className="text-sm text-green-600 mt-2 font-medium">Total contacts across all companies</p>
                  </div>
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Company Search for Analysis */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-slate-100">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                Company Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p className="text-muted-foreground font-medium">
                  Search for a specific company to analyze their portfolio, contacts, and market position.
                </p>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search companies by name..."
                      className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-lg font-medium"
                      onChange={(e) => {
                        const query = e.target.value.toLowerCase()
                        if (query.length > 2) {
                          // Filter companies for search - could show dropdown with matches
                          Object.values(companies).filter(company => 
                            company.name.toLowerCase().includes(query)
                          )
                        }
                      }}
                    />
                  </div>
                  <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl">
                    Search
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-bold">Quick Actions</CardTitle>
              <p className="text-muted-foreground">Access key features and tools</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <Link 
                  to="/analytics" 
                  className="group relative overflow-hidden p-6 border-2 border-blue-200 rounded-2xl hover:border-blue-400 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <BarChartBig className="h-8 w-8 text-white" />
                    </div>
                    <span className="font-bold text-lg text-blue-800 mb-2">Analytics</span>
                    <span className="text-sm text-blue-600 font-medium">Portfolio analysis and insights</span>
                  </div>
                </Link>
                
                <Link 
                  to="/contacts" 
                  className="group relative overflow-hidden p-6 border-2 border-green-200 rounded-2xl hover:border-green-400 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                    <span className="font-bold text-lg text-green-800 mb-2">Contacts</span>
                    <span className="text-sm text-green-600 font-medium">Manage and analyze contacts</span>
                  </div>
                </Link>
                
                <Link 
                  to="/feed" 
                  className="group relative overflow-hidden p-6 border-2 border-purple-200 rounded-2xl hover:border-purple-400 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Rss className="h-8 w-8 text-white" />
                    </div>
                    <span className="font-bold text-lg text-purple-800 mb-2">Activity Feed</span>
                    <span className="text-sm text-purple-600 font-medium">Track recent activity</span>
                  </div>
                </Link>
                
                <Link 
                  to="/import-manager" 
                  className="group relative overflow-hidden p-6 border-2 border-orange-200 rounded-2xl hover:border-orange-400 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-50 to-orange-100"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <FileText className="h-8 w-8 text-white" />
                    </div>
                    <span className="font-bold text-lg text-orange-800 mb-2">Import Manager</span>
                    <span className="text-sm text-orange-600 font-medium">Manage data sources</span>
                  </div>
                </Link>
                
                <Link 
                  to="/fee-to-revenue-ratios" 
                  className="group relative overflow-hidden p-6 border-2 border-emerald-200 rounded-2xl hover:border-emerald-400 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-emerald-50 to-emerald-100"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Calculator className="h-8 w-8 text-white" />
                    </div>
                    <span className="font-bold text-lg text-emerald-800 mb-2">Fee Ratios</span>
                    <span className="text-sm text-emerald-600 font-medium">Service fee analysis</span>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
