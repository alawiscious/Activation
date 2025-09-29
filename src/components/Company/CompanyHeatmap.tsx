import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react'
import { SERVICE_CATEGORIES, AGENCIES } from '@/types/domain'
import type { Brand } from '@/types/domain'
import { usePharmaVisualPivotStore } from '@/data/store'

interface CompanyHeatmapProps {
  brands: Brand[]
  companySlug: string
  onAgencyChange: (brandId: string, service: string, agency: string) => void
}

export function CompanyHeatmap({ brands, companySlug, onAgencyChange }: CompanyHeatmapProps) {
  const [collapsedTAs, setCollapsedTAs] = useState<Set<string>>(new Set())
  const [showBlockedAreas, setShowBlockedAreas] = useState(true)
  
  const { isBlockedByContract } = usePharmaVisualPivotStore()

  // Group brands by therapeutic area
  const brandsByTA = useMemo(() => {
    const groups: Record<string, Brand[]> = {}
    brands.forEach(brand => {
      const ta = brand.therapeuticArea || 'Unspecified'
      if (!groups[ta]) {
        groups[ta] = []
      }
      groups[ta].push(brand)
    })
    return groups
  }, [brands])

  // Check which services and TAs are blocked
  const blockedServices = useMemo(() => {
    const blocked = new Set<string>()
    SERVICE_CATEGORIES.forEach(service => {
      if (isBlockedByContract(companySlug, service)) {
        blocked.add(service)
      }
    })
    return blocked
  }, [companySlug, isBlockedByContract])

  const blockedTAs = useMemo(() => {
    const blocked = new Set<string>()
    Object.keys(brandsByTA).forEach(ta => {
      if (isBlockedByContract(companySlug, undefined, ta)) {
        blocked.add(ta)
      }
    })
    return blocked
  }, [companySlug, brandsByTA, isBlockedByContract])

  const toggleTA = (ta: string) => {
    const newCollapsed = new Set(collapsedTAs)
    if (newCollapsed.has(ta)) {
      newCollapsed.delete(ta)
    } else {
      newCollapsed.add(ta)
    }
    setCollapsedTAs(newCollapsed)
  }

  const getCellColor = (agency: string) => {
    if (!agency || agency === '') {
      return 'bg-green-100 border-green-200 hover:bg-green-200'
    }
    if (agency.toLowerCase() === 'klick') {
      return 'bg-blue-100 border-blue-200 hover:bg-blue-200'
    }
    return 'bg-red-100 border-red-200 hover:bg-red-200'
  }

  const getCellTextColor = (agency: string) => {
    if (!agency || agency === '') {
      return 'text-green-800'
    }
    if (agency.toLowerCase() === 'klick') {
      return 'text-blue-800'
    }
    return 'text-red-800'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <span>Brand Service Heatmap</span>
            <span className="text-sm font-normal text-muted-foreground">
              ({brands.length} brands across {Object.keys(brandsByTA).length} therapeutic areas)
            </span>
          </CardTitle>
          <button
            onClick={() => setShowBlockedAreas(!showBlockedAreas)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showBlockedAreas 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {showBlockedAreas ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {showBlockedAreas ? 'Hide Blocked' : 'Show Blocked'}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto">
          <div className="min-w-full">
            {/* Header */}
            <div className="grid grid-cols-[300px_repeat(7,1fr)] gap-1 mb-2">
              <div className="font-semibold text-sm text-center py-2 px-3 bg-gray-50 rounded">
                Brand (by Therapeutic Area)
              </div>
              {SERVICE_CATEGORIES.map(service => {
                const isBlocked = blockedServices.has(service)
                if (!showBlockedAreas && isBlocked) return null
                
                return (
                  <div 
                    key={service} 
                    className={`font-semibold text-sm text-center py-2 px-3 rounded ${
                      isBlocked 
                        ? 'bg-gray-200 border-4 border-black' 
                        : 'bg-gray-50'
                    }`}
                  >
                    {service}
                    {isBlocked && <div className="text-xs text-red-600 font-bold mt-1">BLOCKED</div>}
                  </div>
                )
              })}
            </div>

            {/* Therapeutic Area Groups */}
            {Object.entries(brandsByTA).map(([ta, taBrands]) => {
              const isTABlocked = blockedTAs.has(ta)
              if (!showBlockedAreas && isTABlocked) return null
              
              return (
                <div key={ta} className="mb-2">
                  {/* TA Header */}
                  <div 
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                      isTABlocked 
                        ? 'bg-gray-200 border-4 border-black hover:bg-gray-300' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    onClick={() => toggleTA(ta)}
                  >
                    {collapsedTAs.has(ta) ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    <span className="font-medium text-sm">
                      {ta} ({taBrands.length} brands)
                    </span>
                    {isTABlocked && <span className="text-xs text-red-600 font-bold ml-2">BLOCKED</span>}
                  </div>

                {/* Brands in this TA */}
                {!collapsedTAs.has(ta) && (
                  <div className="ml-4 space-y-1">
                    {taBrands.map(brand => (
                      <div key={brand.id} className="grid grid-cols-[300px_repeat(7,1fr)] gap-1">
                        {/* Brand Name */}
                        <div className="flex items-center py-2 px-3 bg-white border rounded text-sm">
                          <span className="truncate font-medium" title={brand.name}>
                            {brand.name}
                          </span>
                        </div>

                        {/* Service Cells */}
                        {SERVICE_CATEGORIES.map(service => {
                          const agency = (brand.services || {})[service] || ''
                          const isServiceBlocked = blockedServices.has(service)
                          const isTABlocked = blockedTAs.has(brand.therapeuticArea || '')
                          const isBrandBlocked = isBlockedByContract(companySlug, undefined, undefined, brand.id)
                          const isBlocked = isServiceBlocked || isTABlocked || isBrandBlocked
                          
                          if (!showBlockedAreas && isBlocked) {
                            return null // Hide blocked cells when toggle is off
                          }
                          
                          return (
                            <div
                              key={service}
                              className={`py-2 px-3 border rounded transition-all duration-200 ${
                                isBlocked 
                                  ? 'bg-gray-200 border-4 border-black' 
                                  : getCellColor(agency)
                              }`}
                            >
                              <select
                                className={`w-full text-xs font-medium bg-transparent border-none outline-none ${
                                  isBlocked ? 'text-gray-600' : getCellTextColor(agency)
                                }`}
                                value={agency}
                                onChange={(e) => onAgencyChange(brand.id, service, e.target.value)}
                                disabled={isBlocked}
                              >
                                <option value="">Unassigned</option>
                                {Array.from(AGENCIES).map(agencyOption => (
                                  <option key={agencyOption} value={agencyOption}>
                                    {agencyOption}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

            {/* Legend */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-6 text-sm">
                <span className="font-medium">Legend:</span>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
                  <span>Klick</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
                  <span>Competitor</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
                  <span>Unassigned</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
