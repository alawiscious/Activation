import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Progress } from '../ui/Progress'
import { Badge } from '../ui/Badge'
import { 
  Play, 
  Square, 
  Database, 
  Clock, 
  Users, 
  Activity,
  CheckCircle,
  AlertTriangle,
  Settings,
  Zap
} from 'lucide-react'
import { Contact } from '../../types/domain'
import { 
  automatedEnrichment, 
  startMegaEnrichment, 
  isEnrichmentRunning, 
  getCurrentEnrichmentJob,
  type EnrichmentJob,
  type EnrichmentConfig
} from '../../lib/automatedEnrichment'

interface AutomatedEnrichmentManagerProps {
  contacts: Contact[]
  onEnrichmentComplete?: (job: EnrichmentJob) => void
}

export function AutomatedEnrichmentManager({ contacts, onEnrichmentComplete }: AutomatedEnrichmentManagerProps) {
  const [currentJob, setCurrentJob] = useState<EnrichmentJob | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [config, setConfig] = useState<EnrichmentConfig>({
    batchSize: 50,
    delayBetweenBatches: 2000,
    maxRetries: 3,
    retryDelay: 5000,
    autoSave: true,
    autoSaveInterval: 100
  })
  const [showConfig, setShowConfig] = useState(false)

  // Update job status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const job = getCurrentEnrichmentJob()
      if (job) {
        setCurrentJob(job)
        setIsRunning(isEnrichmentRunning())
        
        if (job.status === 'completed' && onEnrichmentComplete) {
          onEnrichmentComplete(job)
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [onEnrichmentComplete])

  const handleStartEnrichment = useCallback(async () => {
    try {
      setIsRunning(true)
      automatedEnrichment.updateConfig(config)
      
      const job = await startMegaEnrichment(contacts, (updatedJob) => {
        setCurrentJob(updatedJob)
      })
      
      setCurrentJob(job)
      setIsRunning(false)
      
      if (job.status === 'completed') {
        alert(`✅ Mega enrichment completed! Processed ${job.processedContacts} contacts.`)
      } else if (job.status === 'failed') {
        alert(`❌ Enrichment failed: ${job.error}`)
      }
      
    } catch (error) {
      console.error('Enrichment error:', error)
      alert(`❌ Enrichment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsRunning(false)
    }
  }, [contacts, config, onEnrichmentComplete])

  const handleStopEnrichment = useCallback(async () => {
    try {
      await automatedEnrichment.stopEnrichment()
      setIsRunning(false)
      alert('🛑 Enrichment stopped')
    } catch (error) {
      console.error('Error stopping enrichment:', error)
    }
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'running': return 'bg-blue-100 text-blue-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'running': return <Activity className="h-4 w-4 animate-pulse" />
      case 'failed': return <AlertTriangle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      default: return <Database className="h-4 w-4" />
    }
  }

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : new Date()
    const diffMs = end.getTime() - start.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffSecs = Math.floor((diffMs % 60000) / 1000)
    return `${diffMins}m ${diffSecs}s`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-600" />
          Automated Mega Enrichment
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowConfig(!showConfig)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Configuration Panel */}
          {showConfig && (
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <h4 className="font-semibold">Configuration</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Batch Size</label>
                  <input
                    type="number"
                    value={config.batchSize}
                    onChange={(e) => setConfig(prev => ({ ...prev, batchSize: parseInt(e.target.value) }))}
                    className="w-full px-2 py-1 border rounded text-sm"
                    min="1"
                    max="100"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Delay (ms)</label>
                  <input
                    type="number"
                    value={config.delayBetweenBatches}
                    onChange={(e) => setConfig(prev => ({ ...prev, delayBetweenBatches: parseInt(e.target.value) }))}
                    className="w-full px-2 py-1 border rounded text-sm"
                    min="0"
                    max="10000"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Retries</label>
                  <input
                    type="number"
                    value={config.maxRetries}
                    onChange={(e) => setConfig(prev => ({ ...prev, maxRetries: parseInt(e.target.value) }))}
                    className="w-full px-2 py-1 border rounded text-sm"
                    min="0"
                    max="10"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Auto-save Interval</label>
                  <input
                    type="number"
                    value={config.autoSaveInterval}
                    onChange={(e) => setConfig(prev => ({ ...prev, autoSaveInterval: parseInt(e.target.value) }))}
                    className="w-full px-2 py-1 border rounded text-sm"
                    min="10"
                    max="1000"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Job Status */}
          {currentJob && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(currentJob.status)}
                  <span className="font-medium">Job {currentJob.id}</span>
                  <Badge className={getStatusColor(currentJob.status)}>
                    {currentJob.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  {formatDuration(currentJob.startTime, currentJob.endTime)}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{currentJob.processedContacts} / {currentJob.totalContacts}</span>
                </div>
                <Progress value={currentJob.progress} className="w-full" />
                <div className="text-xs text-gray-500 text-center">
                  {currentJob.progress.toFixed(1)}%
                </div>
              </div>

              {currentJob.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                  <strong>Error:</strong> {currentJob.error}
                </div>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-2">
            <Button
              onClick={handleStartEnrichment}
              disabled={isRunning || contacts.length === 0}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              {isRunning ? 'Running...' : `Start Mega Enrichment (${contacts.length} contacts)`}
            </Button>
            
            {isRunning && (
              <Button
                onClick={handleStopEnrichment}
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <Square className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Info */}
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{contacts.length} contacts ready for enrichment</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span>Results will be stored remotely and available to all users</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Estimated time: {Math.ceil(contacts.length / config.batchSize * config.delayBetweenBatches / 1000 / 60)} minutes</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
