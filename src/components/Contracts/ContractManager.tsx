import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { usePharmaVisualPivotStore } from '@/data/store'
import { 
  CompetitiveContract, 
  ContractScope, 
  ContractStatus, 
  ServiceCategory, 
  SERVICE_CATEGORIES,
  AGENCIES
} from '@/types/domain'
import { Calendar, Plus, Trash2, AlertTriangle } from 'lucide-react'

interface ContractManagerProps {
  companySlug: string
  companyName: string
  brands: Array<{ id: string; name: string; therapeuticArea?: string }>
  therapeuticAreas?: string[]
}

export function ContractManager({ companySlug, companyName, brands, therapeuticAreas = [] }: ContractManagerProps) {
  const {
    competitiveContracts,
    addCompetitiveContract,
    removeCompetitiveContract,
    getActiveContracts,
  } = usePharmaVisualPivotStore()

  const [showAddForm, setShowAddForm] = useState(false)

  const companyContracts = competitiveContracts.filter(c => c.companySlug === companySlug)
  const activeContracts = getActiveContracts(companySlug)

  const [newContract, setNewContract] = useState<Partial<CompetitiveContract>>({
    companySlug,
    agencyName: '',
    scope: 'SERVICE_LINE',
    serviceCategory: undefined,
    therapeuticArea: undefined,
    brandId: undefined,
    startDate: new Date(),
    expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    status: 'ACTIVE',
    description: '',
  })

  const handleAddContract = () => {
    if (!newContract.agencyName || !newContract.scope) return

    addCompetitiveContract({
      companySlug,
      agencyName: newContract.agencyName,
      scope: newContract.scope as ContractScope,
      serviceCategory: newContract.serviceCategory as ServiceCategory,
      therapeuticArea: newContract.therapeuticArea,
      brandId: newContract.brandId,
      startDate: newContract.startDate!,
      expirationDate: newContract.expirationDate!,
      status: newContract.status as ContractStatus,
      description: newContract.description,
    })

    setNewContract({
      companySlug,
      agencyName: '',
      scope: 'SERVICE_LINE',
      serviceCategory: undefined,
      therapeuticArea: undefined,
      brandId: undefined,
      startDate: new Date(),
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      description: '',
    })
    setShowAddForm(false)
  }

  const getContractStatusColor = (status: ContractStatus, expirationDate: Date) => {
    const now = new Date()
    const daysUntilExpiry = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (status === 'EXPIRED' || daysUntilExpiry < 0) return 'text-red-600 bg-red-50'
    if (status === 'EXPIRING_SOON' || daysUntilExpiry <= 30) return 'text-orange-600 bg-orange-50'
    if (status === 'TERMINATED') return 'text-gray-600 bg-gray-50'
    return 'text-green-600 bg-green-50'
  }

  const getScopeDescription = (contract: CompetitiveContract) => {
    switch (contract.scope) {
      case 'SERVICE_LINE':
        return `Service Line: ${contract.serviceCategory}`
      case 'THERAPEUTIC_AREA':
        return `Therapeutic Area: ${contract.therapeuticArea}`
      case 'BRAND_SPECIFIC':
        const brand = brands.find(b => b.id === contract.brandId)
        return `Brand: ${brand?.name || 'Unknown'}`
      default:
        return 'Unknown Scope'
    }
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-6">
        <CardTitle className="text-2xl font-bold flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-white" />
          </div>
          Competitive Contracts
        </CardTitle>
        <p className="text-muted-foreground">
          Manage competitive agency contracts that block Klick opportunities
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Contract Button */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-lg">Active Contracts: {activeContracts.length}</h3>
            <p className="text-sm text-muted-foreground">
              Contracts blocking Klick opportunities at {companyName}
            </p>
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Contract
          </Button>
        </div>

        {/* Add Contract Form */}
        {showAddForm && (
          <Card className="border-2 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-lg">Add Competitive Contract</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Agency Name</label>
                  <select
                    value={newContract.agencyName || ''}
                    onChange={(e) => setNewContract({ ...newContract, agencyName: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">Select Agency</option>
                    {Array.from(AGENCIES).map(agency => (
                      <option key={agency} value={agency}>{agency}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Contract Scope</label>
                  <select
                    value={newContract.scope || 'SERVICE_LINE'}
                    onChange={(e) => setNewContract({ ...newContract, scope: e.target.value as ContractScope })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="SERVICE_LINE">Service Line</option>
                    <option value="THERAPEUTIC_AREA">Therapeutic Area</option>
                    <option value="BRAND_SPECIFIC">Brand Specific</option>
                  </select>
                </div>
              </div>

              {/* Scope-specific fields */}
              {newContract.scope === 'SERVICE_LINE' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Service Category</label>
                  <select
                    value={newContract.serviceCategory || ''}
                    onChange={(e) => setNewContract({ ...newContract, serviceCategory: e.target.value as ServiceCategory })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">Select Service</option>
                    {SERVICE_CATEGORIES.map(service => (
                      <option key={service} value={service}>{service}</option>
                    ))}
                  </select>
                </div>
              )}

              {newContract.scope === 'THERAPEUTIC_AREA' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Therapeutic Area</label>
                  <select
                    value={newContract.therapeuticArea || ''}
                    onChange={(e) => setNewContract({ ...newContract, therapeuticArea: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">Select Therapeutic Area</option>
                    {therapeuticAreas.map(ta => (
                      <option key={ta} value={ta}>{ta}</option>
                    ))}
                  </select>
                </div>
              )}

              {newContract.scope === 'BRAND_SPECIFIC' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Brand</label>
                  <select
                    value={newContract.brandId || ''}
                    onChange={(e) => setNewContract({ ...newContract, brandId: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">Select Brand</option>
                    {brands.map(brand => (
                      <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date</label>
                  <input
                    type="date"
                    value={newContract.startDate?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setNewContract({ ...newContract, startDate: new Date(e.target.value) })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Expiration Date</label>
                  <input
                    type="date"
                    value={newContract.expirationDate?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setNewContract({ ...newContract, expirationDate: new Date(e.target.value) })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                <textarea
                  value={newContract.description || ''}
                  onChange={(e) => setNewContract({ ...newContract, description: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  rows={3}
                  placeholder="Additional contract details..."
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddContract} className="bg-green-600 hover:bg-green-700">
                  Add Contract
                </Button>
                <Button onClick={() => setShowAddForm(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contracts List */}
        <div className="space-y-3">
          {companyContracts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No competitive contracts found for {companyName}</p>
              <p className="text-sm">Add contracts to track blocked opportunities</p>
            </div>
          ) : (
            companyContracts.map(contract => (
              <Card key={contract.id} className="border-l-4 border-l-red-500">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-lg">{contract.agencyName}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getContractStatusColor(contract.status, contract.expirationDate)}`}>
                          {contract.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {getScopeDescription(contract)}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Expires: {contract.expirationDate.toLocaleDateString()}</span>
                        </div>
                        {contract.description && (
                          <p className="text-sm">{contract.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeCompetitiveContract(contract.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
