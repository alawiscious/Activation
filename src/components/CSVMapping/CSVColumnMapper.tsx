import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Search, ArrowRight, Check, X, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CompanyMapping {
  masterCompany: string
  contactCompanies: string[]
}

interface CSVColumnMapperProps {
  masterCompanies: string[]
  contactCompanies: string[]
  onMappingComplete: (mapping: CompanyMapping[]) => void
  onCancel: () => void
  className?: string
}

export function CSVColumnMapper({
  masterCompanies,
  contactCompanies,
  onMappingComplete,
  onCancel,
  className,
}: CSVColumnMapperProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMasterCompany, setSelectedMasterCompany] = useState<string | null>(null)
  const [mappings, setMappings] = useState<CompanyMapping[]>([])
  const [selectedContactCompanies, setSelectedContactCompanies] = useState<string[]>([])

  // Filter master companies based on search
  const filteredMasterCompanies = useMemo(() => {
    if (!searchTerm.trim()) return masterCompanies
    return masterCompanies.filter(company =>
      company.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [masterCompanies, searchTerm])

  // Filter contact companies based on selected master company
  const filteredContactCompanies = useMemo(() => {
    if (!selectedMasterCompany) return []
    
    const masterLower = selectedMasterCompany.toLowerCase()
    return contactCompanies.filter(company => {
      const companyLower = company.toLowerCase()
      return (
        companyLower.includes(masterLower) ||
        masterLower.includes(companyLower) ||
        // Check for common variations
        companyLower.includes(masterLower.split(' ')[0]) ||
        masterLower.includes(companyLower.split(' ')[0])
      )
    })
  }, [contactCompanies, selectedMasterCompany])

  // Get unmapped contact companies
  const mappedContactCompanies = useMemo(() => {
    return new Set(mappings.flatMap(m => m.contactCompanies))
  }, [mappings])

  const unmappedContactCompanies = useMemo(() => {
    return contactCompanies.filter(company => !mappedContactCompanies.has(company))
  }, [contactCompanies, mappedContactCompanies])

  const handleMasterCompanySelect = (company: string) => {
    setSelectedMasterCompany(company)
    setSelectedContactCompanies([])
  }

  const handleContactCompanyToggle = (company: string) => {
    setSelectedContactCompanies(prev =>
      prev.includes(company)
        ? prev.filter(c => c !== company)
        : [...prev, company]
    )
  }

  const handleCreateMapping = () => {
    if (!selectedMasterCompany || selectedContactCompanies.length === 0) return

    const newMapping: CompanyMapping = {
      masterCompany: selectedMasterCompany,
      contactCompanies: [...selectedContactCompanies],
    }

    setMappings(prev => [...prev, newMapping])
    setSelectedMasterCompany(null)
    setSelectedContactCompanies([])
  }

  const handleRemoveMapping = (index: number) => {
    setMappings(prev => prev.filter((_, i) => i !== index))
  }

  const handleComplete = () => {
    onMappingComplete(mappings)
  }

  const isMappingComplete = unmappedContactCompanies.length === 0

  return (
    <div className={cn('space-y-6', className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Map Contacts to Companies
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {contactCompanies.length} company variations detected. Map contact companies to master companies before importing.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side - Master Companies */}
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Master Company List</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search master companies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {filteredMasterCompanies.length} companies found
                </p>
              </div>
              
              <div className="border rounded-lg max-h-80 overflow-y-auto">
                {filteredMasterCompanies.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No companies found matching "{searchTerm}"
                  </div>
                ) : (
                  filteredMasterCompanies.map((company) => (
                    <button
                      key={company}
                      onClick={() => handleMasterCompanySelect(company)}
                      className={cn(
                        'w-full text-left px-3 py-2 hover:bg-muted border-b last:border-b-0 transition-colors',
                        selectedMasterCompany === company && 'bg-primary text-primary-foreground hover:bg-primary/90'
                      )}
                    >
                      {company}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Right Side - Contact Companies */}
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">
                  Potential Matches
                  {selectedMasterCompany && (
                    <span className="text-sm text-muted-foreground ml-2">
                      for "{selectedMasterCompany}"
                    </span>
                  )}
                </h3>
                {selectedMasterCompany && (
                  <p className="text-xs text-muted-foreground">
                    {filteredContactCompanies.length} potential matches found
                  </p>
                )}
              </div>
              
              <div className="border rounded-lg max-h-80 overflow-y-auto">
                {!selectedMasterCompany ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Select a master company to see potential matches
                  </div>
                ) : filteredContactCompanies.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No potential matches found for "{selectedMasterCompany}"
                  </div>
                ) : (
                  filteredContactCompanies.map((company) => (
                    <label
                      key={company}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-muted border-b last:border-b-0 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedContactCompanies.includes(company)}
                        onChange={() => handleContactCompanyToggle(company)}
                        className="rounded"
                      />
                      <span className="flex-1">{company}</span>
                    </label>
                  ))
                )}
              </div>

              {selectedMasterCompany && selectedContactCompanies.length > 0 && (
                <Button onClick={handleCreateMapping} className="w-full">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Create Mapping ({selectedContactCompanies.length} companies)
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Mappings */}
      {mappings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Current Mappings</CardTitle>
            <p className="text-sm text-muted-foreground">
              These mappings will be applied when you complete the import
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mappings.map((mapping, index) => (
                <div key={index} className="flex items-center gap-4 p-3 border rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <div className="font-medium">{mapping.masterCompany}</div>
                    <div className="text-sm text-muted-foreground">
                      Maps to {mapping.contactCompanies.length} contact companies
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {mapping.contactCompanies.map((company) => (
                      <Badge key={company} variant="secondary">
                        {company}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMapping(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unmapped Companies Summary */}
      {unmappedContactCompanies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-orange-600">Unmapped Contact Companies</CardTitle>
            <p className="text-sm text-muted-foreground">
              {unmappedContactCompanies.length} companies from your contacts CSV haven't been mapped yet. You must map all companies before importing.
            </p>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <p>Sample unmapped companies:</p>
              <div className="mt-2 flex gap-2 flex-wrap">
                {unmappedContactCompanies.slice(0, 10).map((company) => (
                  <Badge key={company} variant="outline" className="text-orange-600 border-orange-200">
                    {company}
                  </Badge>
                ))}
                {unmappedContactCompanies.length > 10 && (
                  <Badge variant="outline" className="text-orange-600 border-orange-200">
                    +{unmappedContactCompanies.length - 10} more...
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel Import
        </Button>
        <Button 
          onClick={handleComplete} 
          disabled={!isMappingComplete}
          className="flex items-center gap-2"
        >
          <Check className="h-4 w-4" />
          Complete Mapping & Import
          {!isMappingComplete && (
            <span className="text-xs">
              ({unmappedContactCompanies.length} unmapped)
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}