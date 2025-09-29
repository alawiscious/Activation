import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { 
  Settings, 
  Info, 
  Eye, 
  EyeOff, 
  HelpCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { 
  DISPOSITION_OPTIONS, 
  INFLUENCE_LEVEL_OPTIONS, 
  deriveContactLabel, 
  getLabelPalette,
  DEFAULT_DISPOSITION,
  DEFAULT_INFLUENCE_LEVEL
} from '../../lib/contactLabeling'
import type { DispositionToKlick, InfluenceLevel, DerivedContactLabel } from '../../types/domain'

export function ContactRulesInterface() {
  const [selectedDisposition, setSelectedDisposition] = useState<DispositionToKlick>(DEFAULT_DISPOSITION)
  const [selectedInfluence, setSelectedInfluence] = useState<InfluenceLevel>(DEFAULT_INFLUENCE_LEVEL)
  const [showMatrix, setShowMatrix] = useState(true)
  const [showExplanations, setShowExplanations] = useState(false)

  const currentLabel = deriveContactLabel(selectedDisposition, selectedInfluence)
  const currentPalette = getLabelPalette(currentLabel)

  const getLabelIcon = (label: DerivedContactLabel) => {
    switch (label) {
      case 'Champion':
      case 'Advocate':
      case 'Supporter':
      case 'Converted Blocker':
        return <CheckCircle className="h-4 w-4" />
      case 'Potential Swing':
      case 'Steady Influence':
      case 'Guarded Neutral':
      case 'Passive Blocker':
        return <Info className="h-4 w-4" />
      case 'Adversary':
      case 'Detractor':
      case 'Obstacle':
      case 'Roadblock':
        return <XCircle className="h-4 w-4" />
      case 'Unknown':
        return <HelpCircle className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getLabelDescription = (label: DerivedContactLabel) => {
    switch (label) {
      case 'Champion': return 'Strong supporter who actively promotes Klick and can influence decisions'
      case 'Advocate': return 'Positive influencer who speaks well of Klick and supports initiatives'
      case 'Supporter': return 'Generally positive contact who can provide access and information'
      case 'Converted Blocker': return 'Former blocker who has been converted to support Klick'
      case 'Potential Swing': return 'Decision maker whose position could shift with the right approach'
      case 'Steady Influence': return 'Consistent influencer with neutral to positive disposition'
      case 'Guarded Neutral': return 'Neutral contact who may be cautious but not hostile'
      case 'Passive Blocker': return 'Contact who may slow progress but not actively oppose'
      case 'Adversary': return 'Negative influencer who may work against Klick interests'
      case 'Detractor': return 'Decision maker with negative disposition toward Klick'
      case 'Obstacle': return 'Contact who creates barriers to progress'
      case 'Roadblock': return 'Active blocker who prevents forward movement'
      case 'Unknown': return 'Disposition and influence level not yet determined'
      default: return 'Contact classification not defined'
    }
  }

  const getDispositionDescription = (disposition: DispositionToKlick) => {
    switch (disposition) {
      case 'Positive': return 'Contact has favorable view of Klick and our work'
      case 'Neutral': return 'Contact has neither positive nor negative view of Klick'
      case 'Negative': return 'Contact has unfavorable view of Klick or our work'
      case 'Unknown': return 'Contact disposition toward Klick has not been determined'
      default: return 'Disposition not defined'
    }
  }

  const getInfluenceDescription = (influence: InfluenceLevel) => {
    switch (influence) {
      case 'Decision Maker': return 'Contact has authority to make final decisions'
      case 'Influencer': return 'Contact can influence decisions but does not make them directly'
      case 'Gatekeeper': return 'Contact controls access to decision makers or information'
      case 'Blocker': return 'Contact actively prevents progress or blocks initiatives'
      case 'Unknown': return 'Contact influence level has not been determined'
      default: return 'Influence level not defined'
    }
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            Contact Classification Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            This interface shows how contact disposition and influence levels are combined to create derived labels.
            Use the selectors below to see how different combinations result in different classifications.
          </p>
          
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMatrix(!showMatrix)}
              className="flex items-center gap-2"
            >
              {showMatrix ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showMatrix ? 'Hide' : 'Show'} Full Matrix
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExplanations(!showExplanations)}
              className="flex items-center gap-2"
            >
              <HelpCircle className="h-4 w-4" />
              {showExplanations ? 'Hide' : 'Show'} Explanations
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-green-600" />
            Interactive Classification Tool
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Disposition Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Disposition to Klick
              </label>
              <div className="space-y-2">
                {DISPOSITION_OPTIONS.map((disposition) => (
                  <button
                    key={disposition}
                    onClick={() => setSelectedDisposition(disposition)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedDisposition === disposition
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{disposition}</span>
                      {selectedDisposition === disposition && (
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    {showExplanations && (
                      <p className="text-xs text-gray-600 mt-1">
                        {getDispositionDescription(disposition)}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Influence Level Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Influence Level
              </label>
              <div className="space-y-2">
                {INFLUENCE_LEVEL_OPTIONS.map((influence) => (
                  <button
                    key={influence}
                    onClick={() => setSelectedInfluence(influence)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedInfluence === influence
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{influence}</span>
                      {selectedInfluence === influence && (
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    {showExplanations && (
                      <p className="text-xs text-gray-600 mt-1">
                        {getInfluenceDescription(influence)}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result Display */}
          <div className="mt-6 p-4 rounded-lg border" style={{ 
            backgroundColor: currentPalette.background,
            borderColor: currentPalette.border 
          }}>
            <div className="flex items-center gap-3">
              {getLabelIcon(currentLabel)}
              <div>
                <h3 className="font-semibold text-lg" style={{ color: currentPalette.badgeText }}>
                  {currentLabel}
                </h3>
                <p className="text-sm text-gray-600">
                  {getLabelDescription(currentLabel)}
                </p>
              </div>
            </div>
            
            <div className="mt-3 flex items-center gap-2">
              <Badge 
                style={{ 
                  backgroundColor: currentPalette.badgeBackground,
                  color: currentPalette.badgeText 
                }}
              >
                {selectedDisposition} + {selectedInfluence}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Full Matrix Display */}
      {showMatrix && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-600" />
              Complete Classification Matrix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border border-gray-300 p-2 text-left font-medium bg-gray-50">
                      Disposition → Influence
                    </th>
                    {INFLUENCE_LEVEL_OPTIONS.map((influence) => (
                      <th key={influence} className="border border-gray-300 p-2 text-center font-medium bg-gray-50">
                        {influence}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DISPOSITION_OPTIONS.map((disposition) => (
                    <tr key={disposition}>
                      <td className="border border-gray-300 p-2 font-medium bg-gray-50">
                        {disposition}
                      </td>
                      {INFLUENCE_LEVEL_OPTIONS.map((influence) => {
                        const label = deriveContactLabel(disposition, influence)
                        const palette = getLabelPalette(label)
                        const isSelected = selectedDisposition === disposition && selectedInfluence === influence
                        
                        return (
                          <td 
                            key={`${disposition}-${influence}`}
                            className={`border border-gray-300 p-2 text-center cursor-pointer transition-colors ${
                              isSelected ? 'ring-2 ring-blue-500' : ''
                            }`}
                            style={{ 
                              backgroundColor: isSelected ? palette.background : 'white'
                            }}
                            onClick={() => {
                              setSelectedDisposition(disposition)
                              setSelectedInfluence(influence)
                            }}
                          >
                            <div className="flex items-center justify-center gap-1">
                              {getLabelIcon(label)}
                              <span 
                                className="text-sm font-medium"
                                style={{ color: palette.badgeText }}
                              >
                                {label}
                              </span>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Click on any cell in the matrix to see how that combination creates a specific label.
                The current defaults are <strong>{DEFAULT_DISPOSITION}</strong> disposition and <strong>{DEFAULT_INFLUENCE_LEVEL}</strong> influence level.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rules Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-orange-600" />
            How Classification Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">1. Disposition Assessment</h4>
              <p className="text-sm text-gray-600">
                Each contact's disposition toward Klick is assessed as Positive, Neutral, Negative, or Unknown.
                This is typically determined through interactions, feedback, or explicit statements.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">2. Influence Level Analysis</h4>
              <p className="text-sm text-gray-600">
                The contact's influence level is determined by their role, authority, and ability to affect decisions.
                This ranges from Decision Maker (highest authority) to Unknown (not yet assessed).
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">3. Derived Label Generation</h4>
              <p className="text-sm text-gray-600">
                The combination of disposition and influence level creates a derived label that guides engagement strategy.
                For example: Negative + Influencer = Adversary (requires careful management).
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">4. Default Behavior</h4>
              <p className="text-sm text-gray-600">
                New contacts default to <strong>{DEFAULT_DISPOSITION}</strong> disposition and <strong>{DEFAULT_INFLUENCE_LEVEL}</strong> influence level,
                resulting in the <strong>{deriveContactLabel(DEFAULT_DISPOSITION, DEFAULT_INFLUENCE_LEVEL)}</strong> label until further assessment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
