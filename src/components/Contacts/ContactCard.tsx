import { cn } from '@/lib/utils'
import type { AgencyAlignment, Contact, DispositionToKlick, InfluenceLevel } from '@/types/domain'
import { usePharmaVisualPivotStore } from '@/data/store'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AGENCY_ALIGNMENT_OPTIONS,
  DISPOSITION_OPTIONS,
  INFLUENCE_LEVEL_OPTIONS,
  formatDerivedLabel,
  getLabelPalette,
} from '@/lib/contactLabeling'
import { GenomeEnrichment } from './GenomeEnrichment'
import RichLinkedInProfile from './RichLinkedInProfile'

interface ContactCardProps {
  contact: Contact
  className?: string
  draggable?: boolean
  onDragStart?: (e: React.DragEvent, contact: Contact) => void
  variant?: 'small' | 'full'
}

export function ContactCard({ contact, className, draggable, onDragStart, variant = 'full' }: ContactCardProps) {
  const { updateContact, currentCompanySlug, companies } = usePharmaVisualPivotStore()
  const navigate = useNavigate()
  const company = currentCompanySlug ? companies[currentCompanySlug] : null
  const [editing, setEditing] = useState(false)
  const [brand, setBrand] = useState(contact.brand || 'Unknown')
  const [thera, setThera] = useState(contact.therapeuticArea || 'Unknown')
  const [func, setFunc] = useState(contact.functionalArea || 'Unknown')
  const [functionGroup, setFunctionGroup] = useState(contact.functionalGroup || '')
  const [seniorityDesc, setSeniorityDesc] = useState(contact.seniorityLevelDesc || '')
  const [showRichProfile, setShowRichProfile] = useState(false)

  const palette = getLabelPalette(contact.derivedLabel)
  const derivedLabelDisplay = formatDerivedLabel(
    contact.derivedLabel,
    contact.dispositionToKlick,
    contact.agencyAlignment,
  )
  const cardStyle = {
    borderColor: palette.border,
    backgroundColor: palette.background,
  }
  const badgeStyle = {
    borderColor: palette.badgeText,
    backgroundColor: palette.badgeBackground,
    color: palette.badgeText,
  }

  const saveEdits = () => {
    updateContact(contact.id, {
      brand: brand?.trim() || 'Unknown',
      therapeuticArea: thera?.trim() || 'Unknown',
      functionalArea: func?.trim() || 'Unknown',
      functionalGroup: functionGroup?.trim() || undefined,
      seniorityLevelDesc: seniorityDesc?.trim() || undefined,
    })
    setEditing(false)
  }

  const handleCardDoubleClick = () => {
    navigate(`/contacts/${contact.id}`)
  }

  const startText = () => {
    if (contact.startYear && contact.startMonth) {
      const month = new Date(2000, (contact.startMonth || 1) - 1, 1).toLocaleString(undefined, { month: 'short' })
      return `${month}-${contact.startYear}`
    }
    return undefined
  }

  const countryFromLocation = () => {
    if (!contact.location) return undefined
    const parts = contact.location.split(',').map(s => s.trim()).filter(Boolean)
    return parts.length ? parts[parts.length - 1] : contact.location
  }
  const initials = `${contact.firstName?.[0] || ''}${contact.lastName?.[0] || ''}`.toUpperCase()
  if (variant === 'small') {
    return (
      <div
        className={cn('rounded-md border text-card-foreground shadow-sm p-2 flex items-start gap-2 cursor-pointer hover:shadow-md transition-shadow', className)}
        style={cardStyle}
        draggable={draggable}
        onDragStart={(e) => onDragStart?.(e, contact)}
        onDoubleClick={handleCardDoubleClick}
      >
        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{contact.firstName} {contact.lastName}</div>
          <div className="text-xs text-muted-foreground truncate">{contact.title}</div>
          <div className="text-xs text-muted-foreground truncate">{(contact.functionalGroup || contact.functionalArea)}</div>
          <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide">
            <span
              className="px-1.5 py-0.5 rounded border"
              style={badgeStyle}
            >
              {derivedLabelDisplay}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-md border text-card-foreground shadow-sm p-3 flex items-start gap-3 cursor-pointer hover:shadow-md transition-shadow',
        className
      )}
      style={cardStyle}
      draggable={draggable}
      onDragStart={(e) => onDragStart?.(e, contact)}
      onDoubleClick={handleCardDoubleClick}
    >
      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
        {initials}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{contact.firstName} {contact.lastName}</div>
        <div className="mt-1 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide">
          <span
            className="px-2 py-0.5 rounded border"
            style={badgeStyle}
          >
            {derivedLabelDisplay}
          </span>
        </div>
        <div className="text-xs text-muted-foreground truncate">
          <span className="font-medium">Title:</span>{' '}
          {editing ? (
            <input 
              className="border rounded px-1 h-6 w-48 mr-1 text-xs" 
              defaultValue={contact.title} 
              onBlur={(e)=>updateContact(contact.id,{ title: e.target.value })}
              title="Edit contact title"
              aria-label="Contact title"
            />
          ) : (
            contact.title
          )}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          <span className="font-medium">Function:</span>{' '}
          {editing ? (
            <input 
              className="border rounded px-1 h-6 w-40 mr-1 text-xs" 
              value={functionGroup} 
              onChange={(e)=>setFunctionGroup(e.target.value)} 
              placeholder="Functional Group"
              title="Edit functional group"
              aria-label="Functional group"
            />
          ) : (
            (contact.functionalGroup || contact.functionalArea)
          )}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          <span className="font-medium">Level:</span>{' '}
          {editing ? (
            <input 
              className="border rounded px-1 h-6 w-40 mr-1 text-xs" 
              value={seniorityDesc} 
              onChange={(e)=>setSeniorityDesc(e.target.value)} 
              placeholder="Seniority Level"
              title="Edit seniority level"
              aria-label="Seniority level"
            />
          ) : (
            contact.seniorityLevelDesc || contact.level
          )}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          <span className="font-medium">Brand/TA/Function:</span>{' '}
          {editing ? (
            <>
              {company ? (
                <select
                  className="border rounded h-6 text-xs mr-1"
                  value={brand}
                  onChange={(e)=>{
                    const val = e.target.value
                    setBrand(val)
                    const b = company.brands.find(x => x.name === val)
                    if (b) {
                      setThera(b.therapeuticArea || 'Unknown')
                      updateContact(contact.id, { brand: b.name, therapeuticArea: b.therapeuticArea || 'Unknown', indication: b.indication })
                    }
                  }}
                  title="Select brand"
                  aria-label="Brand selection"
                >
                  <option value="Unknown">Select brand…</option>
                  {company.brands.map(b => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              ) : (
                <input className="border rounded px-1 h-6 w-24 mr-1 text-xs" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Brand" />
              )}
              <input className="border rounded px-1 h-6 w-28 mr-1 text-xs" value={thera} onChange={(e) => setThera(e.target.value)} placeholder="Therapeutic Area" />
              <input className="border rounded px-1 h-6 w-28 mr-1 text-xs" value={func} onChange={(e) => setFunc(e.target.value)} placeholder="Functional Area" />
              <button className="text-primary underline text-xs" onClick={saveEdits}>Save</button>
            </>
          ) : (
            <>
              {(contact.brand || 'Unknown')}{contact.therapeuticArea ? ` • ${contact.therapeuticArea}` : ''} • {(contact.functionalArea || 'Unknown')}
              <button className="ml-2 text-primary underline" onClick={() => setEditing(true)}>Edit</button>
            </>
          )}
        </div>
        {contact.indication && (
          <div className="text-xs text-muted-foreground truncate"><span className="font-medium">Indication:</span> {contact.indication}</div>
        )}
        {contact.currCompany && (
          <div className="text-xs text-muted-foreground truncate"><span className="font-medium">Company:</span> {contact.currCompany}</div>
        )}
        {startText() && (
          <div className="text-xs text-muted-foreground truncate"><span className="font-medium">Start:</span> {startText()}</div>
        )}
        {countryFromLocation() && (
          <div className="text-xs text-muted-foreground truncate"><span className="font-medium">Country:</span> {countryFromLocation()}</div>
        )}
        {(contact.lastEmailDate || contact.lastKlickster) && (
          <div className="text-xs text-muted-foreground truncate"><span className="font-medium">Last email:</span> {contact.lastKlickster ? `${contact.lastKlickster}-` : ''}{contact.lastEmailDate}</div>
        )}
        {contact.linkedinUrl && (
          <div className="text-xs truncate">
            <a className="text-primary underline" href={contact.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn Profile</a>
            {(contact.education || contact.positions || contact.skills) && (
              <button 
                className="ml-2 text-blue-600 hover:text-blue-800 underline"
                onClick={() => setShowRichProfile(!showRichProfile)}
              >
                {showRichProfile ? 'Hide Rich Profile' : 'Show Rich Profile'}
              </button>
            )}
          </div>
        )}
        {(contact.linkedinId || contact.leadId || contact.contactId) && (
          <div className="text-xs text-muted-foreground truncate">
            <span className="font-medium">IDs:</span>{' '}
            {contact.linkedinId && <span>LinkedIn: {contact.linkedinId}</span>}
            {contact.linkedinId && contact.leadId && <span> • </span>}
            {contact.leadId && <span>Lead: {contact.leadId}</span>}
            {contact.leadId && contact.contactId && <span> • </span>}
            {contact.contactId && <span>Contact: {contact.contactId}</span>}
          </div>
        )}
        <div className="mt-3 space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex flex-col text-xs gap-1">
              <span className="font-medium text-muted-foreground">Disposition to Klick</span>
              <select
                className="border rounded px-2 h-7 text-xs bg-background"
                value={contact.dispositionToKlick}
                onChange={(e) =>
                  updateContact(contact.id, {
                    dispositionToKlick: e.target.value as DispositionToKlick,
                  })
                }
              >
                {DISPOSITION_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-xs gap-1">
              <span className="font-medium text-muted-foreground">Influence Level</span>
              <select
                className="border rounded px-2 h-7 text-xs bg-background"
                value={contact.influenceLevel}
                onChange={(e) =>
                  updateContact(contact.id, {
                    influenceLevel: e.target.value as InfluenceLevel,
                  })
                }
              >
                {INFLUENCE_LEVEL_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            {contact.dispositionToKlick === 'Negative' && (
              <label className="flex flex-col text-xs gap-1 sm:col-span-2">
                <span className="font-medium text-muted-foreground">Agency Alignment</span>
                <select
                  className="border rounded px-2 h-7 text-xs bg-background"
                  value={contact.agencyAlignment || 'Unknown'}
                  onChange={(e) =>
                    updateContact(contact.id, {
                      agencyAlignment: e.target.value as AgencyAlignment,
                    })
                  }
                >
                  {AGENCY_ALIGNMENT_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </div>
        
        {/* Genome Enrichment Section */}
        <div className="mt-3">
          <GenomeEnrichment contact={contact} />
        </div>
      </div>
      
      {/* Rich LinkedIn Profile */}
      {showRichProfile && (contact.education || contact.positions || contact.skills) && (
        <div className="mt-4 border-t pt-4">
          <RichLinkedInProfile contact={contact} />
        </div>
      )}
    </div>
  )
}
