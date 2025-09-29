import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ChevronDown, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MultiSelectProps {
  label: string
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  onClear?: () => void
  className?: string
}

export function MultiSelect({
  label,
  options,
  selected,
  onChange,
  placeholder = 'Select options...',
  onClear,
  className,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleToggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option))
    } else {
      onChange([...selected, option])
    }
  }

  const handleSelectAll = () => {
    if (selected.length === filteredOptions.length) {
      // Deselect all filtered options
      const newSelected = selected.filter(item => !filteredOptions.includes(item))
      onChange(newSelected)
    } else {
      // Select all filtered options
      const newSelected = [...new Set([...selected, ...filteredOptions])]
      onChange(newSelected)
    }
  }

  const handleClear = () => {
    onChange([])
    onClear?.()
  }

  const isAllSelected = filteredOptions.length > 0 && filteredOptions.every(option => selected.includes(option))

  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium">{label}</label>
      
      <div className="relative" ref={dropdownRef}>
        {/* Trigger Button */}
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-between h-10"
        >
          <span className="truncate">
            {selected.length === 0 
              ? placeholder 
              : `${selected.length} selected`
            }
          </span>
          <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
        </Button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-hidden">
            {/* Search Input */}
            <div className="p-2 border-b">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-1 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Select All Button */}
            {filteredOptions.length > 0 && (
              <div className="p-2 border-b">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="w-full justify-start h-8"
                >
                  <Check className={cn('h-4 w-4 mr-2', isAllSelected ? 'opacity-100' : 'opacity-0')} />
                  {isAllSelected ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            )}

            {/* Options List */}
            <div className="max-h-40 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleToggle(option)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                  >
                    <Check className={cn('h-4 w-4', selected.includes(option) ? 'opacity-100' : 'opacity-0')} />
                    <span className="truncate">{option}</span>
                  </button>
                ))
              )}
            </div>

            {/* Clear Button */}
            {selected.length > 0 && (
              <div className="p-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="w-full justify-start h-8 text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Items */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((item) => (
            <Badge key={item} variant="secondary" className="text-xs">
              {item}
              <button
                onClick={() => handleToggle(item)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
