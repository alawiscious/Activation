import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Swords, 
  Users, 
  Target, 
  Shield, 
  AlertTriangle,
  Zap
} from 'lucide-react'

interface Brand {
  id: string
  name: string
  therapeuticArea: string
  company: string
  stage: string
  revenue: number
  clientContacts: number
  competitorContacts: number
  totalActivity: number
  marketShare: number
  strength: 'dominant' | 'strong' | 'moderate' | 'weak' | 'emerging'
  opportunities: number
  threats: number
  keyCompetitors: string[]
  contactDensity: number
  influenceScore: number
}

interface TherapeuticArea {
  id: string
  name: string
  brands: Brand[]
  totalRevenue: number
  marketSize: number
  competitiveIntensity: 'high' | 'medium' | 'low'
  growthRate: number
}

interface BattleMapData {
  therapeuticAreas: TherapeuticArea[]
  totalClientContacts: number
  totalCompetitorContacts: number
  dominantBrands: number
  vulnerableBrands: number
  opportunities: number
  totalRevenue: number
}

export default function CompetitiveBattleMap() {
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [selectedTherapeuticArea, setSelectedTherapeuticArea] = useState<TherapeuticArea | null>(null)
  const [viewMode, setViewMode] = useState<'brands' | 'therapeutic-areas' | 'market-share'>('brands')
  const [showThreats, setShowThreats] = useState(true)
  const [showOpportunities, setShowOpportunities] = useState(true)

  // Mock data - in real app, this would come from Genome API
  const battleMapData: BattleMapData = useMemo(() => ({
    therapeuticAreas: [
      {
        id: 'oncology',
        name: 'Oncology',
        totalRevenue: 4500000000,
        marketSize: 12000000000,
        competitiveIntensity: 'high',
        growthRate: 12.5,
        brands: [
          {
            id: 'keytruda',
            name: 'Keytruda',
            therapeuticArea: 'Oncology',
            company: 'Merck',
            stage: 'Post-Launch',
            revenue: 1800000000,
            clientContacts: 45,
            competitorContacts: 23,
            totalActivity: 1200,
            marketShare: 15.0,
            strength: 'dominant',
            opportunities: 8,
            threats: 2,
            keyCompetitors: ['Opdivo', 'Tecentriq', 'Imfinzi'],
            contactDensity: 85,
            influenceScore: 92
          },
          {
            id: 'opdivo',
            name: 'Opdivo',
            therapeuticArea: 'Oncology',
            company: 'Bristol Myers Squibb',
            stage: 'Post-Launch',
            revenue: 1200000000,
            clientContacts: 32,
            competitorContacts: 18,
            totalActivity: 890,
            marketShare: 10.0,
            strength: 'strong',
            opportunities: 5,
            threats: 4,
            keyCompetitors: ['Keytruda', 'Tecentriq'],
            contactDensity: 72,
            influenceScore: 78
          }
        ]
      },
      {
        id: 'immunology',
        name: 'Immunology',
        totalRevenue: 3200000000,
        marketSize: 8000000000,
        competitiveIntensity: 'medium',
        growthRate: 8.2,
        brands: [
          {
            id: 'humira',
            name: 'Humira',
            therapeuticArea: 'Immunology',
            company: 'AbbVie',
            stage: 'LOE',
            revenue: 2100000000,
            clientContacts: 28,
            competitorContacts: 31,
            totalActivity: 756,
            marketShare: 26.3,
            strength: 'weak',
            opportunities: 12,
            threats: 7,
            keyCompetitors: ['Enbrel', 'Remicade', 'Stelara'],
            contactDensity: 45,
            influenceScore: 35
          },
          {
            id: 'stelara',
            name: 'Stelara',
            therapeuticArea: 'Immunology',
            company: 'Johnson & Johnson',
            stage: 'Post-Launch',
            revenue: 1100000000,
            clientContacts: 38,
            competitorContacts: 25,
            totalActivity: 1100,
            marketShare: 13.8,
            strength: 'strong',
            opportunities: 6,
            threats: 3,
            keyCompetitors: ['Humira', 'Enbrel'],
            contactDensity: 78,
            influenceScore: 85
          }
        ]
      },
      {
        id: 'neurology',
        name: 'Neurology',
        totalRevenue: 1800000000,
        marketSize: 5000000000,
        competitiveIntensity: 'low',
        growthRate: 15.8,
        brands: [
          {
            id: 'ozempic',
            name: 'Ozempic',
            therapeuticArea: 'Neurology',
            company: 'Novo Nordisk',
            stage: 'Launch',
            revenue: 1200000000,
            clientContacts: 22,
            competitorContacts: 19,
            totalActivity: 650,
            marketShare: 24.0,
            strength: 'emerging',
            opportunities: 9,
            threats: 5,
            keyCompetitors: ['Trulicity', 'Victoza'],
            contactDensity: 65,
            influenceScore: 88
          }
        ]
      }
    ],
    totalClientContacts: 165,
    totalCompetitorContacts: 116,
    dominantBrands: 1,
    vulnerableBrands: 1,
    opportunities: 40,
    totalRevenue: 9500000000
  }), [])

  const getBrandColor = (brand: Brand) => {
    switch (brand.strength) {
      case 'dominant':
        return 'bg-purple-500/20 border-purple-500 text-purple-400'
      case 'strong':
        return 'bg-green-500/20 border-green-500 text-green-400'
      case 'moderate':
        return 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
      case 'weak':
        return 'bg-red-500/20 border-red-500 text-red-400'
      case 'emerging':
        return 'bg-blue-500/20 border-blue-500 text-blue-400'
      default:
        return 'bg-gray-500/20 border-gray-500 text-gray-400'
    }
  }

  const getStrengthIcon = (strength: string) => {
    switch (strength) {
      case 'dominant':
        return <Shield className="h-4 w-4 text-purple-400" />
      case 'strong':
        return <Shield className="h-4 w-4 text-green-400" />
      case 'moderate':
        return <Target className="h-4 w-4 text-yellow-400" />
      case 'weak':
        return <AlertTriangle className="h-4 w-4 text-red-400" />
      case 'emerging':
        return <Zap className="h-4 w-4 text-blue-400" />
      default:
        return <Target className="h-4 w-4 text-gray-400" />
    }
  }

  const getStrengthLabel = (strength: string) => {
    switch (strength) {
      case 'dominant':
        return 'Market Leader'
      case 'strong':
        return 'Strong Position'
      case 'moderate':
        return 'Competitive'
      case 'weak':
        return 'Vulnerable'
      case 'emerging':
        return 'Rising Star'
      default:
        return 'Unknown'
    }
  }

  const getTherapeuticAreaColor = (ta: TherapeuticArea) => {
    switch (ta.competitiveIntensity) {
      case 'high':
        return 'bg-red-500/20 border-red-500 text-red-400'
      case 'medium':
        return 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
      case 'low':
        return 'bg-green-500/20 border-green-500 text-green-400'
      default:
        return 'bg-gray-500/20 border-gray-500 text-gray-400'
    }
  }

  const formatRevenue = (revenue: number) => {
    if (revenue >= 1000000000) {
      return `$${(revenue / 1000000000).toFixed(1)}B`
    } else if (revenue >= 1000000) {
      return `$${(revenue / 1000000).toFixed(0)}M`
    } else {
      return `$${revenue.toLocaleString()}`
    }
  }

  return (
    <div className="w-full h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
              <Swords className="h-8 w-8 text-red-400" />
              <span>Brand Warfare Map</span>
            </h1>
            <p className="text-slate-400 mt-1">Strategic brand battles and therapeutic area warfare</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-400" />
              <span className="text-white font-semibold">{battleMapData.totalClientContacts}</span>
              <span className="text-slate-400">vs</span>
              <Target className="h-5 w-5 text-red-400" />
              <span className="text-white font-semibold">{battleMapData.totalCompetitorContacts}</span>
              <span className="text-slate-400">•</span>
              <span className="text-white font-semibold">{formatRevenue(battleMapData.totalRevenue)}</span>
              <span className="text-slate-400">Pipeline</span>
            </div>
            
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant={showThreats ? "default" : "outline"}
                onClick={() => setShowThreats(!showThreats)}
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                Threats
              </Button>
              <Button
                size="sm"
                variant={showOpportunities ? "default" : "outline"}
                onClick={() => setShowOpportunities(!showOpportunities)}
              >
                <Zap className="h-4 w-4 mr-1" />
                Opportunities
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Map View */}
        <div className="flex-1 p-6">
          <div className="space-y-4">
            <div className="flex space-x-2 mb-6">
              <Button
                size="sm"
                variant={viewMode === 'brands' ? "default" : "outline"}
                onClick={() => setViewMode('brands')}
              >
                Brand Battles
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'therapeutic-areas' ? "default" : "outline"}
                onClick={() => setViewMode('therapeutic-areas')}
              >
                Therapeutic Areas
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'market-share' ? "default" : "outline"}
                onClick={() => setViewMode('market-share')}
              >
                Market Share
              </Button>
            </div>

            {viewMode === 'brands' && (
              <div className="space-y-6">
                {battleMapData.therapeuticAreas.map((ta) => (
                  <div key={ta.id} className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-xl font-bold text-white">{ta.name}</h3>
                      <Badge className={getTherapeuticAreaColor(ta)}>
                        {ta.competitiveIntensity} competition
                      </Badge>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-400">{formatRevenue(ta.totalRevenue)} revenue</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-green-400">{ta.growthRate}% growth</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {ta.brands.map((brand) => (
                        <Card 
                          key={brand.id}
                          className={`cursor-pointer transition-all duration-200 hover:scale-105 ${getBrandColor(brand)}`}
                          onClick={() => setSelectedBrand(brand)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">{brand.name}</CardTitle>
                              {getStrengthIcon(brand.strength)}
                            </div>
                            <p className="text-sm opacity-70">{brand.company} • {brand.stage}</p>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Revenue:</span>
                                <span className="font-semibold">{formatRevenue(brand.revenue)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Market Share:</span>
                                <Badge variant="outline" className="bg-blue-500/20 text-blue-400">
                                  {brand.marketShare}%
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Client Contacts:</span>
                                <Badge variant="outline" className="bg-green-500/20 text-green-400">
                                  {brand.clientContacts}
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Competitor Contacts:</span>
                                <Badge variant="outline" className="bg-red-500/20 text-red-400">
                                  {brand.competitorContacts}
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Strength:</span>
                                <Badge variant="outline">
                                  {getStrengthLabel(brand.strength)}
                                </Badge>
                              </div>
                              <div className="text-xs text-slate-500">
                                Key Competitors: {brand.keyCompetitors.join(', ')}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {viewMode === 'therapeutic-areas' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {battleMapData.therapeuticAreas.map((ta) => (
                    <Card 
                      key={ta.id}
                      className={`cursor-pointer transition-all duration-200 hover:scale-105 ${getTherapeuticAreaColor(ta)}`}
                      onClick={() => setSelectedTherapeuticArea(ta)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{ta.name}</CardTitle>
                          <Badge variant="outline">
                            {ta.competitiveIntensity}
                          </Badge>
                        </div>
                        <p className="text-sm opacity-70">{ta.brands.length} brands</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Total Revenue:</span>
                            <span className="font-semibold">{formatRevenue(ta.totalRevenue)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Market Size:</span>
                            <span className="font-semibold">{formatRevenue(ta.marketSize)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Growth Rate:</span>
                            <Badge variant="outline" className="bg-green-500/20 text-green-400">
                              {ta.growthRate}%
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Competitive Intensity:</span>
                            <Badge variant="outline">
                              {ta.competitiveIntensity}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {viewMode === 'market-share' && (
              <div className="space-y-6">
                {battleMapData.therapeuticAreas.map((ta) => (
                  <div key={ta.id} className="space-y-4">
                    <h3 className="text-xl font-bold text-white">{ta.name} Market Share</h3>
                    
                    <div className="space-y-3">
                      {ta.brands.map((brand) => (
                        <div key={brand.id} className="flex items-center space-x-4 p-4 bg-slate-800 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-white">{brand.name}</span>
                              <span className="text-sm text-slate-400">{brand.company}</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-3">
                              <div 
                                className={`h-3 rounded-full transition-all duration-500 ${
                                  brand.strength === 'dominant' ? 'bg-purple-500' :
                                  brand.strength === 'strong' ? 'bg-green-500' :
                                  brand.strength === 'moderate' ? 'bg-yellow-500' :
                                  brand.strength === 'weak' ? 'bg-red-500' :
                                  'bg-blue-500'
                                }`}
                                style={{ width: `${brand.marketShare}%` }}
                              />
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-white">{brand.marketShare}%</div>
                            <div className="text-sm text-slate-400">{formatRevenue(brand.revenue)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Strategy Panel */}
        <div className="w-80 bg-slate-800 border-l border-slate-700 p-6 overflow-y-auto">
          <h2 className="text-xl font-bold text-white mb-6">Brand Intelligence</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Strategic Overview</h3>
              
              <div className="space-y-4">
                <Card className="bg-purple-500/10 border-purple-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Shield className="h-5 w-5 text-purple-400" />
                      <span className="text-purple-400 font-semibold">Dominant Brands</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{battleMapData.dominantBrands}</div>
                    <div className="text-sm text-slate-400">Market leaders</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-red-500/10 border-red-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                      <span className="text-red-400 font-semibold">Vulnerable Brands</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{battleMapData.vulnerableBrands}</div>
                    <div className="text-sm text-slate-400">At risk brands</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-blue-500/10 border-blue-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Zap className="h-5 w-5 text-blue-400" />
                      <span className="text-blue-400 font-semibold">Opportunities</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{battleMapData.opportunities}</div>
                    <div className="text-sm text-slate-400">Growth potential</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {selectedBrand && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Brand Details</h3>
                <Card className="bg-slate-700 border-slate-600">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Name:</span>
                        <span className="text-white font-semibold">{selectedBrand.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Company:</span>
                        <span className="text-white font-semibold">{selectedBrand.company}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Stage:</span>
                        <span className="text-white font-semibold">{selectedBrand.stage}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Revenue:</span>
                        <span className="text-white font-semibold">{formatRevenue(selectedBrand.revenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Market Share:</span>
                        <span className="text-white font-semibold">{selectedBrand.marketShare}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Strength:</span>
                        <Badge className={getBrandColor(selectedBrand)}>
                          {getStrengthLabel(selectedBrand.strength)}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Client Contacts:</span>
                        <span className="text-white font-semibold">{selectedBrand.clientContacts}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Competitor Contacts:</span>
                        <span className="text-white font-semibold">{selectedBrand.competitorContacts}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Influence Score:</span>
                        <span className="text-white font-semibold">{selectedBrand.influenceScore}/100</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {selectedTherapeuticArea && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Therapeutic Area Details</h3>
                <Card className="bg-slate-700 border-slate-600">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Name:</span>
                        <span className="text-white font-semibold">{selectedTherapeuticArea.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Revenue:</span>
                        <span className="text-white font-semibold">{formatRevenue(selectedTherapeuticArea.totalRevenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Market Size:</span>
                        <span className="text-white font-semibold">{formatRevenue(selectedTherapeuticArea.marketSize)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Growth Rate:</span>
                        <span className="text-white font-semibold">{selectedTherapeuticArea.growthRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Competitive Intensity:</span>
                        <Badge className={getTherapeuticAreaColor(selectedTherapeuticArea)}>
                          {selectedTherapeuticArea.competitiveIntensity}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Brands:</span>
                        <span className="text-white font-semibold">{selectedTherapeuticArea.brands.length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}