import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { BrandRevenueChart } from './BrandRevenueChart'
import { Building2, Edit, Trash2, Users, Star } from 'lucide-react'
import type { Brand, RevenueChartData, ServiceCategory } from '@/types/domain'
import { SERVICE_CATEGORIES, AGENCIES } from '@/types/domain'
import { usePharmaVisualPivotStore } from '@/data/store'
import { Link } from 'react-router-dom'

interface BrandCardProps {
  brand: Brand
  revenueData: RevenueChartData[]
  contactCount: number
  onEdit?: (brand: Brand) => void
  onDelete?: (brandId: string) => void
  onAssignAgency?: (brandId: string) => void
  onAssignCompetitor?: (brandId: string) => void
  className?: string
}

export function BrandCard({
  brand,
  revenueData,
  contactCount,
  onEdit,
  onDelete,
  onAssignAgency,
  onAssignCompetitor,
  className,
}: BrandCardProps) {
  const { updateBrand, currentCompanySlug, companies, toggleBrandTarget } = usePharmaVisualPivotStore()
  const isTarget = !!(currentCompanySlug && companies[currentCompanySlug]?.targets?.includes(brand.id))
  const getStageColor = (stage?: string) => {
    const s = (stage || 'Unknown').toLowerCase()
    if (s.includes('approved') || s.includes('marketed')) return 'bg-green-100 text-green-800 border-green-200'
    if (s.includes('phase iii') || s.includes('phase 3')) return 'bg-blue-100 text-blue-800 border-blue-200'
    if (s.includes('phase ii') || s.includes('phase 2')) return 'bg-purple-100 text-purple-800 border-purple-200'
    if (s.includes('phase i') || s.includes('phase 1')) return 'bg-orange-100 text-orange-800 border-orange-200'
    if (s.includes('preclinical') || s.includes('discovery')) return 'bg-gray-100 text-gray-800 border-gray-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const setAgency = (service: ServiceCategory, agency: string) => {
    const next = { ...(brand.services || {}) }
    next[service] = agency
    updateBrand(brand.id, { services: next })
  }

  const agencyColorClass = (val?: string) => {
    if (!val) return 'text-muted-foreground'
    return val.toLowerCase() === 'klick' ? 'text-blue-600' : 'text-red-600'
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              <Link to={`/brand/${brand.id}`} className="hover:underline">
                {brand.name}
              </Link>
            </CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Badge className={getStageColor(brand.indicationMarketStatus)}>
                {brand.indicationMarketStatus || 'Unknown'}
              </Badge>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            {/* Compact services editor (top-right) */}
            <div className="hidden md:flex flex-wrap gap-1" title="Agency by service">
              {SERVICE_CATEGORIES.map(sc => {
                const val = (brand.services || {})[sc]
                return (
                  <div key={sc} className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground w-8 truncate">{sc}</span>
                    <select
                      className={`border rounded h-6 px-1 text-[11px] bg-background ${agencyColorClass(val)}`}
                      value={val || ''}
                      onChange={(e) => setAgency(sc, e.target.value)}
                    >
                      <option value="">—</option>
                      {Array.from(AGENCIES).map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>
                )
              })}
            </div>
            <button
              className={`h-8 w-8 rounded-full border ${isTarget ? 'bg-yellow-300' : 'bg-background'}`}
              title={isTarget ? 'Unmark as target' : 'Mark as target'}
              onClick={() => toggleBrandTarget(brand.id)}
            >
              <Star className="h-4 w-4 mx-auto" />
            </button>
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={() => onEdit(brand)}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onDelete(brand.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Brand Details */}
        <div className="space-y-2">
          {brand.molecule && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Molecule:</span>
              <span className="text-sm text-muted-foreground">{brand.molecule}</span>
            </div>
          )}
          {brand.indication && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Indication:</span>
              <span className="text-sm text-muted-foreground">{brand.indication}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Therapeutic Area:</span>
            <Link to={`/ta/${encodeURIComponent(brand.therapeuticArea)}`} className="text-sm text-primary hover:underline">{brand.therapeuticArea}</Link>
          </div>
          {/* Stage shown as badge above; remove from details */}
          
          {brand.servicingAgency && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Servicing Agency:</span>
              <span className="text-sm text-muted-foreground">{brand.servicingAgency}</span>
            </div>
          )}
          
          {brand.competitor && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Competitor:</span>
              <span className="text-sm text-muted-foreground">{brand.competitor}</span>
            </div>
          )}
        </div>

        {/* Contact Count */}
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{contactCount} contacts</span>
        </div>

        {/* Revenue Chart */}
        {revenueData.length > 0 && (
          <BrandRevenueChart 
            data={revenueData} 
            brandName={brand.name}
            className="border-0 shadow-none"
          />
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {onAssignAgency && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onAssignAgency(brand.id)}
              className="flex-1"
            >
              Assign Agency
            </Button>
          )}
          {onAssignCompetitor && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onAssignCompetitor(brand.id)}
              className="flex-1"
            >
              Assign Competitor
            </Button>
          )}
        </div>

        {/* Metadata */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          <div>Created: {brand.createdAt.toLocaleDateString()}</div>
          <div>Updated: {brand.updatedAt.toLocaleDateString()}</div>
        </div>
      </CardContent>
    </Card>
  )
}
