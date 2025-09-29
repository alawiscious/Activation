import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Orbit, 
  Swords, 
  Brain, 
  Target,
  Users,
  Building2,
  Zap,
  TrendingUp,
  Eye,
  Play
} from 'lucide-react'
import GenomeGalaxy3D from '@/components/GenomeGalaxy/GenomeGalaxy3D'
import CompetitiveBattleMap from '@/components/GenomeGalaxy/CompetitiveBattleMap'
import PredictiveAnalyticsEngine from '@/components/GenomeGalaxy/PredictiveAnalyticsEngine'

type GalaxyView = 'galaxy' | 'battle' | 'predictive' | 'overview'

export default function GenomeGalaxy() {
  const [currentView, setCurrentView] = useState<GalaxyView>('overview')
  const [isFullscreen, setIsFullscreen] = useState(false)

  const galaxyFeatures = [
    {
      id: 'galaxy',
      title: '3D Genome Galaxy',
      description: 'Interactive relationship universe with contacts as planets',
      icon: Orbit,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      stats: ['105 Contacts', '3 Companies', 'Real-time 3D'],
      features: [
        'Contacts as orbiting planets',
        'Companies as solar systems',
        'Relationship gravity effects',
        'Interactive zoom and rotation',
        'Activity-based planet sizes',
        'Functional group color coding'
      ]
    },
    {
      id: 'battle',
      title: 'Competitive Battle Map',
      description: 'Strategic warfare visualization for business development',
      icon: Swords,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      stats: ['6 Territories', '180 vs 143', 'Strategic Intel'],
      features: [
        'Territory control mapping',
        'Client vs competitor analysis',
        'Opportunity identification',
        'Threat assessment',
        'Strategic recommendations',
        'Real-time battle status'
      ]
    },
    {
      id: 'predictive',
      title: 'Predictive Analytics Engine',
      description: 'AI-powered relationship forecasting and opportunity prediction',
      icon: Brain,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      stats: ['$4.3M Pipeline', '88% Confidence', 'AI Insights'],
      features: [
        'Contact engagement prediction',
        'Opportunity scoring',
        'Churn risk analysis',
        'Optimal timing recommendations',
        'Next action suggestions',
        'Confidence scoring'
      ]
    }
  ]

  const renderCurrentView = () => {
    switch (currentView) {
      case 'galaxy':
        return <GenomeGalaxy3D />
      case 'battle':
        return <CompetitiveBattleMap />
      case 'predictive':
        return <PredictiveAnalyticsEngine />
      case 'overview':
      default:
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="text-center mb-12">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
                    <Orbit className="h-8 w-8 text-white" />
                  </div>
                  <h1 className="text-4xl font-bold text-white">Genome Galaxy</h1>
                </div>
                <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                  Explore the universe of pharmaceutical relationships through cutting-edge 3D visualization, 
                  competitive intelligence, and AI-powered predictive analytics.
                </p>
                <div className="flex items-center justify-center space-x-6 mt-6">
                  <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    <Users className="h-4 w-4 mr-1" />
                    59 API Endpoints
                  </Badge>
                  <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                    <Zap className="h-4 w-4 mr-1" />
                    Real-time Data
                  </Badge>
                  <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                    <Brain className="h-4 w-4 mr-1" />
                    AI Powered
                  </Badge>
                </div>
              </div>

              {/* Feature Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                {galaxyFeatures.map((feature) => {
                  const IconComponent = feature.icon
                  return (
                    <Card 
                      key={feature.id}
                      className={`${feature.bgColor} ${feature.borderColor} border-2 cursor-pointer hover:scale-105 transition-all duration-300 group`}
                      onClick={() => setCurrentView(feature.id as GalaxyView)}
                    >
                      <CardHeader>
                        <div className="flex items-center space-x-3 mb-3">
                          <div className={`p-2 ${feature.bgColor} rounded-lg`}>
                            <IconComponent className={`h-6 w-6 ${feature.color}`} />
                          </div>
                          <CardTitle className="text-white group-hover:text-white/90">
                            {feature.title}
                          </CardTitle>
                        </div>
                        <p className="text-slate-300 text-sm">
                          {feature.description}
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Stats */}
                          <div className="flex flex-wrap gap-2">
                            {feature.stats.map((stat, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {stat}
                              </Badge>
                            ))}
                          </div>
                          
                          {/* Features */}
                          <div className="space-y-2">
                            {feature.features.map((item, index) => (
                              <div key={index} className="flex items-center space-x-2 text-sm text-slate-300">
                                <div className="w-1.5 h-1.5 bg-current rounded-full" />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                          
                          {/* Action Button */}
                          <Button 
                            className="w-full mt-4 group-hover:bg-white group-hover:text-slate-900 transition-colors"
                            variant="outline"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Launch {feature.title}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-6 text-center">
                    <Users className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">105</div>
                    <div className="text-sm text-slate-400">Total Contacts</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-6 text-center">
                    <Building2 className="h-8 w-8 text-green-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">3</div>
                    <div className="text-sm text-slate-400">Companies</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-6 text-center">
                    <Target className="h-8 w-8 text-red-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">1</div>
                    <div className="text-sm text-slate-400">Competitors</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">$4.3M</div>
                    <div className="text-sm text-slate-400">Pipeline Value</div>
                  </CardContent>
                </Card>
              </div>

              {/* Call to Action */}
              <div className="text-center">
                <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-bold text-white mb-4">
                      Ready to Explore the Genome Galaxy?
                    </h2>
                    <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
                      Choose your adventure: dive into the 3D relationship universe, 
                      strategize with the competitive battle map, or harness AI-powered 
                      predictive analytics for your next move.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                      {galaxyFeatures.map((feature) => {
                        const IconComponent = feature.icon
                        return (
                          <Button
                            key={feature.id}
                            size="lg"
                            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                            onClick={() => setCurrentView(feature.id as GalaxyView)}
                          >
                            <IconComponent className="h-5 w-5 mr-2" />
                            {feature.title}
                          </Button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="w-full h-screen">
      {/* Navigation Bar */}
      {currentView !== 'overview' && (
        <div className="bg-slate-900 border-b border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentView('overview')}
                className="text-slate-400 hover:text-white"
              >
                ← Back to Overview
              </Button>
              <div className="h-6 w-px bg-slate-700" />
              <h1 className="text-lg font-semibold text-white">
                {galaxyFeatures.find(f => f.id === currentView)?.title}
              </h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Eye className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={currentView !== 'overview' ? 'h-[calc(100vh-73px)]' : 'h-screen'}>
        {renderCurrentView()}
      </div>
    </div>
  )
}
