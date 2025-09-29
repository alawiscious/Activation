import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { MultiSelect } from './MultiSelect'
import { Filter, X, Search } from 'lucide-react'
import { usePharmaVisualPivotStore } from '@/data/store'
import { selectors } from '@/data/selectors'
import type { Filters } from '@/types/domain'

export function FilterBar() {
  const {
    currentCompanySlug,
    companies,
    updateFilters,
    resetFilters,
  } = usePharmaVisualPivotStore()

  const [titleSearch, setTitleSearch] = useState('')
  const [debouncedTitleSearch, setDebouncedTitleSearch] = useState('')

  // Debounce title search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTitleSearch(titleSearch)
    }, 300)

    return () => clearTimeout(timer)
  }, [titleSearch])

  const currentCompany = currentCompanySlug ? companies[currentCompanySlug] : null
  const currentFilters = currentCompany?.filters || {
    brands: [],
    therapeuticAreas: [],
    functionalAreas: [],
    levels: [],
    roleLevels: [],
    seniorities: [],
    stages: [],
    locations: [],
    titleSearch: '',
    knownOnly: false,
  }

  // Get filter options using selectors
  const filterOptions = useMemo(() => {
    if (!currentCompany) return {
      brands: [] as string[],
      therapeuticAreas: [] as string[],
      functionalAreas: [] as string[],
      locations: [] as string[],
      roleLevels: [] as string[],
      seniorities: [] as string[],
      stages: [] as string[],
    }

    return {
      brands: selectors.selectBrandOptions(currentCompany),
      therapeuticAreas: selectors.selectTherapeuticAreaOptions(currentCompany),
      functionalAreas: selectors.selectFunctionalAreaOptions(currentCompany),
      locations: selectors.selectLocationOptions(currentCompany),
      roleLevels: selectors.selectRoleOptions(currentCompany),
      seniorities: selectors.selectSeniorityOptions(currentCompany),
      stages: selectors.selectStageOptions(currentCompany),
    }
  }, [currentCompany])

  // Update filters when debounced search changes
  React.useEffect(() => {
    if (debouncedTitleSearch !== currentFilters.titleSearch) {
      updateFilters({ titleSearch: debouncedTitleSearch })
    }
  }, [debouncedTitleSearch, currentFilters.titleSearch, updateFilters])

  const handleFilterChange = (filterType: keyof Filters, value: any) => {
    updateFilters({ [filterType]: value })
  }

  const handleKnownOnlyToggle = () => {
    updateFilters({ knownOnly: !currentFilters.knownOnly })
  }

  const clearFilter = (filterType: keyof Filters) => {
    switch (filterType) {
      case 'brands':
        updateFilters({ brands: [] })
        break
      case 'therapeuticAreas':
        updateFilters({ therapeuticAreas: [] })
        break
      case 'functionalAreas':
        updateFilters({ functionalAreas: [] })
        break
      case 'levels':
        updateFilters({ levels: [] })
        break
      case 'locations':
        updateFilters({ locations: [] })
        break
      case 'titleSearch':
        setTitleSearch('')
        updateFilters({ titleSearch: '' })
        break
      case 'knownOnly':
        updateFilters({ knownOnly: false })
        break
    }
  }

  const hasActiveFilters = 
    currentFilters.brands.length > 0 ||
    currentFilters.therapeuticAreas.length > 0 ||
    currentFilters.functionalAreas.length > 0 ||
    (currentFilters.roleLevels?.length || 0) > 0 ||
    (currentFilters.seniorities?.length || 0) > 0 ||
    (currentFilters.stages?.length || 0) > 0 ||
    (currentFilters.locations?.length || 0) > 0 ||
    currentFilters.titleSearch.length > 0 ||
    currentFilters.knownOnly

  if (!currentCompany) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="ml-auto"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Title Search */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Title Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title..."
              value={titleSearch}
              onChange={(e) => setTitleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          {currentFilters.titleSearch && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                "{currentFilters.titleSearch}"
                <button
                  onClick={() => clearFilter('titleSearch')}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            </div>
          )}
        </div>

        {/* Multi-select filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MultiSelect
            label="Brands"
            options={filterOptions.brands}
            selected={currentFilters.brands}
            onChange={(selected) => handleFilterChange('brands', selected)}
            placeholder="Select brands..."
            onClear={() => clearFilter('brands')}
          />

          <MultiSelect
            label="Therapeutic Areas"
            options={filterOptions.therapeuticAreas}
            selected={currentFilters.therapeuticAreas}
            onChange={(selected) => handleFilterChange('therapeuticAreas', selected)}
            placeholder="Select therapeutic areas..."
            onClear={() => clearFilter('therapeuticAreas')}
          />

          <MultiSelect
            label="Functional Areas"
            options={filterOptions.functionalAreas}
            selected={currentFilters.functionalAreas}
            onChange={(selected) => handleFilterChange('functionalAreas', selected)}
            placeholder="Select functional areas..."
            onClear={() => clearFilter('functionalAreas')}
          />

          <MultiSelect
            label="Country"
            options={filterOptions.locations}
            selected={currentFilters.locations || []}
            onChange={(selected) => handleFilterChange('locations', selected)}
            placeholder="Select countries..."
            onClear={() => clearFilter('locations')}
          />

          <MultiSelect
            label="Stages"
            options={filterOptions.stages}
            selected={currentFilters.stages || []}
            onChange={(selected) => handleFilterChange('stages', selected)}
            placeholder="Select stages..."
            onClear={() => updateFilters({ stages: [] })}
          />

          <MultiSelect
            label="Roles"
            options={filterOptions.roleLevels}
            selected={currentFilters.roleLevels || []}
            onChange={(selected) => handleFilterChange('roleLevels', selected)}
            placeholder="Select roles..."
            onClear={() => updateFilters({ roleLevels: [] })}
          />

          <MultiSelect
            label="Seniorities"
            options={filterOptions.seniorities}
            selected={currentFilters.seniorities || []}
            onChange={(selected) => handleFilterChange('seniorities', selected)}
            placeholder="Select seniorities..."
            onClear={() => updateFilters({ seniorities: [] })}
          />
        </div>

        {/* Known Only Toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="knownOnly"
            checked={currentFilters.knownOnly}
            onChange={handleKnownOnlyToggle}
            className="rounded"
          />
          <label htmlFor="knownOnly" className="text-sm font-medium">
            Show only known contacts
          </label>
          {currentFilters.knownOnly && (
            <button
              onClick={() => clearFilter('knownOnly')}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">Active filters:</span>
              {currentFilters.brands.map(brand => (
                <Badge key={brand} variant="secondary" className="text-xs">
                  Brand: {brand}
                  <button
                    onClick={() => {
                      const newBrands = currentFilters.brands.filter(b => b !== brand)
                      handleFilterChange('brands', newBrands)
                    }}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {currentFilters.therapeuticAreas.map(area => (
                <Badge key={area} variant="secondary" className="text-xs">
                  TA: {area}
                  <button
                    onClick={() => {
                      const newAreas = currentFilters.therapeuticAreas.filter(a => a !== area)
                      handleFilterChange('therapeuticAreas', newAreas)
                    }}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {currentFilters.functionalAreas.map(area => (
                <Badge key={area} variant="secondary" className="text-xs">
                  FA: {area}
                  <button
                    onClick={() => {
                      const newAreas = currentFilters.functionalAreas.filter(a => a !== area)
                      handleFilterChange('functionalAreas', newAreas)
                    }}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {(currentFilters.locations || []).map(location => (
                <Badge key={location} variant="secondary" className="text-xs">
                  Country: {location}
                  <button
                    onClick={() => {
                      const newLocations = (currentFilters.locations || []).filter(l => l !== location)
                      handleFilterChange('locations', newLocations)
                    }}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {(currentFilters.roleLevels || []).map(level => (
                <Badge key={level} variant="secondary" className="text-xs">
                  Role: {level}
                  <button
                    onClick={() => {
                      const newLevels = (currentFilters.roleLevels || []).filter(l => l !== level)
                      handleFilterChange('roleLevels', newLevels)
                    }}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {(currentFilters.seniorities || []).map(s => (
                <Badge key={s} variant="secondary" className="text-xs">
                  Seniority: {s}
                  <button
                    onClick={() => {
                      const next = (currentFilters.seniorities || []).filter(x => x !== s)
                      handleFilterChange('seniorities', next)
                    }}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {(currentFilters.stages || []).map(s => (
                <Badge key={s} variant="secondary" className="text-xs">
                  Stage: {s}
                  <button
                    onClick={() => {
                      const next = (currentFilters.stages || []).filter(x => x !== s)
                      handleFilterChange('stages', next)
                    }}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {currentFilters.knownOnly && (
                <Badge variant="secondary" className="text-xs">
                  Known Only
                  <button
                    onClick={() => clearFilter('knownOnly')}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}








