import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Bug, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react'

const GENOME_BASE_URL = 'https://genome.klick.com/y/api'
const AUTH_TOKEN = 'DA0EE33B-CFD1-4B64-AF39-C31B58F71359'

interface ApiTestResult {
  endpoint: string
  status: 'success' | 'error' | 'pending'
  response?: any
  error?: string
  statusCode?: number
}

export default function GenomeApiDebugger() {
  const [testResults, setTestResults] = useState<ApiTestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const testEndpoints = [
    '/client_insights/contact/functional_groups',
    '/client_insights/contact/job_functions', 
    '/client_insights/contact/job_levels',
    '/client_insights/client/email_sentiment_trend',
    '/client_insights/competitors/companies/search',
    '/client_insights/competitors/contacts/search'
  ]

  const testApiEndpoint = async (endpoint: string): Promise<ApiTestResult> => {
    console.log(`🔵 Testing Genome API: ${endpoint}`)
    
    try {
      const response = await fetch(`${GENOME_BASE_URL}${endpoint}`, {
        method: endpoint.includes('search') ? 'POST' : 'GET',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: endpoint.includes('search') ? JSON.stringify({ page_num: 1, page_size: 10 }) : undefined
      })

      console.log(`📡 Response status: ${response.status} for ${endpoint}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ API Error for ${endpoint}:`, errorText)
        return {
          endpoint,
          status: 'error',
          error: `${response.status} - ${response.statusText}: ${errorText}`,
          statusCode: response.status
        }
      }

      const data = await response.json()
      console.log(`✅ API Success for ${endpoint}:`, data)
      
      return {
        endpoint,
        status: 'success',
        response: data,
        statusCode: response.status
      }
    } catch (error) {
      console.error(`💥 Network Error for ${endpoint}:`, error)
      return {
        endpoint,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setTestResults([])
    
    console.log('🚀 Starting Genome API Debug Tests...')
    console.log(`🔑 Using token: [REDACTED]`)
    console.log(`🌐 Base URL: ${GENOME_BASE_URL}`)

    const results: ApiTestResult[] = []
    
    for (const endpoint of testEndpoints) {
      const result = await testApiEndpoint(endpoint)
      results.push(result)
      setTestResults([...results])
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    setIsRunning(false)
    console.log('🏁 All tests completed:', results)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'pending':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800">Pending</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Unknown</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Bug className="h-5 w-5 text-orange-600" />
            <span>Genome API Debugger</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Button>
            <Button
              onClick={runAllTests}
              disabled={isRunning}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isRunning ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Bug className="h-4 w-4 mr-2" />
              )}
              {isRunning ? 'Testing...' : 'Run API Tests'}
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Test Genome API endpoints to diagnose connection and authentication issues
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* API Configuration */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">API Configuration</h4>
            <div className="space-y-1 text-sm">
              <div><span className="font-medium">Base URL:</span> {GENOME_BASE_URL}</div>
              <div><span className="font-medium">Auth Token:</span> {AUTH_TOKEN.substring(0, 8)}...{AUTH_TOKEN.substring(-4)}</div>
              <div><span className="font-medium">Test Endpoints:</span> {testEndpoints.length}</div>
            </div>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Test Results</h4>
              {testResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(result.status)}
                      <span className="font-medium text-sm">{result.endpoint}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {result.statusCode && (
                        <Badge variant="outline">{result.statusCode}</Badge>
                      )}
                      {getStatusBadge(result.status)}
                    </div>
                  </div>
                  
                  {result.error && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      <strong>Error:</strong> {result.error}
                    </div>
                  )}
                  
                  {showDetails && result.response && (
                    <div className="mt-2">
                      <details className="text-sm">
                        <summary className="cursor-pointer font-medium text-gray-700">
                          Response Data
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                          {JSON.stringify(result.response, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          {testResults.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Summary</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {testResults.filter(r => r.status === 'success').length}
                  </div>
                  <div className="text-green-700">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {testResults.filter(r => r.status === 'error').length}
                  </div>
                  <div className="text-red-700">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {testResults.filter(r => r.status === 'pending').length}
                  </div>
                  <div className="text-blue-700">Pending</div>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-semibold text-yellow-900 mb-2">Debug Instructions</h4>
            <div className="text-sm text-yellow-800 space-y-1">
              <p>1. Click "Run API Tests" to test all Genome API endpoints</p>
              <p>2. Check browser console for detailed logs</p>
              <p>3. Look for authentication errors (401, 403)</p>
              <p>4. Check for network errors or CORS issues</p>
              <p>5. Verify API token is valid and not expired</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
