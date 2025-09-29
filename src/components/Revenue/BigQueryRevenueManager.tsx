import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  Database, 
  Download, 
  RefreshCw, 
  Search,
  Loader2
} from 'lucide-react'
import { bigQueryRevenueService, type BigQueryRevenueData, type RevenueQueryOptions } from '@/lib/bigQueryRevenue'
import type { Brand } from '@/types/domain'

interface BigQueryRevenueManagerProps {
  brands?: Brand[]
  onRevenueDataLoaded?: (data: BigQueryRevenueData[]) => void
  className?: string
}

export function BigQueryRevenueManager({ onRevenueDataLoaded, className }: BigQueryRevenueManagerProps) {
  const [loading, setLoading] = useState(false)
  const [revenueData, setRevenueData] = useState<BigQueryRevenueData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedQuarter, setSelectedQuarter] = useState<number | null>(null)

  // Get unique years from available data
  const availableYears = useMemo(() => {
    const years = new Set<number>()
    revenueData.forEach(entry => years.add(entry.year))
    return Array.from(years).sort((a, b) => b - a)
  }, [revenueData])

  // Filter revenue data based on search and filters
  const filteredData = useMemo(() => {
    let filtered = revenueData

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(entry =>
        entry.brand_name.toLowerCase().includes(term) ||
        entry.company_name.toLowerCase().includes(term) ||
        entry.therapeutic_area.toLowerCase().includes(term) ||
        entry.indication.toLowerCase().includes(term)
      )
    }

    if (selectedYear) {
      filtered = filtered.filter(entry => entry.year === selectedYear)
    }

    if (selectedQuarter) {
      filtered = filtered.filter(entry => entry.quarter === selectedQuarter)
    }

    return filtered
  }, [revenueData, searchTerm, selectedYear, selectedQuarter])

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (filteredData.length === 0) return null

    const totalWW = filteredData.reduce((sum, entry) => sum + entry.worldwide_revenue, 0)
    const totalUS = filteredData.reduce((sum, entry) => sum + entry.us_revenue, 0)
    const uniqueBrands = new Set(filteredData.map(entry => entry.brand_name)).size
    const uniqueCompanies = new Set(filteredData.map(entry => entry.company_name)).size

    return {
      totalWW,
      totalUS,
      uniqueBrands,
      uniqueCompanies,
      recordCount: filteredData.length
    }
  }, [filteredData])

  const handleFetchRevenue = async (options: RevenueQueryOptions = {}) => {
    setLoading(true)
    setError(null)

    try {
      const data = await bigQueryRevenueService.fetchRevenueData(options)
      setRevenueData(data)
      onRevenueDataLoaded?.(data)
    } catch (err) {
      setError('Failed to fetch revenue data from BigQuery')
      console.error('BigQuery revenue fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFetchLatestRevenue = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await bigQueryRevenueService.getLatestRevenue()
      setRevenueData(data)
      onRevenueDataLoaded?.(data)
    } catch (err) {
      setError('Failed to fetch latest revenue data')
      console.error('BigQuery latest revenue fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleExportData = () => {
    if (filteredData.length === 0) return

    const csvContent = [
      'Brand Name,Company Name,Therapeutic Area,Indication,Year,Quarter,Worldwide Revenue,US Revenue,Currency,Data Source,Last Updated',
      ...filteredData.map(entry => [
        entry.brand_name,
        entry.company_name,
        entry.therapeutic_area,
        entry.indication,
        entry.year,
        entry.quarter || '',
        entry.worldwide_revenue,
        entry.us_revenue,
        entry.revenue_currency,
        entry.data_source,
        entry.last_updated
      ].map(field => `"${field}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bigquery-revenue-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            BigQuery Revenue Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search brands, companies, therapeutic areas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="border rounded px-3 py-2 text-sm"
              >
                <option value="">All Years</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>

              <select
                value={selectedQuarter || ''}
                onChange={(e) => setSelectedQuarter(e.target.value ? parseInt(e.target.value) : null)}
                className="border rounded px-3 py-2 text-sm"
              >
                <option value="">All Quarters</option>
                <option value="1">Q1</option>
                <option value="2">Q2</option>
                <option value="3">Q3</option>
                <option value="4">Q4</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => handleFetchRevenue()}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              Fetch All Revenue Data
            </Button>

            <Button
              onClick={handleFetchLatestRevenue}
              disabled={loading}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Latest Only
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          {/* Summary Statistics */}
          {summaryStats && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-blue-900 mb-3">Revenue Summary</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {formatCurrency(summaryStats.totalWW)}
                  </div>
                  <div className="text-xs text-blue-700">Total WW Revenue</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {formatCurrency(summaryStats.totalUS)}
                  </div>
                  <div className="text-xs text-blue-700">Total US Revenue</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {summaryStats.uniqueBrands}
                  </div>
                  <div className="text-xs text-blue-700">Unique Brands</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {summaryStats.recordCount}
                  </div>
                  <div className="text-xs text-blue-700">Records</div>
                </div>
              </div>
            </div>
          )}

          {/* Revenue Data Table */}
          {filteredData.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  Revenue Data ({filteredData.length} records)
                </div>
                <Button onClick={handleExportData} size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>

              <div className="max-h-96 overflow-y-auto border rounded">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left p-2 font-medium">Brand</th>
                      <th className="text-left p-2 font-medium">Company</th>
                      <th className="text-left p-2 font-medium">TA</th>
                      <th className="text-left p-2 font-medium">Year/Q</th>
                      <th className="text-right p-2 font-medium">WW Revenue</th>
                      <th className="text-right p-2 font-medium">US Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((entry, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2">{entry.brand_name}</td>
                        <td className="p-2">{entry.company_name}</td>
                        <td className="p-2">{entry.therapeutic_area}</td>
                        <td className="p-2">
                          {entry.year}
                          {entry.quarter && ` Q${entry.quarter}`}
                        </td>
                        <td className="p-2 text-right font-medium">
                          {formatCurrency(entry.worldwide_revenue)}
                        </td>
                        <td className="p-2 text-right font-medium">
                          {formatCurrency(entry.us_revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Cache Stats */}
          <div className="text-xs text-muted-foreground">
            Cache: {bigQueryRevenueService.getCacheStats().size} entries
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
