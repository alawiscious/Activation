import { useState } from 'react'
import { ChevronDown, ChevronUp, ChevronsUp } from 'lucide-react'

interface SectionButtonsProps {
  onCollapseTier?: () => void
  onCollapseCompanies?: () => void
  onExpandCompanies?: () => void
  showCollapseTier?: boolean
  showCollapseCompanies?: boolean
  showExpandCompanies?: boolean
}

export function SectionButtons({
  onCollapseTier,
  onCollapseCompanies,
  onExpandCompanies,
  showCollapseTier = true,
  showCollapseCompanies = true,
  showExpandCompanies = true,
}: SectionButtonsProps) {
  const [isTierCollapsed, setIsTierCollapsed] = useState(false)
  const [areCompaniesCollapsed, setAreCompaniesCollapsed] = useState(false)

  const handleCollapseTier = () => {
    setIsTierCollapsed(!isTierCollapsed)
    onCollapseTier?.()
  }

  const handleCollapseCompanies = () => {
    setAreCompaniesCollapsed(!areCompaniesCollapsed)
    onCollapseCompanies?.()
  }

  const handleExpandCompanies = () => {
    setAreCompaniesCollapsed(false)
    onExpandCompanies?.()
  }

  return (
    <div className="flex items-center gap-4 mb-6">
      {showCollapseTier && (
        <button
          onClick={handleCollapseTier}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
        >
          {isTierCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          {isTierCollapsed ? 'Expand Tier' : 'Collapse Tier'}
        </button>
      )}
      
      {showCollapseCompanies && (
        <button
          onClick={handleCollapseCompanies}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
        >
          {areCompaniesCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          {areCompaniesCollapsed ? 'Expand Companies' : 'Collapse Companies'}
        </button>
      )}
      
      {showExpandCompanies && (
        <button
          onClick={handleExpandCompanies}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 hover:border-blue-400 transition-colors"
        >
          <ChevronsUp className="h-4 w-4" />
          Expand All Companies
        </button>
      )}
    </div>
  )
}
