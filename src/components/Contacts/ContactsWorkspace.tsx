import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { usePharmaVisualPivotStore } from '@/data/store'
import { selectors } from '@/data/selectors'
import { ContactCard } from './ContactCard'
import { FilterBar } from '@/components/Filters/FilterBar'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import type { CompanyState } from '@/types/domain'

interface ContactsWorkspaceProps {
  contactFilter?: 'all' | 'known' | 'unknown'
  selectedFunctionalAreas?: string[]
}

export function ContactsWorkspace({ contactFilter = 'all', selectedFunctionalAreas = [] }: ContactsWorkspaceProps) {
  const {
    currentCompanySlug,
    companies,
    createOrgChart,
    renameOrgChart,
    deleteOrgChart,
    setCurrentOrgChart,
    addNodeToCurrentChart,
    removeNodeFromCurrentChart,
    setNodeTags,
    setNodeParent,
    breakNodeRelationships,
    resizeCurrentChartNodes,
    moveNodeTreeInCurrentChart,
    reflowCurrentChartLayout,
    autoClusterFilteredContacts,
  } = usePharmaVisualPivotStore()

  const company: CompanyState | null = currentCompanySlug ? companies[currentCompanySlug] : null
  const filteredContacts = useMemo(() => {
    if (!company) return []
    
    let contacts = selectors.selectFilteredContacts(company)
    
    // Apply contact filter
    if (contactFilter === 'known') {
      contacts = contacts.filter(contact => contact.known === true)
    } else if (contactFilter === 'unknown') {
      contacts = contacts.filter(contact => contact.known === false)
    }
    
    // Apply functional area filter
    if (selectedFunctionalAreas.length > 0) {
      const areaSet = new Set(selectedFunctionalAreas)
      contacts = contacts.filter(contact => {
        const area = contact.functionalArea?.trim() || 'Unknown'
        return areaSet.has(area)
      })
    }

    return contacts
  }, [company, contactFilter, selectedFunctionalAreas])

  const [newChartName, setNewChartName] = useState('')
  const [renameName, setRenameName] = useState('')
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [connectors, setConnectors] = useState<{ id: string; x1: number; y1: number; x2: number; y2: number }[]>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const [cardSize, setCardSize] = useState<'small' | 'full'>('small')

  if (!company) return null

  const currentChart = (company.orgCharts || []).find(c => c.id === company.currentOrgChartId) || null
  const selectedContact = selectedNodeId ? company.contacts.find(c => c.id === selectedNodeId) || null : null

  useEffect(() => {
    const variant = (currentChart?.cardVariant as 'small' | 'full' | undefined) ?? 'small'
    setCardSize(prev => (prev === variant ? prev : variant))
  }, [currentChart?.cardVariant])

  const changeCardSize = useCallback((variant: 'small' | 'full') => {
    if (cardSize === variant) return
    setCardSize(variant)
    resizeCurrentChartNodes(variant)
  }, [cardSize, resizeCurrentChartNodes])

  useEffect(() => {
    if (!currentChart) {
      cardRefs.current = {}
      setConnectors([])
      setSelectedNodeId(null)
      return
    }
    const ids = new Set(currentChart.nodes.map(n => n.contactId))
    Object.keys(cardRefs.current).forEach(id => {
      if (!ids.has(id)) delete cardRefs.current[id]
    })
    if (selectedNodeId && !ids.has(selectedNodeId)) {
      setSelectedNodeId(null)
    }
  }, [currentChart, selectedNodeId])

  useLayoutEffect(() => {
    const recompute = () => {
      if (!canvasRef.current || !currentChart) {
        setConnectors([])
        return
      }
      const canvasRect = canvasRef.current.getBoundingClientRect()
      const next: { id: string; x1: number; y1: number; x2: number; y2: number }[] = []
      const nodesById = new Map(currentChart.nodes.map(node => [node.contactId, node]))
      currentChart.nodes.forEach(node => {
        if (!node.parentId) return
        const parent = nodesById.get(node.parentId)
        if (!parent) return
        const childEl = cardRefs.current[node.contactId]
        const parentEl = cardRefs.current[parent.contactId]
        if (!childEl || !parentEl) return
        const childRect = childEl.getBoundingClientRect()
        const parentRect = parentEl.getBoundingClientRect()
        next.push({
          id: `${parent.contactId}->${node.contactId}`,
          x1: parentRect.left + parentRect.width / 2 - canvasRect.left,
          y1: parentRect.top + parentRect.height - canvasRect.top,
          x2: childRect.left + childRect.width / 2 - canvasRect.left,
          y2: childRect.top - canvasRect.top,
        })
      })
      setConnectors(next)
    }

    recompute()
    window.addEventListener('resize', recompute)
    return () => {
      window.removeEventListener('resize', recompute)
    }
  }, [currentChart, cardSize])

  const handleCreateChart = () => {
    const id = createOrgChart(newChartName || 'Untitled')
    if (id) setNewChartName('')
  }

  const handleDropToCanvas = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const contactId = e.dataTransfer.getData('contactId')
    if (!contactId || !canvasRef.current || !company.currentOrgChartId) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    addNodeToCurrentChart({ contactId, x, y })
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const canvasWidth = currentChart?.canvas?.width ?? 1200
  const canvasHeight = currentChart?.canvas?.height ?? 700

  // Drag within canvas
  const onCanvasCardMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    contactId: string
  ) => {
    if (!canvasRef.current) return
    e.stopPropagation()
    setSelectedNodeId(contactId)
    const startX = e.clientX
    const startY = e.clientY
    let lastClientX = startX
    let lastClientY = startY
    let moved = false
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - lastClientX
      const dy = ev.clientY - lastClientY
      if (!dx && !dy) return
      moveNodeTreeInCurrentChart(contactId, { dx, dy })
      lastClientX = ev.clientX
      lastClientY = ev.clientY
      moved = true
    }
    const onUp = (upEvent: MouseEvent) => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      if (!currentChart) return
      const entries = Object.entries(cardRefs.current)
        .filter(([id, el]) => id !== contactId && el)
        .map(([id, el]) => ({ id, el: el as HTMLDivElement }))
      for (const entry of entries) {
        const rect = entry.el.getBoundingClientRect()
        if (
          upEvent.clientX >= rect.left &&
          upEvent.clientX <= rect.right &&
          upEvent.clientY >= rect.top &&
          upEvent.clientY <= rect.bottom
        ) {
          setNodeParent(contactId, entry.id)
          break
        }
      }
      if (moved) {
        reflowCurrentChartLayout()
      }
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Org Charts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <select
              className="border rounded-md h-10 px-3 text-sm bg-background"
              value={company.currentOrgChartId || ''}
              onChange={(e) => setCurrentOrgChart(e.target.value || null)}
            >
              <option value="">Select a chart…</option>
              {(company.orgCharts || []).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              className="border rounded-md h-10 px-3 text-sm"
              placeholder="New chart name"
              value={newChartName}
              onChange={(e) => setNewChartName(e.target.value)}
            />
            <Button onClick={handleCreateChart}>New Chart</Button>

            {currentChart && (
              <>
                <input
                  className="border rounded-md h-10 px-3 text-sm"
                  placeholder="Rename current chart"
                  value={renameName}
                  onChange={(e) => setRenameName(e.target.value)}
                />
                <Button variant="outline" onClick={() => { renameOrgChart(currentChart.id, renameName || currentChart.name); setRenameName('') }}>Rename</Button>
                <Button variant="destructive" onClick={() => deleteOrgChart(currentChart.id)}>Delete</Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[600px]">
        {/* Left sidebar filters */}
        <div className="lg:col-span-1">
          <FilterBar />
        </div>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Filtered Contacts</CardTitle>
              <div className="flex gap-1 text-xs">
                <Button variant={cardSize === 'small' ? 'default' : 'outline'} size="sm" onClick={() => changeCardSize('small')}>Small</Button>
                <Button variant={cardSize === 'full' ? 'default' : 'outline'} size="sm" onClick={() => changeCardSize('full')}>Full</Button>
                <Button variant="outline" size="sm" onClick={() => autoClusterFilteredContacts()}>Auto-Cluster</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className={"grid gap-3 " + (cardSize === 'small' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1')}>
              {filteredContacts.map(c => (
                <ContactCard
                  key={c.id}
                  contact={c}
                  className={cardSize === 'small' ? 'p-2' : ''}
                  draggable
                  onDragStart={(e, contact) => {
                    e.dataTransfer.setData('contactId', contact.id)
                  }}
                  variant={cardSize}
                />
              ))}
              {filteredContacts.length === 0 && (
                <div className="text-sm text-muted-foreground">No contacts match the current filters.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Sandbox</CardTitle>
              <div className="text-sm text-muted-foreground">
                {filteredContacts.length} of {company.contacts.length}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {selectedContact && (
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-medium">Selected: {selectedContact.firstName} {selectedContact.lastName}</span>
                <Button size="sm" variant="outline" onClick={() => breakNodeRelationships(selectedContact.id, 'boss')}>
                  Break Boss
                </Button>
                <Button size="sm" variant="outline" onClick={() => breakNodeRelationships(selectedContact.id, 'reports')}>
                  Break Direct Reports
                </Button>
                <Button size="sm" variant="destructive" onClick={() => breakNodeRelationships(selectedContact.id, 'all')}>
                  Break All Links
                </Button>
              </div>
            )}
            {!currentChart && (
              <div className="text-sm text-muted-foreground">Create or select an org chart to start arranging contacts.</div>
            )}
            <div className="relative border border-dashed rounded-md bg-muted/30 overflow-auto" style={{ minHeight: 500 }}>
              <div
                ref={canvasRef}
                onDrop={handleDropToCanvas}
                onDragOver={handleDragOver}
                onMouseDown={() => setSelectedNodeId(null)}
                className="relative"
                style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}
              >
                {currentChart && connectors.length > 0 && (
                  <svg
                    className="absolute inset-0 pointer-events-none"
                    width={canvasWidth}
                    height={canvasHeight}
                    viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
                  >
                    {connectors.map(connector => {
                      const midY = (connector.y1 + connector.y2) / 2
                      return (
                        <path
                          key={connector.id}
                          d={`M ${connector.x1} ${connector.y1} C ${connector.x1} ${midY}, ${connector.x2} ${midY}, ${connector.x2} ${connector.y2}`}
                          stroke="hsl(var(--muted-foreground))"
                          strokeWidth={1.5}
                          fill="none"
                        />
                      )
                    })}
                  </svg>
                )}

                {currentChart?.clusters?.map(cluster => (
                  <div
                    key={cluster.id}
                    className="absolute text-[11px] font-semibold text-muted-foreground"
                    style={{ left: cluster.x, top: cluster.y, width: cluster.width }}
                  >
                    {cluster.label}
                  </div>
                ))}

                {currentChart?.nodes.map(node => {
                  const contact = company.contacts.find(c => c.id === node.contactId)
                  if (!contact) return null
                  const nodeWidth = node.width ?? (cardSize === 'small' ? 220 : 260)
                  const isSelected = node.contactId === selectedNodeId
                return (
                  <div
                    key={node.contactId}
                    ref={(el) => { cardRefs.current[node.contactId] = el }}
                      className={`absolute ${isSelected ? 'ring-2 ring-primary rounded-md' : ''}`}
                      style={{ left: node.x, top: node.y, width: nodeWidth }}
                    >
                      <div className="relative cursor-move" onMouseDown={(e) => onCanvasCardMouseDown(e, node.contactId)}>
                        <button
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground text-xs"
                          onClick={(e) => { e.stopPropagation(); removeNodeFromCurrentChart(node.contactId) }}
                          title="Remove from chart"
                        >
                          ×
                        </button>
                        <ContactCard contact={contact} variant={cardSize} />
                        <div className="mt-1 flex flex-wrap gap-1">
                          {(['Growth Lead of CS Lead Direct Follow Up','OpGen One-Off Follow Up','Marketing Follow Up'] as const).map(tag => {
                            const active = (node.tags || []).includes(tag)
                            return (
                              <button
                                key={tag}
                                onClick={(e)=>{e.stopPropagation(); const tags = new Set(node.tags||[]); active?tags.delete(tag):tags.add(tag); setNodeTags(node.contactId, Array.from(tags) as any)}}
                                className={`text-[10px] border rounded px-1 ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                                title={tag}
                              >
                                {tag.split(' ')[0]}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
