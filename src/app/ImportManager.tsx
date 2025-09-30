import { useState, useCallback, useRef } from 'react'
import { usePharmaVisualPivotStore } from '@/data/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Upload, Download, BarChartBig } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

export function ImportManager() {
  const navigate = useNavigate()
  const {
    currentCompanySlug,
    companies,
    importBrandsCsv,
    importContactsCsv,
    importRevenueCsv,
    importMasterCsv,
    exportState,
    autoSources,
    addAutoSource,
    updateAutoSource,
    deleteAutoSource,
    runAutoSourceNow,
    importContactsFromUrl,
  } = usePharmaVisualPivotStore()

  const [importErrors, setImportErrors] = useState<string[]>([])
  const [masterProgress, setMasterProgress] = useState<{ processed: number; companies: number; brands: number; upserts: number } | null>(null)
  const [masterSummary, setMasterSummary] = useState<{ total: number; processed: number; companiesAffected: number; brandsCreated: number; upserts: number; affectedCompanies: { slug: string; name: string }[] } | null>(null)
  const [masterImporting, setMasterImporting] = useState(false)
  const [runningMasterContacts, setRunningMasterContacts] = useState(false)
  const [, setFileUploading] = useState(false)

  // Refs for auto import form elements
  const autoSrcTypeRef = useRef<HTMLSelectElement>(null)
  const autoSrcModeRef = useRef<HTMLSelectElement>(null)
  const autoSrcOverwriteRef = useRef<HTMLInputElement>(null)
  const autoSrcPreserveRef = useRef<HTMLInputElement>(null)

  const currentCompany = currentCompanySlug ? companies[currentCompanySlug] : null
  const defaultContactsUrl = (import.meta as any).env?.VITE_DEFAULT_CONTACTS_CSV


  const handleExport = useCallback(() => {
    if (!currentCompany) return
    exportState()
  }, [currentCompany, exportState])

  const exportContactsCsv = useCallback(() => {
    if (!currentCompany) return
    // Implementation for CSV export
    console.log('Export contacts CSV for:', currentCompany.slug)
  }, [currentCompany])

  const downloadMasterTemplate = useCallback(() => {
    // Implementation for downloading master template
    console.log('Download master template')
  }, [])

  const generateCsvTemplate = useCallback((type: string) => {
    // Implementation for generating CSV template
    console.log('Generate CSV template for:', type)
  }, [])

  const handleRunMasterContacts = useCallback(async () => {
    if (!defaultContactsUrl) return
    try {
      setRunningMasterContacts(true)
      await importContactsFromUrl(defaultContactsUrl)
    } catch (err) {
      setImportErrors([err instanceof Error ? err.message : 'Failed to import master contacts'])
    } finally {
      setRunningMasterContacts(false)
    }
  }, [defaultContactsUrl, importContactsFromUrl])

  const handleFileUpload = useCallback(async (file: File, type: 'brands' | 'contacts' | 'revenue') => {
    try {
      setImportErrors([])
      setFileUploading(true)
      console.log(`📁 Uploading ${type} file: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`)
      
      // Read the file content
      const fileContent = await file.text()
      console.log(`📊 File content loaded: ${fileContent.length} characters`)
      
      if (type === 'brands') {
        await importBrandsCsv(fileContent)
      } else if (type === 'contacts') {
        console.log('🔄 Processing contacts data...')
        await importContactsCsv(fileContent, { preview: false, overwrite: true })
        console.log('✅ Contacts processed successfully')
      } else if (type === 'revenue') {
        await importRevenueCsv(fileContent)
      }
    } catch (err) {
      console.error(`❌ ${type} import failed:`, err)
      setImportErrors([err instanceof Error ? err.message : `${type} import failed`])
    } finally {
      setFileUploading(false)
    }
  }, [importBrandsCsv, importContactsCsv, importRevenueCsv])

  const handleLoadSampleData = useCallback(async () => {
    try {
      setImportErrors([])
      // Load sample data implementation
      console.log('Loading sample data')
    } catch (err) {
      setImportErrors([err instanceof Error ? err.message : 'Failed to load sample data'])
    }
  }, [])

  return (
    <div className="min-h-screen bg-background">
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
              <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-orange-800 bg-clip-text text-transparent mb-3">
                Import Manager
              </h1>
              <p className="text-lg text-muted-foreground font-light">
                Manage data sources and import pharmaceutical data
              </p>
            </div>
          </div>
        </div>

      {/* Error Display */}
      {importErrors.length > 0 && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-destructive font-medium">Import Errors:</p>
                <ul className="text-sm text-destructive mt-1">
                  {importErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setImportErrors([])}>
                ×
              </Button>
            </div>
          </CardContent>
        </Card>
      )}


      {/* Data Import */}
      <Card className="border-0 shadow-lg mb-6">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <Upload className="h-5 w-5 text-white" />
            </div>
            Data Import
          </CardTitle>
          <p className="text-muted-foreground">Import pharmaceutical data from various sources</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Load Sample Data Button */}
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <div>
              <h3 className="font-medium">Quick Start</h3>
              <p className="text-sm text-muted-foreground">
                Load sample pharmaceutical data to explore the application
              </p>
            </div>
            <Button onClick={handleLoadSampleData} className="ml-auto">
              Load Sample Data
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Master Import */}
            <div className="space-y-2 md:col-span-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Master CSV (Large, 50k+ rows)</h3>
                <Button variant="outline" size="sm" onClick={downloadMasterTemplate}>Download Master Template</Button>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    setMasterImporting(true)
                    setMasterProgress({ processed: 0, companies: 0, brands: 0, upserts: 0 })
                    setMasterSummary(null)
                    const summary = await importMasterCsv(file, (info) => setMasterProgress(info))
                    setMasterSummary(summary)
                  } catch (err) {
                    setImportErrors([err instanceof Error ? err.message : 'Master import failed'])
                  } finally {
                    setMasterImporting(false)
                  }
                }}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              {(masterImporting || masterProgress || masterSummary) && (
                <div className="text-xs text-muted-foreground">
                  {masterImporting && <div>Importing… this may take a minute.</div>}
                  {masterProgress && (
                    <div>Processed: {masterProgress.processed.toLocaleString()} • Companies: {masterProgress.companies} • Brands: {masterProgress.brands.toLocaleString()} • Upserts: {masterProgress.upserts.toLocaleString()}</div>
                  )}
                  {masterSummary && (
                    <div className="space-y-1">
                      <div className="text-foreground">Done. Rows: {masterSummary.processed.toLocaleString()} • Companies: {masterSummary.companiesAffected} • Brands created: {masterSummary.brandsCreated.toLocaleString()} • Revenue upserts: {masterSummary.upserts.toLocaleString()}</div>
                        {masterSummary.affectedCompanies.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span>Companies affected:</span>
                            <span className="text-sm text-muted-foreground">
                              {masterSummary.affectedCompanies.map(c => c.name).join(', ')}
                            </span>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Contacts Import */}
            <div className="space-y-2">
              <h3 className="font-medium">Contacts CSV</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <input id="overwrite-contacts" type="checkbox" onChange={(e) => (window as any).__overwriteContacts = e.target.checked} />
                <label htmlFor="overwrite-contacts">Overwrite matching contacts (preserve existing non-empty fields)</label>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <input id="preserve-edits-contacts" type="checkbox" defaultChecked onChange={(e) => (window as any).__preserveEditsContacts = e.target.checked} />
                <label htmlFor="preserve-edits-contacts">Preserve edits (keep existing non-empty values)</label>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file, 'contacts')
                }}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateCsvTemplate('contacts')}
              >
                Download Template
              </Button>
              {defaultContactsUrl && (
                <div className="flex flex-col gap-2 text-xs">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-fit"
                    disabled={runningMasterContacts}
                    onClick={handleRunMasterContacts}
                  >
                    {runningMasterContacts ? 'Loading master contacts…' : 'Run saved master contacts'}
                  </Button>
                  <span className="text-muted-foreground">
                    Uses `VITE_DEFAULT_CONTACTS_CSV` ({defaultContactsUrl})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Auto Import Sources */}
          <Card className="mt-6 border-0 shadow-lg">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                Auto Import Sources
              </CardTitle>
              <p className="text-muted-foreground">Configure automatic data import from various sources</p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <select ref={autoSrcTypeRef} className="border rounded h-9 px-2 text-sm bg-background">
                  <option value="master">Master CSV</option>
                  <option value="contacts">Contacts CSV</option>
                </select>
                <select ref={autoSrcModeRef} className="border rounded h-9 px-2 text-sm bg-background">
                  <option value="off">Do not auto-run</option>
                  <option value="whenEmpty">Auto-run when no companies</option>
                  <option value="always">Always auto-run on load</option>
                </select>
                <label className="flex items-center gap-1">
                  <input ref={autoSrcOverwriteRef} type="checkbox" className="rounded" defaultChecked /> Overwrite
                </label>
                <label className="flex items-center gap-1">
                  <input ref={autoSrcPreserveRef} type="checkbox" className="rounded" defaultChecked /> Preserve edits
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const type = autoSrcTypeRef.current?.value as 'master'|'contacts'
                    const mode = autoSrcModeRef.current?.value as 'off'|'whenEmpty'|'always'
                    const overwrite = autoSrcOverwriteRef.current?.checked ?? false
                    const preserve = autoSrcPreserveRef.current?.checked ?? false
                    await addAutoSource({ type, file, autoRun: mode, contactsOptions: { overwrite, preserveEdits: preserve } })
                    e.currentTarget.value = ''
                  }}
                  className="block text-sm"
                />
              </div>
              {autoSources.length === 0 ? (
                <div className="space-y-2">
                  <div className="text-muted-foreground">No saved sources.</div>
                  <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                    <strong>API-Style Auto-Import:</strong> The system treats data loading as if it's an API that's always available. 
                    Auto-import will retry automatically and gracefully handle temporary unavailability.
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {autoSources.map(s => (
                    <div key={s.id} className="flex items-center justify-between border rounded p-2">
                      <div className="truncate">
                        <div className="font-medium truncate">{s.name} <span className="text-muted-foreground">({s.type})</span></div>
                        <div className="text-xs text-muted-foreground">{(s.size/1024).toFixed(1)} KB • Auto: {s.autoRun} {s.lastRunAt ? `• Last run ${new Date(s.lastRunAt).toLocaleString()}` : ''}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="h-8 px-3 rounded-md border text-sm" onClick={()=>runAutoSourceNow(s.id)}>Run</button>
                        <select className="h-8 px-2 rounded-md border text-sm" value={s.autoRun} onChange={(e)=>updateAutoSource(s.id, { autoRun: e.target.value as any })}>
                          <option value="off">Off</option>
                          <option value="whenEmpty">When Empty</option>
                          <option value="always">Always</option>
                        </select>
                        <button className="h-8 px-3 rounded-md border text-sm text-destructive" onClick={()=>deleteAutoSource(s.id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-x-2">
          <Button onClick={handleExport} disabled={!currentCompany}>
            Export Company State as JSON
          </Button>
          <Button onClick={exportContactsCsv} disabled={!currentCompany} variant="outline">
            Export Contacts CSV
          </Button>
          <Button asChild variant="ghost">
            <Link to="/analytics" className="inline-flex items-center gap-2">
              <BarChartBig className="h-4 w-4" />
              Open Analytics
            </Link>
          </Button>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
