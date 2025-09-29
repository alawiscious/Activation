import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TrendingUp } from 'lucide-react'
import type { RevenueChartData } from '@/types/domain'

interface BrandRevenueChartProps {
  data: RevenueChartData[]
  brandName: string
  className?: string
}

export function BrandRevenueChart({ data, brandName, className }: BrandRevenueChartProps) {
  const [chartType, setChartType] = useState<'line' | 'area'>('line')
  const [showUS, setShowUS] = useState(true)
  const [showWW, setShowWW] = useState(true)

  // Format data for Recharts
  const chartData = data.map(item => ({
    year: item.year.toString(),
    ww: item.ww,
    us: item.us,
    wwFormatted: item.ww ? `$${(item.ww / 1000000).toFixed(1)}M` : 'N/A',
    usFormatted: item.us ? `$${(item.us / 1000000).toFixed(1)}M` : 'N/A',
  }))

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A'
    return `$${(value / 1000000).toFixed(1)}M`
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{`Year: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.dataKey.toUpperCase()}: ${formatCurrency(entry.value)}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            No revenue data available for {brandName}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue Chart - {brandName}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={chartType === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('line')}
            >
              Line
            </Button>
            <Button
              variant={chartType === 'area' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('area')}
            >
              Area
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Toggle buttons for data series */}
        <div className="flex gap-4 mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showWW}
              onChange={(e) => setShowWW(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Worldwide Sales</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showUS}
              onChange={(e) => setShowUS(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">US Sales</span>
          </label>
        </div>

        {/* Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="year" 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `$${value / 1000000}M`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {showWW && (
                  <Line
                    type="monotone"
                    dataKey="ww"
                    stroke="#8884d8"
                    strokeWidth={2}
                    name="Worldwide Sales"
                    dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                )}
                {showUS && (
                  <Line
                    type="monotone"
                    dataKey="us"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    name="US Sales"
                    dot={{ fill: '#82ca9d', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                )}
              </LineChart>
            ) : (
              <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="year" 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `$${value / 1000000}M`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {showWW && (
                  <Area
                    type="monotone"
                    dataKey="ww"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                    name="Worldwide Sales"
                  />
                )}
                {showUS && (
                  <Area
                    type="monotone"
                    dataKey="us"
                    stackId="2"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    fillOpacity={0.6}
                    name="US Sales"
                  />
                )}
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Summary stats */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total WW Revenue</p>
            <p className="text-lg font-semibold">
              {formatCurrency(data.reduce((sum, item) => sum + (item.ww || 0), 0))}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total US Revenue</p>
            <p className="text-lg font-semibold">
              {formatCurrency(data.reduce((sum, item) => sum + (item.us || 0), 0))}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
