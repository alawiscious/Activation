import { useParams, useNavigate } from 'react-router-dom'
import { usePharmaVisualPivotStore } from '@/data/store'
import { Button } from '@/components/ui/Button'
import { ArrowLeft } from 'lucide-react'
import { Navigation } from '@/components/Shared/Navigation'

export function CompanySimple() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { companies, isHydrated, isLoading } = usePharmaVisualPivotStore()
  const company = slug ? companies[slug] : null

  console.log('CompanySimple debug:', {
    slug,
    isHydrated,
    isLoading,
    companiesCount: Object.keys(companies).length,
    companySlugs: Object.keys(companies),
    company: company ? { name: company.name, slug: company.slug } : null
  })

  // Show loading state while hydrating
  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto p-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
            <p className="text-gray-600">Loading company data...</p>
            <p className="text-sm text-gray-500 mt-2">
              Hydrated: {isHydrated ? 'Yes' : 'No'} | Loading: {isLoading ? 'Yes' : 'No'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate('/analytics')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Analytics
          </Button>
        </div>
        
        <h1 className="text-3xl font-bold mb-6">Company Page (Simple Test)</h1>
        
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <div className="space-y-2 text-sm">
            <p><strong>URL Slug:</strong> {slug || 'No slug'}</p>
            <p><strong>Hydrated:</strong> {isHydrated ? 'Yes' : 'No'}</p>
            <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
            <p><strong>Companies Count:</strong> {Object.keys(companies).length}</p>
            <p><strong>Available Slugs:</strong> {Object.keys(companies).join(', ')}</p>
            <p><strong>Company Found:</strong> {company ? 'Yes' : 'No'}</p>
            {company && (
              <>
                <p><strong>Company Name:</strong> {company.name}</p>
                <p><strong>Company Slug:</strong> {company.slug}</p>
                <p><strong>Brands Count:</strong> {company.brands?.length || 0}</p>
                <p><strong>Contacts Count:</strong> {company.contacts?.length || 0}</p>
                <p><strong>Revenue Rows Count:</strong> {company.revenueRows?.length || 0}</p>
              </>
            )}
          </div>
        </div>

        {company ? (
          <div className="mt-6 bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Company Found!</h3>
            <p className="text-green-700">The company page is working. The issue was likely in the complex data processing.</p>
          </div>
        ) : (
          <div className="mt-6 bg-red-50 p-4 rounded-lg border border-red-200">
            <h3 className="text-lg font-semibold text-red-800 mb-2">❌ Company Not Found</h3>
            <p className="text-red-700">The company with slug "{slug}" was not found in the store.</p>
            <p className="text-red-600 text-sm mt-2">Available companies: {Object.keys(companies).join(', ')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
