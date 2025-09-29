import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { usePharmaVisualPivotStore } from '@/data/store'
import { 
  FeeToRevenueRatio, 
  ServiceFeeAnalysis, 
  ProductStage, 
  ServiceCategory, 
  SERVICE_CATEGORIES 
} from '@/types/domain'
import { 
  Calculator, 
  Plus, 
  Trash2, 
  TrendingUp, 
  DollarSign, 
  BarChart3,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { SectionButtons } from '@/components/Shared/SectionButtons'
import { Navigation } from '@/components/Shared/Navigation'

const PRODUCT_STAGES: { value: ProductStage; label: string; description: string }[] = [
  { value: 'PRE_LAUNCH_2Y', label: 'Pre-Launch (2Y)', description: '2+ years before launch' },
  { value: 'PRE_LAUNCH_1Y', label: 'Pre-Launch (1Y)', description: '1 year before launch' },
  { value: 'LAUNCH', label: 'Launch', description: 'Launch year' },
  { value: 'POST_LAUNCH', label: 'Post-Launch', description: '1-5 years post-launch' },
  { value: 'PRE_LOE', label: 'Pre-LOE', description: 'Approaching loss of exclusivity' },
  { value: 'LOE', label: 'LOE', description: 'Loss of exclusivity' },
]

// Interactive Ratio Graph Component
function InteractiveRatioGraph() {
  const { feeToRevenueRatios, addFeeToRevenueRatio, updateFeeToRevenueRatio, removeFeeToRevenueRatio } = usePharmaVisualPivotStore()
  const svgRef = useRef<SVGSVGElement>(null)
  const [dragging, setDragging] = useState<{ service: ServiceCategory; stage: ProductStage } | null>(null)

  // Stage positions (x-axis)
  const stagePositions = useMemo(() => {
    const positions: Record<ProductStage, number> = {
      'PRE_LAUNCH_2Y': 50,
      'PRE_LAUNCH_1Y': 150,
      'LAUNCH': 250,
      'POST_LAUNCH': 350,
      'PRE_LOE': 450,
      'LOE': 550,
    }
    return positions
  }, [])

  // Get current ratios for each service and stage
  const serviceRatios = useMemo(() => {
    const ratios: Record<ServiceCategory, Record<ProductStage, number>> = {} as any
    
    SERVICE_CATEGORIES.forEach(service => {
      ratios[service] = {} as any
      PRODUCT_STAGES.forEach(({ value: stage }) => {
        const ratio = feeToRevenueRatios.find(r => r.serviceCategory === service && r.stage === stage)
        ratios[service][stage] = ratio ? ratio.ratio * 100 : 5 // Default to 5% if not set
      })
    })
    
    return ratios
  }, [feeToRevenueRatios])

  // Handle mouse down on a node
  const handleMouseDown = useCallback((service: ServiceCategory, stage: ProductStage, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    console.log('Mouse down on:', service, stage)
    setDragging({ service, stage })
  }, [])

  // Handle mouse move
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!dragging || !svgRef.current) return

    event.preventDefault()
    const rect = svgRef.current.getBoundingClientRect()
    const y = event.clientY - rect.top
    
    // Calculate percentage based on SVG coordinate system (0-400 height)
    // Invert Y coordinate since SVG origin is top-left but we want bottom-left for percentages
    const percentage = Math.max(0, Math.min(10, ((400 - y) / 400) * 10))
    
    console.log('Mouse move:', { y, percentage, rect: rect.height })
    
    // Update the ratio (convert percentage back to decimal)
    const newRatio = percentage / 100
    
    // Find existing ratio for this service and stage
    const existingRatio = feeToRevenueRatios.find(r => 
      r.serviceCategory === dragging.service && r.stage === dragging.stage
    )
    
    if (existingRatio) {
      // Update existing ratio
      updateFeeToRevenueRatio(existingRatio.id, {
        ratio: newRatio,
        description: `Interactive adjustment for ${dragging.service} at ${PRODUCT_STAGES.find(s => s.value === dragging.stage)?.label}`
      })
    } else {
      // Create new ratio only if none exists
      addFeeToRevenueRatio({
        serviceCategory: dragging.service,
        stage: dragging.stage,
        ratio: newRatio,
        description: `Interactive adjustment for ${dragging.service} at ${PRODUCT_STAGES.find(s => s.value === dragging.stage)?.label}`
      })
    }
  }, [dragging, addFeeToRevenueRatio, updateFeeToRevenueRatio, feeToRevenueRatios])

  // Handle mouse up
  const handleMouseUp = useCallback((event: MouseEvent) => {
    event.preventDefault()
    console.log('Mouse up')
    setDragging(null)
  }, [])

  // Add event listeners
  useEffect(() => {
    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragging, handleMouseMove, handleMouseUp])

  // Clean up duplicate ratios (keep only the most recent one for each service/stage combination)
  const cleanupDuplicateRatios = useCallback(() => {
    const seen = new Set<string>()
    const duplicates: string[] = []
    
    // Find duplicates (keep the first occurrence, mark others for removal)
    feeToRevenueRatios.forEach(ratio => {
      const key = `${ratio.serviceCategory}-${ratio.stage}`
      if (seen.has(key)) {
        duplicates.push(ratio.id)
      } else {
        seen.add(key)
      }
    })
    
    // Remove duplicates
    duplicates.forEach(id => removeFeeToRevenueRatio(id))
    
    if (duplicates.length > 0) {
      console.log(`Cleaned up ${duplicates.length} duplicate ratios`)
    }
  }, [feeToRevenueRatios, removeFeeToRevenueRatio])

  // Colors for different services
  const serviceColors: Record<ServiceCategory, string> = {
    'AOR': '#3B82F6', // Blue
    'DAOR': '#10B981', // Green
    'Market Access': '#F59E0B', // Yellow
    'MedComms': '#EF4444', // Red
    'Media': '#8B5CF6', // Purple
    'Tech': '#06B6D4', // Cyan
    'Consulting': '#F97316', // Orange
  }

  // Run cleanup on component mount
  useEffect(() => {
    cleanupDuplicateRatios()
  }, [cleanupDuplicateRatios])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Drag any node up or down to adjust the fee-to-revenue percentage for that service and stage.
          Changes are automatically saved and will affect all calculations.
        </div>
        <Button
          onClick={cleanupDuplicateRatios}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          Clean Duplicates
        </Button>
      </div>
      
      <div className="relative">
        {dragging && (
          <div className="absolute top-2 left-2 bg-blue-100 border border-blue-300 rounded px-2 py-1 text-xs font-medium text-blue-700 z-10">
            Dragging: {dragging.service} - {PRODUCT_STAGES.find(s => s.value === dragging.stage)?.label}
          </div>
        )}
        <svg
          ref={svgRef}
          width="100%"
          height="400"
          viewBox="0 0 600 400"
          className="border rounded-lg bg-gray-50"
          style={{ 
            userSelect: 'none',
            cursor: dragging ? 'grabbing' : 'default'
          }}
        >
          {/* Grid lines */}
          {[0, 2, 4, 6, 8, 10].map(percentage => (
            <g key={percentage}>
              <line
                x1="0"
                y1={400 - (percentage / 10) * 360}
                x2="600"
                y2={400 - (percentage / 10) * 360}
                stroke="#E5E7EB"
                strokeWidth="1"
              />
              <text
                x="10"
                y={400 - (percentage / 10) * 360 + 5}
                fontSize="12"
                fill="#6B7280"
              >
                {percentage}%
              </text>
            </g>
          ))}

          {/* Stage labels */}
          {PRODUCT_STAGES.map(({ value: stage, label }) => (
            <text
              key={stage}
              x={stagePositions[stage]}
              y="390"
              fontSize="12"
              fill="#374151"
              textAnchor="middle"
            >
              {label}
            </text>
          ))}

          {/* Service lines and nodes */}
          {SERVICE_CATEGORIES.map((service) => {
            const color = serviceColors[service]
            const points = PRODUCT_STAGES.map(({ value: stage }) => {
              const x = stagePositions[stage]
              const y = 400 - (serviceRatios[service][stage] / 10) * 360
              return `${x},${y}`
            }).join(' ')

            return (
              <g key={service}>
                {/* Line */}
                <polyline
                  points={points}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  opacity="0.7"
                />
                
                {/* Nodes */}
                {PRODUCT_STAGES.map(({ value: stage }) => {
                  const x = stagePositions[stage]
                  const y = 400 - (serviceRatios[service][stage] / 10) * 360
                  
                  return (
                    <circle
                      key={`${service}-${stage}`}
                      cx={x}
                      cy={y}
                      r={dragging?.service === service && dragging?.stage === stage ? "10" : "8"}
                      fill={color}
                      stroke="white"
                      strokeWidth={dragging?.service === service && dragging?.stage === stage ? "3" : "2"}
                      className="cursor-grab active:cursor-grabbing transition-all duration-150"
                      style={{ 
                        filter: dragging?.service === service && dragging?.stage === stage ? 'drop-shadow(0 0 8px rgba(0,0,0,0.3))' : 'none'
                      }}
                      onMouseDown={(e) => handleMouseDown(service, stage, e)}
                    />
                  )
                })}
              </g>
            )
          })}
        </svg>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4">
          {SERVICE_CATEGORIES.map(service => (
            <div key={service} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: serviceColors[service] }}
              />
              <span className="text-sm font-medium">{service}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function FeeToRevenueRatios() {
  const {
    feeToRevenueRatios,
    serviceFeeAnalyses,
    addFeeToRevenueRatio,
    removeFeeToRevenueRatio,
    calculateServiceFeeAnalysis,
    companies,
  } = usePharmaVisualPivotStore()

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingRatio, setEditingRatio] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState<string>('')

  const [newRatio, setNewRatio] = useState<Partial<FeeToRevenueRatio>>({
    serviceCategory: undefined,
    stage: undefined,
    ratio: 0.05,
    description: '',
  })

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalAnalyses = serviceFeeAnalyses.length
    const totalEstimatedFees = serviceFeeAnalyses.reduce((sum, analysis) => sum + analysis.estimatedFee, 0)
    const totalRevenue = serviceFeeAnalyses.reduce((sum, analysis) => sum + analysis.currentRevenue, 0)
    const avgRatio = totalRevenue > 0 ? (totalEstimatedFees / totalRevenue) * 100 : 0
    
    const highConfidenceAnalyses = serviceFeeAnalyses.filter(a => a.confidence === 'HIGH').length
    const confidenceRate = totalAnalyses > 0 ? (highConfidenceAnalyses / totalAnalyses) * 100 : 0

    return {
      totalAnalyses,
      totalEstimatedFees,
      totalRevenue,
      avgRatio,
      confidenceRate,
      highConfidenceAnalyses,
    }
  }, [serviceFeeAnalyses])

  // Single imaginary Oncology brand for demonstration
  const brandsWithAnalyses = useMemo(() => {
    const imaginaryBrand = {
      id: 'imaginary-oncology-brand',
      name: 'OncoMax',
      companyName: 'PharmaCorp',
      therapeuticArea: 'Oncology',
      phase: 'Post-Launch',
    }

    // Generate analyses for all service categories with $1B revenue
    const revenue = 1_000_000_000 // $1 billion
    const analyses: ServiceFeeAnalysis[] = SERVICE_CATEGORIES.map(service => {
      const ratio = feeToRevenueRatios.find(r => r.serviceCategory === service && r.stage === 'POST_LAUNCH')?.ratio || 0.05
      const estimatedFee = revenue * ratio
      
      return {
        id: `imaginary-${service}`,
        brandId: imaginaryBrand.id,
        serviceCategory: service,
        stage: 'POST_LAUNCH',
        currentRevenue: revenue,
        feeToRevenueRatio: ratio,
        estimatedFee,
        confidence: 'HIGH' as const,
        createdAt: new Date().toISOString(),
        lastCalculated: new Date(),
      }
    })

    const totalEstimatedFees = analyses.reduce((sum, a) => sum + a.estimatedFee, 0)
    
    return [{
      brand: imaginaryBrand,
      analyses,
      totalEstimatedFees,
      totalRevenue: revenue,
    }]
  }, [feeToRevenueRatios])

  const handleAddRatio = () => {
    if (!newRatio.serviceCategory || !newRatio.stage || newRatio.ratio === undefined) return

    addFeeToRevenueRatio({
      serviceCategory: newRatio.serviceCategory as ServiceCategory,
      stage: newRatio.stage as ProductStage,
      ratio: newRatio.ratio,
      description: newRatio.description,
    })

    setNewRatio({
      serviceCategory: undefined,
      stage: undefined,
      ratio: 0.05,
      description: '',
    })
    setShowAddForm(false)
  }

  const handleStartEdit = (ratioId: string, currentValue: number) => {
    setEditingRatio(ratioId)
    setEditingValue((currentValue * 100).toFixed(1))
  }

  const handleSaveEdit = (ratioId: string) => {
    const newRatioValue = parseFloat(editingValue) / 100
    if (!isNaN(newRatioValue) && newRatioValue >= 0 && newRatioValue <= 1) {
      // Update the ratio in the store
      const ratio = feeToRevenueRatios.find(r => r.id === ratioId)
      if (ratio) {
        // Remove old ratio and add new one with updated value
        removeFeeToRevenueRatio(ratioId)
        addFeeToRevenueRatio({
          serviceCategory: ratio.serviceCategory,
          stage: ratio.stage,
          ratio: newRatioValue,
          description: ratio.description,
        })
      }
    }
    setEditingRatio(null)
    setEditingValue('')
  }

  const handleCancelEdit = () => {
    setEditingRatio(null)
    setEditingValue('')
  }

  // Reset all ratios to default values (5% for all combinations)
  const handleResetToDefaults = () => {
    // Remove all existing ratios
    feeToRevenueRatios.forEach(ratio => removeFeeToRevenueRatio(ratio.id))
    
    // Add default ratios for all service/stage combinations
    SERVICE_CATEGORIES.forEach(service => {
      PRODUCT_STAGES.forEach(({ value: stage }) => {
        addFeeToRevenueRatio({
          serviceCategory: service,
          stage: stage,
          ratio: 0.05, // 5% default
          description: `Default ratio for ${service} at ${PRODUCT_STAGES.find(s => s.value === stage)?.label}`
        })
      })
    })
  }

  const handleCalculateAllAnalyses = () => {
    Object.values(companies).forEach(company => {
      company.brands.forEach(brand => {
        SERVICE_CATEGORIES.forEach(serviceCategory => {
          const serviceRevenue = (brand.servicesRevenue || {})[serviceCategory] || 0
          if (serviceRevenue > 0) {
            try {
              calculateServiceFeeAnalysis(brand.id, serviceCategory, serviceRevenue)
            } catch (error) {
              console.warn(`Failed to calculate analysis for ${brand.name} - ${serviceCategory}:`, error)
            }
          }
        })
      })
    })
  }

  const getConfidenceColor = (confidence: 'HIGH' | 'MEDIUM' | 'LOW') => {
    switch (confidence) {
      case 'HIGH': return 'text-green-600 bg-green-50'
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50'
      case 'LOW': return 'text-red-600 bg-red-50'
    }
  }

  const getStageColor = (stage: ProductStage) => {
    switch (stage) {
      case 'PRE_LAUNCH_2Y': return 'bg-blue-100 text-blue-800'
      case 'PRE_LAUNCH_1Y': return 'bg-indigo-100 text-indigo-800'
      case 'LAUNCH': return 'bg-green-100 text-green-800'
      case 'POST_LAUNCH': return 'bg-emerald-100 text-emerald-800'
      case 'PRE_LOE': return 'bg-orange-100 text-orange-800'
      case 'LOE': return 'bg-red-100 text-red-800'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <Calculator className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-green-800 bg-clip-text text-transparent">
            Fee-to-Revenue Ratios
          </h1>
        </div>
        <p className="text-lg text-muted-foreground font-light">
          Manage service fee ratios and analyze revenue potential across product stages
        </p>
        </div>

        {/* Section Buttons */}
        <SectionButtons showCollapseTier={false} />

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-600">Total Analyses</p>
                <p className="text-2xl font-bold text-blue-900">{summaryStats.totalAnalyses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-600">Total Estimated Fees</p>
                <p className="text-2xl font-bold text-green-900">
                  ${(summaryStats.totalEstimatedFees / 1000000).toFixed(1)}M
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-600">Average Ratio</p>
                <p className="text-2xl font-bold text-purple-900">{summaryStats.avgRatio.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-500 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-600">High Confidence</p>
                <p className="text-2xl font-bold text-orange-900">{summaryStats.confidenceRate.toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sample Math Component */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Calculator className="h-4 w-4 text-white" />
            </div>
            Sample Fee Calculation
          </CardTitle>
          <p className="text-muted-foreground">
            Example calculation using actual brand revenue for the current year
          </p>
        </CardHeader>
        <CardContent>
          {(() => {
            // Find a sample brand with current year revenue
            const currentYear = new Date().getFullYear()
            let sampleBrand: { name: string; companyName: string } | null = null
            let sampleRevenue = 0
            
            // Look for a brand with revenue data for the current year or latest available year
            let availableYears: number[] = []
            Object.values(companies).forEach(company => {
              company.brands.forEach(brand => {
                const brandRevenue = company.revenueRows?.filter(r => r.brandId === brand.id) || []
                if (brandRevenue.length > 0) {
                  // Collect all available years
                  brandRevenue.forEach(r => availableYears.push(r.year))
                  
                  // First try current year, then try latest available year
                  let targetYear = currentYear
                  let revenueData = brandRevenue.find(r => r.year === targetYear)
                  
                  if (!revenueData) {
                    // If no current year data, use the latest available year
                    const latestYear = Math.max(...brandRevenue.map(r => r.year))
                    revenueData = brandRevenue.find(r => r.year === latestYear)
                    targetYear = latestYear
                  }
                  
                  if (revenueData) {
                    const wwRevenue = revenueData.wwSales || 0
                    console.log('🔍 Fee-to-Revenue: Found revenue data for', brand.name, 'in year', targetYear, ':', wwRevenue)
                    if (wwRevenue > sampleRevenue) {
                      sampleBrand = { name: brand.name, companyName: company.name }
                      sampleRevenue = wwRevenue
                    }
                  }
                }
              })
            })
            
            console.log('🔍 Fee-to-Revenue: Available years in data:', [...new Set(availableYears)].sort())
            console.log('🔍 Fee-to-Revenue: Current year:', currentYear)

            if (!sampleBrand || sampleRevenue === 0) {
              return (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No revenue data available for {currentYear}</p>
                  <p className="text-sm">Import revenue data to see sample calculations</p>
                </div>
              )
            }

            // Use AOR Launch ratio as example (8%)
            const sampleRatio = 0.08
            const estimatedFee = sampleRevenue * sampleRatio
            
            // Find the actual year used for this brand
            let actualYear = currentYear
            Object.values(companies).forEach(company => {
              company.brands.forEach(brand => {
                if (brand.name === sampleBrand?.name) {
                  const brandRevenue = company.revenueRows?.filter(r => r.brandId === brand.id) || []
                  if (brandRevenue.length > 0) {
                    let targetYear = currentYear
                    let revenueData = brandRevenue.find(r => r.year === targetYear)
                    if (!revenueData) {
                      actualYear = Math.max(...brandRevenue.map(r => r.year))
                    }
                  }
                }
              })
            })

            return (
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border">
                  <h4 className="font-semibold text-lg mb-3">{(sampleBrand as { name: string; companyName: string }).name}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Revenue ({actualYear})</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ${(sampleRevenue / 1000000).toFixed(1)}M
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">AOR Launch Ratio</p>
                      <p className="text-2xl font-bold text-green-600">
                        {(sampleRatio * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Estimated Fee</p>
                      <p className="text-2xl font-bold text-purple-600">
                        ${(estimatedFee / 1000000).toFixed(1)}M
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-mono">
                      <span className="font-semibold">Calculation:</span> ${(sampleRevenue / 1000000).toFixed(1)}M × {(sampleRatio * 100).toFixed(1)}% = ${(estimatedFee / 1000000).toFixed(1)}M
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Using {actualYear} revenue data (current year: {currentYear})
                    </p>
                  </div>
                </div>
              </div>
            )
          })()}
        </CardContent>
      </Card>

      {/* Derived Math Component */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            Global Average Calculation
          </CardTitle>
          <p className="text-muted-foreground">
            Weighted average based on all entered fee and revenue data
          </p>
        </CardHeader>
        <CardContent>
          {(() => {
            if (serviceFeeAnalyses.length === 0) {
              return (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No fee analyses available</p>
                  <p className="text-sm">Enter fee data to see global averages</p>
                </div>
              )
            }

            // Calculate weighted averages by service category
            const serviceStats = new Map<string, {
              totalRevenue: number
              totalFees: number
              count: number
              weightedRatio: number
            }>()

            serviceFeeAnalyses.forEach(analysis => {
              const existing = serviceStats.get(analysis.serviceCategory) || {
                totalRevenue: 0,
                totalFees: 0,
                count: 0,
                weightedRatio: 0
              }
              
              existing.totalRevenue += analysis.currentRevenue
              existing.totalFees += analysis.estimatedFee
              existing.count += 1
              existing.weightedRatio = existing.totalRevenue > 0 ? existing.totalFees / existing.totalRevenue : 0
              
              serviceStats.set(analysis.serviceCategory, existing)
            })

            // Calculate overall weighted average
            const totalRevenue = Array.from(serviceStats.values()).reduce((sum, stat) => sum + stat.totalRevenue, 0)
            const totalFees = Array.from(serviceStats.values()).reduce((sum, stat) => sum + stat.totalFees, 0)
            const overallWeightedRatio = totalRevenue > 0 ? totalFees / totalRevenue : 0

            return (
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border">
                  <h4 className="font-semibold text-lg mb-3">Overall Weighted Average</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ${(totalRevenue / 1000000).toFixed(1)}M
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total Estimated Fees</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${(totalFees / 1000000).toFixed(1)}M
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Weighted Average Ratio</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {(overallWeightedRatio * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-mono">
                      <span className="font-semibold">Formula:</span> Total Fees ÷ Total Revenue = {(overallWeightedRatio * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Based on {serviceFeeAnalyses.length} analyses across {serviceStats.size} service categories
                    </p>
                  </div>
                </div>

                {/* Service Category Breakdown */}
                <div className="bg-white rounded-lg p-4 border">
                  <h4 className="font-semibold text-lg mb-3">By Service Category</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Array.from(serviceStats.entries()).map(([service, stats]) => (
                      <div key={service} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-sm">{service}</span>
                          <span className="text-xs text-muted-foreground">{stats.count} analyses</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Revenue:</span>
                            <span>${(stats.totalRevenue / 1000000).toFixed(1)}M</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Fees:</span>
                            <span>${(stats.totalFees / 1000000).toFixed(1)}M</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Ratio:</span>
                            <span className="font-semibold">{(stats.weightedRatio * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })()}
        </CardContent>
      </Card>

      {/* Ratio Management */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-6">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Calculator className="h-4 w-4 text-white" />
                </div>
                Fee-to-Revenue Ratios
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                Configure fee ratios by service category and product stage
              </p>
            </div>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Ratio
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Add Ratio Form */}
          {showAddForm && (
            <Card className="border-2 border-blue-200 bg-blue-50 mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Add Fee-to-Revenue Ratio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Service Category</label>
                    <select
                      value={newRatio.serviceCategory || ''}
                      onChange={(e) => setNewRatio({ ...newRatio, serviceCategory: e.target.value as ServiceCategory })}
                      className="w-full p-2 border rounded-lg"
                      title="Select service category"
                    >
                      <option value="">Select Service</option>
                      {SERVICE_CATEGORIES.map(service => (
                        <option key={service} value={service}>{service}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Product Stage</label>
                    <select
                      value={newRatio.stage || ''}
                      onChange={(e) => setNewRatio({ ...newRatio, stage: e.target.value as ProductStage })}
                      className="w-full p-2 border rounded-lg"
                      title="Select product stage"
                    >
                      <option value="">Select Stage</option>
                      {PRODUCT_STAGES.map(stage => (
                        <option key={stage.value} value={stage.value}>{stage.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Ratio (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={newRatio.ratio ? (newRatio.ratio * 100) : ''}
                      onChange={(e) => setNewRatio({ ...newRatio, ratio: parseFloat(e.target.value) / 100 })}
                      className="w-full p-2 border rounded-lg"
                      placeholder="5.0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                  <textarea
                    value={newRatio.description || ''}
                    onChange={(e) => setNewRatio({ ...newRatio, description: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                    rows={2}
                    placeholder="Additional notes about this ratio..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddRatio} className="bg-green-600 hover:bg-green-700">
                    Add Ratio
                  </Button>
                  <Button onClick={() => setShowAddForm(false)} variant="outline">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ratios Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-4 py-2 text-left">Service Category</th>
                  <th className="border px-4 py-2 text-left">Product Stage</th>
                  <th className="border px-4 py-2 text-center">Ratio</th>
                  <th className="border px-4 py-2 text-left">Description</th>
                  <th className="border px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {feeToRevenueRatios.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="border px-4 py-8 text-center text-muted-foreground">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No fee-to-revenue ratios configured</p>
                      <p className="text-sm">Add ratios to start analyzing service fees</p>
                    </td>
                  </tr>
                ) : (
                  feeToRevenueRatios.map(ratio => (
                    <tr key={ratio.id} className="hover:bg-gray-50">
                      <td className="border px-4 py-2 font-medium">{ratio.serviceCategory}</td>
                      <td className="border px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(ratio.stage)}`}>
                          {PRODUCT_STAGES.find(s => s.value === ratio.stage)?.label}
                        </span>
                      </td>
                      <td className="border px-4 py-2 text-center font-semibold">
                        {editingRatio === ratio.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              className="w-16 p-1 border rounded text-center"
                              title="Edit ratio percentage"
                              placeholder="0.0"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit(ratio.id)
                                if (e.key === 'Escape') handleCancelEdit()
                              }}
                            />
                            <span className="text-xs">%</span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleSaveEdit(ratio.id)}
                                className="text-green-600 hover:text-green-700 text-xs"
                                title="Save"
                              >
                                ✓
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="text-red-600 hover:text-red-700 text-xs"
                                title="Cancel"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(ratio.id, ratio.ratio)}
                            className="hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                            title="Click to edit"
                          >
                            {(ratio.ratio * 100).toFixed(1)}%
                          </button>
                        )}
                      </td>
                      <td className="border px-4 py-2 text-sm text-muted-foreground">
                        {ratio.description || '—'}
                      </td>
                      <td className="border px-4 py-2 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFeeToRevenueRatio(ratio.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Service Fee Analyses */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-6">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                Service Fee Analyses
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                Calculated fee estimates based on current revenue data and configured ratios
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCalculateAllAnalyses}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Calculate All
              </Button>
              <Button
                onClick={handleResetToDefaults}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {brandsWithAnalyses.map(({ brand, analyses, totalEstimatedFees, totalRevenue }) => (
                <Card key={brand.id} className="border-l-4 border-l-green-500">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold text-lg">{brand.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {brand.companyName} • {brand.therapeuticArea} • {brand.phase}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          ${(totalEstimatedFees / 1000000).toFixed(1)}M
                        </p>
                        <p className="text-sm text-muted-foreground">
                          of ${(totalRevenue / 1000000).toFixed(1)}M revenue
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {analyses.map(analysis => (
                        <div key={`${analysis.brandId}-${analysis.serviceCategory}`} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-sm">{analysis.serviceCategory}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(analysis.confidence)}`}>
                              {analysis.confidence}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Revenue:</span>
                              <span>${(analysis.currentRevenue / 1000000).toFixed(1)}M</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Est. Fee:</span>
                              <span className="font-semibold">${(analysis.estimatedFee / 1000000).toFixed(1)}M</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Ratio:</span>
                              <span>{(analysis.feeToRevenueRatio * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Stage:</span>
                              <span className={`px-1 py-0.5 rounded text-xs ${getStageColor(analysis.stage)}`}>
                                {PRODUCT_STAGES.find(s => s.value === analysis.stage)?.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
        </CardContent>
      </Card>

      {/* Interactive Line Graph */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            Interactive Fee-to-Revenue Ratios
          </CardTitle>
          <p className="text-muted-foreground">
            Drag the nodes to adjust fee-to-revenue ratios across product lifecycle stages
          </p>
        </CardHeader>
        <CardContent>
          <InteractiveRatioGraph />
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
