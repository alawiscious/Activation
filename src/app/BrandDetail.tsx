import { useParams, Link, useNavigate } from 'react-router-dom'
import { usePharmaVisualPivotStore } from '@/data/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { BrandRevenueChart } from '@/components/Brands/BrandRevenueChart'
import { selectors } from '@/data/selectors'
import { AGENCIES, SERVICE_CATEGORIES } from '@/types/domain'

export function BrandDetail() {
  const { id } = useParams()
  const { currentCompanySlug, companies, updateBrand, setCurrentCompany } = usePharmaVisualPivotStore()
  const navigate = useNavigate()
  let company = currentCompanySlug ? companies[currentCompanySlug] : null
  let brand = company?.brands.find(b => b.id === id)
  if (!brand) {
    // Search across all companies and set the current company if found
    for (const c of Object.values(companies)) {
      const b = c.brands.find(b => b.id === id)
      if (b) {
        company = c
        brand = b
        if (currentCompanySlug !== c.slug) setCurrentCompany(c.slug)
        break
      }
    }
  }

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) navigate(-1)
    else navigate('/')
  }

  if (!company || !brand) {
    return (
      <div className="container mx-auto p-6">
        <button type="button" className="text-primary underline" onClick={handleBack}>Back</button>
        <div className="mt-4">Brand not found.</div>
      </div>
    )
  }

  const revenueData = selectors.selectRevenueSeriesByBrand(company)(brand.id)

  const setAgency = (service: (typeof SERVICE_CATEGORIES)[number], agency: string) => {
    const next = { ...(brand.services || {}) }
    next[service] = agency
    updateBrand(brand.id, { services: next })
  }

  const setRevenue = (service: (typeof SERVICE_CATEGORIES)[number], value: string) => {
    const amount = value ? parseFloat(value) : NaN
    const rev = { ...(brand.servicesRevenue || {}) }
    if (!isNaN(amount)) {
      rev[service] = amount
    } else {
      delete rev[service]
    }
    updateBrand(brand.id, { servicesRevenue: rev })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button type="button" className="text-primary underline" onClick={handleBack}>Back</button>
          <h1 className="text-3xl font-bold mt-2">{brand.name}</h1>
          <div className="text-sm text-muted-foreground">Therapeutic Area: <Link to={`/ta/${encodeURIComponent(brand.therapeuticArea)}`} className="text-primary underline">{brand.therapeuticArea}</Link></div>
          <div className="text-sm text-muted-foreground">Stage: {brand.indicationMarketStatus || 'Unknown'}</div>
          {brand.molecule && <div className="text-sm text-muted-foreground">Molecule: {brand.molecule}</div>}
          {brand.indication && <div className="text-sm text-muted-foreground">Indication: {brand.indication}</div>}
        </div>
      </div>

      <BrandRevenueChart data={revenueData} brandName={brand.name} />

      <Card>
        <CardHeader>
          <CardTitle>Service Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {SERVICE_CATEGORIES.map(sc => {
              const assigned = (brand.services || {})[sc] || ''
              const isKlick = assigned.toLowerCase() === 'klick'
              const rev = (brand.servicesRevenue || {})[sc] || ''
              return (
                <div key={sc} className="flex items-center justify-between border rounded p-2 gap-3">
                  <div className="text-sm font-medium w-32">{sc}</div>
                  <select
                    className="border rounded h-8 px-2 text-sm bg-background"
                    value={assigned}
                    onChange={(e) => setAgency(sc, e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {Array.from(AGENCIES).map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                  <div className="text-xs text-muted-foreground">{isKlick ? 'Klick CY Revenue ($)' : 'CY Revenue ($)'}</div>
                  <input
                    type="number"
                    className="border rounded h-8 px-2 text-sm w-32"
                    value={String(rev)}
                    onChange={(e)=> setRevenue(sc, e.target.value)}
                    placeholder="0"
                  />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
