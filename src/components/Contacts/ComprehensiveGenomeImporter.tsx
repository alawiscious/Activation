import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Progress } from '../ui/Progress'
import { Badge } from '../ui/Badge'
import { 
  Database, 
  Users, 
  Download, 
  CheckCircle,
  AlertTriangle,
  Zap,
  Plus,
  RefreshCw
} from 'lucide-react'
import { Contact } from '../../types/domain'
import { importAllGenomeContacts, type GenomeImportResult } from '../../lib/genomeContactImporter'

interface ComprehensiveGenomeImporterProps {
  allContacts: Contact[]
  onContactsUpdated: (contacts: Contact[]) => void
}

export function ComprehensiveGenomeImporter({ allContacts, onContactsUpdated }: ComprehensiveGenomeImporterProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<GenomeImportResult | null>(null)
  const [progress, setProgress] = useState(0)

  const handleImportAll = useCallback(async () => {
    try {
      setIsImporting(true)
      setProgress(0)
      setImportResult(null)

      console.log('🚀 Starting comprehensive Genome import...')
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 2, 90))
      }, 100)

      // Import all Genome contacts
      const result = await importAllGenomeContacts(allContacts)
      
      clearInterval(progressInterval)
      setProgress(100)
      setImportResult(result)
      
      // Update contacts in the app
      onContactsUpdated(result.contacts)
      
      console.log('✅ Comprehensive Genome import completed:', result)
      
    } catch (error) {
      console.error('❌ Genome import failed:', error)
      setImportResult({
        totalGenomeContacts: 0,
        existingContactsUpdated: 0,
        newContactsCreated: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        contacts: []
      })
    } finally {
      setIsImporting(false)
    }
  }, [allContacts, onContactsUpdated])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'error': return 'bg-red-100 text-red-800'
      case 'importing': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'error': return <AlertTriangle className="h-4 w-4" />
      case 'importing': return <RefreshCw className="h-4 w-4 animate-spin" />
      default: return <Database className="h-4 w-4" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-purple-600" />
          Comprehensive Genome Import
          <Badge className="bg-purple-100 text-purple-800">
            All Contacts
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Description */}
          <div className="text-sm text-gray-600">
            <p>Import ALL contacts from Genome API, including:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Enrich existing contacts with Genome data</li>
              <li>Create new contacts for Genome contacts not in your system</li>
              <li>Normalize all fields and add enrichment data</li>
              <li>Include disposition, influence level, and activity metrics</li>
            </ul>
          </div>

          {/* Current Stats */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{allContacts.length}</div>
              <div className="text-sm text-gray-600">Current Contacts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">5,000+</div>
              <div className="text-sm text-gray-600">Genome Contacts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">All</div>
              <div className="text-sm text-gray-600">Companies</div>
            </div>
          </div>

          {/* Progress */}
          {isImporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Importing from Genome API...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Results */}
          {importResult && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {getStatusIcon(importResult.errors.length > 0 ? 'error' : 'completed')}
                <span className="font-medium">
                  {importResult.errors.length > 0 ? 'Import Completed with Errors' : 'Import Completed Successfully'}
                </span>
                <Badge className={getStatusColor(importResult.errors.length > 0 ? 'error' : 'completed')}>
                  {importResult.errors.length > 0 ? 'ERRORS' : 'SUCCESS'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">{importResult.existingContactsUpdated}</div>
                  <div className="text-sm text-gray-600">Updated</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">{importResult.newContactsCreated}</div>
                  <div className="text-sm text-gray-600">New Contacts</div>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm">
                  <strong>Errors ({importResult.errors.length}):</strong>
                  <ul className="mt-1 space-y-1">
                    {importResult.errors.slice(0, 5).map((error, index) => (
                      <li key={index} className="text-red-700">• {error}</li>
                    ))}
                    {importResult.errors.length > 5 && (
                      <li className="text-red-700">• ... and {importResult.errors.length - 5} more errors</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-2">
            <Button
              onClick={handleImportAll}
              disabled={isImporting}
              className="flex-1"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Import All Genome Contacts
                </>
              )}
            </Button>
          </div>

          {/* Info */}
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span>Fetches all contacts from Genome API (5,000+ contacts)</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Enriches existing contacts and creates new ones</span>
            </div>
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Adds all enrichment fields and Genome-specific data</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
