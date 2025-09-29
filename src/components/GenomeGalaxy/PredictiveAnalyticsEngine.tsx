import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Calendar,
  Mail,
  Phone,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  BarChart3
} from 'lucide-react'

interface ContactPrediction {
  id: number
  name: string
  company: string
  title: string
  engagementScore: number
  opportunityScore: number
  churnRisk: number
  optimalContactMethod: 'email' | 'meeting' | 'phone'
  optimalTiming: string
  nextAction: string
  confidence: number
  lastInteraction: string
  interactionFrequency: number
}

interface OpportunityPrediction {
  id: string
  title: string
  company: string
  value: number
  probability: number
  timeline: string
  keyContacts: string[]
  riskFactors: string[]
  nextSteps: string[]
  confidence: number
}

interface ChurnPrediction {
  id: number
  name: string
  company: string
  churnRisk: number
  riskFactors: string[]
  lastActivity: string
  engagementTrend: 'increasing' | 'stable' | 'decreasing'
  recommendedActions: string[]
}

interface PredictiveData {
  contactPredictions: ContactPrediction[]
  opportunityPredictions: OpportunityPrediction[]
  churnPredictions: ChurnPrediction[]
  totalOpportunities: number
  totalValue: number
  highRiskContacts: number
  avgEngagementScore: number
}

