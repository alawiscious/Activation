import { useParams, Link, useNavigate } from 'react-router-dom'
import { usePharmaVisualPivotStore } from '@/data/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { AGENCIES, SERVICE_CATEGORIES } from '@/types/domain'

export function TherapeuticAreaServices() {
  const { name } = useParams()
  const ta = decodeURIComponent(name || '')
  const { currentCompanySlug, companies, updateBrand } = usePharmaVisualPivotStore()
  const navigate = useNavigate()
  const company = currentCompanySlug ? companies[currentCompanySlug] : null
  const brands = (company?.brands || []).filter(b => (b.therapeuticArea || '').toLowerCase() === ta.toLowerCase())

  const setAgency = (brandId: string, service: (typeof SERVICE_CATEGORIES)[number], agency: string) => {
    const brand = company?.brands.find(b => b.id === brandId)
    if (!brand) return
    const next = { ...(brand.services || {}) }
    next[service] = agency
    updateBrand(brandId, { services: next })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            type="button"
            className="text-primary underline"
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) navigate(-1)
              else navigate('/')
            }}
          >
            Back
          </button>
          <h1 className="text-3xl font-bold mt-2">{ta} — Services</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agency by Service</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="min-w-full border text-sm">
              <thead>
                <tr>
                  <th className="border px-2 py-1 text-center">Brand</th>
                  {SERVICE_CATEGORIES.map(sc => (
                    <th key={sc} className="border px-2 py-1 text-center">{sc}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {brands.map(b => (
                  <tr key={b.id}>
                    <td className="border px-2 py-1">
                      <Link to={`/brand/${b.id}`} className="text-primary underline">{b.name}</Link>
                    </td>
                    {SERVICE_CATEGORIES.map(sc => {
                      const val = (b.services || {})[sc] || ''
                      const isKlick = val.toLowerCase() === 'klick'
                      const isUnassigned = !val || val === ''
                      
                      // Determine cell background color
                      let cellBgColor = ''
                      if (isKlick) {
                        cellBgColor = 'bg-blue-100'
                      } else if (isUnassigned) {
                        cellBgColor = 'bg-green-100'
                      } else {
                        cellBgColor = 'bg-red-100'
                      }
                      
                      return (
                        <td key={sc} className={`border px-2 py-1 ${cellBgColor}`}>
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium">
                              {val || 'Unassigned'}
                            </span>
                            <select
                              className="border rounded h-8 px-2 text-xs bg-background"
                              value={val}
                              onChange={(e) => setAgency(b.id, sc, e.target.value)}
                            >
                              <option value="">Unassigned</option>
                              {Array.from(AGENCIES).map(a => (
                                <option key={a} value={a}>{a}</option>
                              ))}
                            </select>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
