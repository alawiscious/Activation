import { usePharmaVisualPivotStore } from '@/data/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { SERVICE_CATEGORIES, AGENCY_STATUSES } from '@/types/domain'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function Agencies() {
  const { agencies, addAgency, removeAgency, setAgencyMode, setAgencyStatus } = usePharmaVisualPivotStore()
  const [newAgency, setNewAgency] = useState('')
  const [newAgencyUrl, setNewAgencyUrl] = useState('')
  const navigate = useNavigate()

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) navigate(-1)
    else navigate('/')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-end justify-between gap-6 mb-6">
            <div>
              <button type="button" className="text-primary underline mb-4 block" onClick={handleBack}>← Back</button>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 bg-clip-text text-transparent mb-3">
                Agencies Directory
              </h1>
              <p className="text-lg text-muted-foreground font-light">
                Manage pharmaceutical marketing agencies and partnerships
              </p>
            </div>
          </div>
        </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Agency</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <input className="border rounded h-10 px-3 text-sm" placeholder="Agency name" value={newAgency} onChange={(e)=>setNewAgency(e.target.value)} />
          <input className="border rounded h-10 px-3 text-sm" placeholder="Agency website (optional)" value={newAgencyUrl} onChange={(e)=>setNewAgencyUrl(e.target.value)} />
          <button
            className="h-10 px-4 rounded-md border"
            onClick={() => {
              if (!newAgency.trim()) return
              addAgency(newAgency.trim(), newAgencyUrl.trim())
              setNewAgency('')
              setNewAgencyUrl('')
            }}
          >
            Add
          </button>
        </CardContent>
      </Card>

      {agencies.map(a => (
        <Card key={a.name}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {a.logoUrl && (
                  <img src={a.logoUrl} alt={`${a.name} logo`} className="h-8 w-8 rounded" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                )}
                <div>
                  <CardTitle>{a.name}</CardTitle>
                  {a.website && (
                    <a href={a.website} target="_blank" rel="noreferrer" className="text-xs text-primary underline">{a.website}</a>
                  )}
                </div>
              </div>
              <button className="text-sm underline" onClick={()=>removeAgency(a.name)}>Remove</button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Mode</span>
              <input className="border rounded h-8 px-2 text-sm w-80" defaultValue={a.mode || ''} onBlur={(e)=>setAgencyMode(a.name, e.target.value)} placeholder="e.g., In Trouble; Heavily Recruiting for X" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from(SERVICE_CATEGORIES).map(sc => (
                <div key={sc} className="flex items-center justify-between border rounded p-2">
                  <div className="text-sm font-medium">{sc}</div>
                  <select className="border rounded h-8 px-2 text-sm bg-background" value={(a.serviceStatus as any)[sc] || ''} onChange={(e)=>setAgencyStatus(a.name, sc, e.target.value)}>
                    <option value="">—</option>
                    {Array.from(AGENCY_STATUSES).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
      </div>
    </div>
  )
}