export default function PredictiveAnalyticsEngine() {
  const [selectedTab, setSelectedTab] = useState<'contacts' | 'opportunities' | 'churn'>('contacts')
  const [selectedContact, setSelectedContact] = useState<ContactPrediction | null>(null)
  const [timeframe, setTimeframe] = useState<'30d' | '90d' | '1y'>('90d')

  // Mock data - in real app, this would come from AI analysis of Genome API data
  const predictiveData: PredictiveData = useMemo(() => ({
    contactPredictions: [
      {
        id: 1,
        name: "Sarah Johnson",
        company: "Pfizer",
        title: "VP Marketing",
        engagementScore: 85,
        opportunityScore: 92,
        churnRisk: 15,
        optimalContactMethod: "meeting",
        optimalTiming: "Tuesday 2-4 PM",
        nextAction: "Schedule quarterly review meeting",
        confidence: 88,
        lastInteraction: "2025-09-20",
        interactionFrequency: 2.3
      },
      {
        id: 2,
        name: "Michael Chen",
        company: "Pfizer",
        title: "Director R&D",
        engagementScore: 72,
        opportunityScore: 78,
        churnRisk: 25,
        optimalContactMethod: "email",
        optimalTiming: "Monday morning",
        nextAction: "Send research collaboration proposal",
        confidence: 82,
        lastInteraction: "2025-09-15",
        interactionFrequency: 1.8
      },
      {
        id: 3,
        name: "Emily Rodriguez",
        company: "Merck",
        title: "SVP Commercial",
        engagementScore: 45,
        opportunityScore: 65,
        churnRisk: 60,
        optimalContactMethod: "phone",
        optimalTiming: "Thursday afternoon",
        nextAction: "Re-engage with new value proposition",
        confidence: 75,
        lastInteraction: "2025-08-30",
        interactionFrequency: 0.8
      }
    ],
    opportunityPredictions: [
      {
        id: "opp-1",
        title: "Oncology Brand Launch Support",
        company: "Pfizer",
        value: 2500000,
        probability: 78,
        timeline: "Q1 2026",
        keyContacts: ["Sarah Johnson", "Michael Chen"],
        riskFactors: ["Budget constraints", "Timeline pressure"],
        nextSteps: ["Finalize proposal", "Schedule stakeholder meeting"],
        confidence: 85
      },
      {
        id: "opp-2",
        title: "Digital Transformation Initiative",
        company: "Johnson & Johnson",
        value: 1800000,
        probability: 65,
        timeline: "Q2 2026",
        keyContacts: ["David Kim"],
        riskFactors: ["Competitive pressure", "Internal restructuring"],
        nextSteps: ["Present case study", "Arrange pilot program"],
        confidence: 72
      }
    ],
    churnPredictions: [
      {
        id: 1,
        name: "Emily Rodriguez",
        company: "Merck",
        churnRisk: 60,
        riskFactors: ["Decreased engagement", "Competitor activity", "Budget cuts"],
        lastActivity: "2025-08-30",
        engagementTrend: "decreasing",
        recommendedActions: ["Personal outreach", "Value demonstration", "Executive meeting"]
      }
    ],
    totalOpportunities: 2,
    totalValue: 4300000,
    highRiskContacts: 1,
    avgEngagementScore: 67
  }), [])

  const getEngagementColor = (score: number) => {
    if (score >= 80) return "text-green-400"
    if (score >= 60) return "text-yellow-400"
    return "text-red-400"
  }

  const getEngagementBadge = (score: number) => {
    if (score >= 80) return "bg-green-500/20 text-green-400 border-green-500/30"
    if (score >= 60) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    return "bg-red-500/20 text-red-400 border-red-500/30"
  }

  const getChurnRiskColor = (risk: number) => {
    if (risk <= 30) return "text-green-400"
    if (risk <= 60) return "text-yellow-400"
    return "text-red-400"
  }

  const getChurnRiskBadge = (risk: number) => {
    if (risk <= 30) return "bg-green-500/20 text-green-400 border-green-500/30"
    if (risk <= 60) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    return "bg-red-500/20 text-red-400 border-red-500/30"
  }

  const getOptimalMethodIcon = (method: string) => {
    switch (method) {
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'meeting':
        return <Calendar className="h-4 w-4" />
      case 'phone':
        return <Phone className="h-4 w-4" />
      default:
        return <Mail className="h-4 w-4" />
    }
  }

  return (
    <div className="w-full h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
              <Brain className="h-8 w-8 text-purple-400" />
              <span>Predictive Analytics Engine</span>
            </h1>
            <p className="text-slate-400 mt-1">AI-powered relationship forecasting and opportunity prediction</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-400" />
              <span className="text-white font-semibold">${(predictiveData.totalValue / 1000000).toFixed(1)}M</span>
              <span className="text-slate-400">Pipeline</span>
            </div>
            
            <div className="flex space-x-2">
              {['30d', '90d', '1y'].map((period) => (
                <Button
                  key={period}
                  size="sm"
                  variant={timeframe === period ? "default" : "outline"}
                  onClick={() => setTimeframe(period as any)}
                >
                  {period}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="space-y-4">
            <div className="flex space-x-2 mb-6">
              <Button
                size="sm"
                variant={selectedTab === 'contacts' ? "default" : "outline"}
                onClick={() => setSelectedTab('contacts')}
              >
                Contact Predictions
              </Button>
              <Button
                size="sm"
                variant={selectedTab === 'opportunities' ? "default" : "outline"}
                onClick={() => setSelectedTab('opportunities')}
              >
                Opportunity Forecast
              </Button>
              <Button
                size="sm"
                variant={selectedTab === 'churn' ? "default" : "outline"}
                onClick={() => setSelectedTab('churn')}
              >
                Churn Risk Analysis
              </Button>
            </div>

            {selectedTab === 'contacts' && (
            <div className="space-y-4">
              <div className="grid gap-4">
                {predictiveData.contactPredictions.map((contact) => (
                  <Card 
                    key={contact.id}
                    className="bg-slate-800 border-slate-700 cursor-pointer hover:bg-slate-750 transition-colors"
                    onClick={() => setSelectedContact(contact)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{contact.name}</h3>
                          <p className="text-slate-400">{contact.title} at {contact.company}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getEngagementBadge(contact.engagementScore)}>
                            {contact.engagementScore}% Engaged
                          </Badge>
                          <Badge className={getChurnRiskBadge(contact.churnRisk)}>
                            {contact.churnRisk}% Churn Risk
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-slate-400 mb-1">Engagement Score</div>
                          <div className="flex items-center space-x-2">
                            <Progress value={contact.engagementScore} className="flex-1" />
                            <span className={`text-sm font-semibold ${getEngagementColor(contact.engagementScore)}`}>
                              {contact.engagementScore}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-400 mb-1">Opportunity Score</div>
                          <div className="flex items-center space-x-2">
                            <Progress value={contact.opportunityScore} className="flex-1" />
                            <span className="text-sm font-semibold text-blue-400">
                              {contact.opportunityScore}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-400 mb-1">Churn Risk</div>
                          <div className="flex items-center space-x-2">
                            <Progress value={contact.churnRisk} className="flex-1" />
                            <span className={`text-sm font-semibold ${getChurnRiskColor(contact.churnRisk)}`}>
                              {contact.churnRisk}%
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-slate-400 mb-1">Optimal Contact Method</div>
                          <div className="flex items-center space-x-2">
                            {getOptimalMethodIcon(contact.optimalContactMethod)}
                            <span className="text-sm text-white capitalize">{contact.optimalContactMethod}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-400 mb-1">Best Timing</div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <span className="text-sm text-white">{contact.optimalTiming}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <div className="text-sm text-slate-400 mb-1">Recommended Next Action</div>
                        <div className="text-sm text-white">{contact.nextAction}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            )}

            {selectedTab === 'opportunities' && (
            <div className="space-y-4">
              <div className="grid gap-4">
                {predictiveData.opportunityPredictions.map((opportunity) => (
                  <Card key={opportunity.id} className="bg-slate-800 border-slate-700">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{opportunity.title}</h3>
                          <p className="text-slate-400">{opportunity.company}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-400">
                            ${(opportunity.value / 1000000).toFixed(1)}M
                          </div>
                          <div className="text-sm text-slate-400">Potential Value</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-slate-400 mb-1">Probability</div>
                          <div className="flex items-center space-x-2">
                            <Progress value={opportunity.probability} className="flex-1" />
                            <span className="text-sm font-semibold text-blue-400">
                              {opportunity.probability}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-400 mb-1">Timeline</div>
                          <div className="text-sm text-white">{opportunity.timeline}</div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-400 mb-1">Confidence</div>
                          <div className="text-sm text-white">{opportunity.confidence}%</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-slate-400 mb-2">Key Contacts</div>
                          <div className="space-y-1">
                            {opportunity.keyContacts.map((contact, index) => (
                              <div key={index} className="text-sm text-white">{contact}</div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-400 mb-2">Risk Factors</div>
                          <div className="space-y-1">
                            {opportunity.riskFactors.map((risk, index) => (
                              <div key={index} className="text-sm text-red-400">{risk}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <div className="text-sm text-slate-400 mb-2">Next Steps</div>
                        <div className="space-y-1">
                          {opportunity.nextSteps.map((step, index) => (
                            <div key={index} className="text-sm text-white">• {step}</div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            )}

            {selectedTab === 'churn' && (
            <div className="space-y-4">
              <div className="grid gap-4">
                {predictiveData.churnPredictions.map((contact) => (
                  <Card key={contact.id} className="bg-slate-800 border-slate-700">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{contact.name}</h3>
                          <p className="text-slate-400">{contact.company}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getChurnRiskBadge(contact.churnRisk)}>
                            {contact.churnRisk}% Churn Risk
                          </Badge>
                          <Badge variant="outline" className={
                            contact.engagementTrend === 'increasing' ? 'text-green-400 border-green-500/30' :
                            contact.engagementTrend === 'stable' ? 'text-yellow-400 border-yellow-500/30' :
                            'text-red-400 border-red-500/30'
                          }>
                            {contact.engagementTrend}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="text-sm text-slate-400 mb-1">Churn Risk Level</div>
                        <div className="flex items-center space-x-2">
                          <Progress value={contact.churnRisk} className="flex-1" />
                          <span className={`text-sm font-semibold ${getChurnRiskColor(contact.churnRisk)}`}>
                            {contact.churnRisk}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-slate-400 mb-2">Risk Factors</div>
                          <div className="space-y-1">
                            {contact.riskFactors.map((risk, index) => (
                              <div key={index} className="text-sm text-red-400">• {risk}</div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-400 mb-2">Last Activity</div>
                          <div className="text-sm text-white">{contact.lastActivity}</div>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-slate-700">
                        <div className="text-sm text-slate-400 mb-2">Recommended Actions</div>
                        <div className="space-y-1">
                          {contact.recommendedActions.map((action, index) => (
                            <div key={index} className="text-sm text-white">• {action}</div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            )}
          </div>
        </div>

        {/* Analytics Panel */}
        <div className="w-80 bg-slate-800 border-l border-slate-700 p-6 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">AI Insights</h3>
              
              <div className="space-y-4">
                <Card className="bg-blue-500/10 border-blue-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-blue-400" />
                      <span className="text-blue-400 font-semibold">Pipeline Health</span>
                    </div>
                    <div className="text-2xl font-bold text-white">${(predictiveData.totalValue / 1000000).toFixed(1)}M</div>
                    <div className="text-sm text-slate-400">Total pipeline value</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-green-500/10 border-green-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="h-5 w-5 text-green-400" />
                      <span className="text-green-400 font-semibold">Opportunities</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{predictiveData.totalOpportunities}</div>
                    <div className="text-sm text-slate-400">Active opportunities</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-red-500/10 border-red-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                      <span className="text-red-400 font-semibold">High Risk</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{predictiveData.highRiskContacts}</div>
                    <div className="text-sm text-slate-400">Contacts at risk</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-purple-500/10 border-purple-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <BarChart3 className="h-5 w-5 text-purple-400" />
                      <span className="text-purple-400 font-semibold">Avg Engagement</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{predictiveData.avgEngagementScore}%</div>
                    <div className="text-sm text-slate-400">Overall engagement score</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {selectedContact && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Contact Analysis</h3>
                <Card className="bg-slate-700 border-slate-600">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-white">{selectedContact.name}</h4>
                        <p className="text-sm text-slate-400">{selectedContact.company}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-400">Engagement Score:</span>
                          <span className={`text-sm font-semibold ${getEngagementColor(selectedContact.engagementScore)}`}>
                            {selectedContact.engagementScore}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-400">Opportunity Score:</span>
                          <span className="text-sm font-semibold text-blue-400">
                            {selectedContact.opportunityScore}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-400">Churn Risk:</span>
                          <span className={`text-sm font-semibold ${getChurnRiskColor(selectedContact.churnRisk)}`}>
                            {selectedContact.churnRisk}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-400">Confidence:</span>
                          <span className="text-sm font-semibold text-white">
                            {selectedContact.confidence}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t border-slate-600">
                        <div className="text-sm text-slate-400 mb-1">AI Recommendation</div>
                        <div className="text-sm text-white">{selectedContact.nextAction}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Predictive Insights</h3>
              <div className="space-y-3">
                <Card className="bg-slate-700 border-slate-600">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold text-white">High Engagement Contacts</div>
                        <div className="text-xs text-slate-400">Focus on Sarah Johnson and Michael Chen for immediate opportunities</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-slate-700 border-slate-600">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-2">
                      <Zap className="h-4 w-4 text-yellow-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold text-white">Optimal Timing</div>
                        <div className="text-xs text-slate-400">Tuesday afternoons show 23% higher response rates</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-slate-700 border-slate-600">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold text-white">Churn Alert</div>
                        <div className="text-xs text-slate-400">Emily Rodriguez needs immediate re-engagement</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
