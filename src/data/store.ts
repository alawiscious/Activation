// Zustand store for state management
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type {
  AppState,
  AppActions,
  CompanyState,
  CompanyTier,
  Brand,
  Contact,
  RevenueRow,
  Filters,
  CsvImportResult,
  OrgChart,
  OrgChartNode,
  OrgChartCluster,
  FollowUpTag,
  AgencyMeta,
  CompetitiveContract,
  FeeToRevenueRatio,
  ServiceFeeAnalysis,
  ProductStage,
  ServiceCategory,
} from '@/types/domain'
import { AGENCIES, SERVICE_CATEGORIES } from '@/types/domain'
import { listAutoSources, putAutoSource, deleteAutoSource } from '@/lib/autoSources'
import { createStorageAdapter } from './storage/StorageAdapter'
import { selectors } from './selectors'
import { DEFAULT_DISPOSITION, DEFAULT_INFLUENCE_LEVEL, deriveContactLabel } from '@/lib/contactLabeling'
import { backfillCompanyTiers, type CompanyEnrichmentData } from './tiering'
import {
  transformBrandsCsv,
  transformContactsCsv,
  transformRevenueCsv,
  mapRevenueToBrands,
  createBrandShellsWithInfo,
  type ContactImportRecord,
} from './transformers'
import { getDataUrl, DATA_FILES } from '@/lib/dataHosting'

// Max total bytes to auto-run on boot (increased to 20MB for large master files)
const AUTO_RUN_SIZE_LIMIT = 20 * 1024 * 1024
const DEFAULT_COMPANY_TIERS = ['Tier 1','First Launchers','Focused Platform Builders','Therapeutic Area Specialists','Unclassified'] as const
const COMPANY_TIERS_STORAGE_KEY = 'pharma-company-tiers'
// Use remote data hosting instead of local files
const DEFAULT_MASTER_CSV_URL = (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_DEFAULT_MASTER_CSV) ?? getDataUrl(DATA_FILES.contacts)
console.log('🔧 Environment variable VITE_DEFAULT_MASTER_CSV:', (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_DEFAULT_MASTER_CSV))
console.log('🔧 DEFAULT_MASTER_CSV_URL resolved to:', DEFAULT_MASTER_CSV_URL)
let defaultMasterTriggered = false
console.log('🔧 defaultMasterTriggered initialized to:', defaultMasterTriggered)

const loadStoredCompanyTiers = (): string[] => {
  if (typeof window === 'undefined') return Array.from(new Set(DEFAULT_COMPANY_TIERS))
  try {
    const raw = window.localStorage.getItem(COMPANY_TIERS_STORAGE_KEY)
    if (!raw) return Array.from(new Set(DEFAULT_COMPANY_TIERS))
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return Array.from(new Set(DEFAULT_COMPANY_TIERS))
    const sanitized = parsed
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean)
    return Array.from(new Set([...DEFAULT_COMPANY_TIERS, ...sanitized]))
  } catch {
    return Array.from(new Set(DEFAULT_COMPANY_TIERS))
  }
}

const persistCompanyTiers = (tiers: string[]) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(COMPANY_TIERS_STORAGE_KEY, JSON.stringify(Array.from(new Set(tiers))))
  } catch {
    // ignore persistence errors
  }
}

// Initial state
const initialFilters: Filters = {
  brands: [],
  therapeuticAreas: [],
  functionalAreas: [],
  levels: [],
  roleLevels: [],
  seniorities: [],
  stages: [],
  titleSearch: '',
  knownOnly: false,
}

const normalizeWebsite = (input?: string) => {
  if (!input) return undefined
  let value = input.trim()
  if (!value) return undefined
  if (!/^https?:\/\//i.test(value)) {
    value = `https://${value}`
  }
  try {
    const url = new URL(value)
    return url.origin
  } catch {
    return undefined
  }
}

const deriveLogoUrl = (website?: string) => {
  if (!website) return undefined
  try {
    const host = new URL(website).hostname
    if (!host) return undefined
    return `https://logo.clearbit.com/${host}`
  } catch {
    return undefined
  }
}

const ORG_ROLE_ORDER = ['C-Suite', 'VP', 'Director', 'Manager', 'Individual Contributor'] as const
const ORG_CANVAS_MARGIN = 60
const ORG_CLUSTER_GAP_X = 160
const ORG_LEVEL_GAP_X = 70
const ORG_ROW_GAP_Y = 40
const ORG_CLUSTER_PADDING_X = 32
const ORG_CLUSTER_PADDING_Y = 40
const ORG_LABEL_HEIGHT = 24
const ORG_MIN_CANVAS_WIDTH = 900
const ORG_MIN_CANVAS_HEIGHT = 600
type OrgCardVariant = 'small' | 'full'
const ORG_CARD_METRICS: Record<OrgCardVariant, { width: number; height: number }> = {
  small: { width: 220, height: 110 },
  full: { width: 320, height: 200 },
}
const ORG_DEFAULT_CARD_VARIANT: OrgCardVariant = 'small'
const ORG_CARD_WIDTH = ORG_CARD_METRICS[ORG_DEFAULT_CARD_VARIANT].width
const ORG_CARD_HEIGHT = ORG_CARD_METRICS[ORG_DEFAULT_CARD_VARIANT].height

const orgRoleIndex = (role: string) => {
  const idx = ORG_ROLE_ORDER.indexOf(role as typeof ORG_ROLE_ORDER[number])
  return idx === -1 ? ORG_ROLE_ORDER.length : idx
}

const inferRoleFromTitle = (title: string): typeof ORG_ROLE_ORDER[number] | 'Individual Contributor' => {
  const t = (title || '').toLowerCase()
  if (/(chief\s+[a-z\s]+\s+officer)\b/.test(t)) return 'C-Suite'
  if (/\bc[a-z]{1,3}o\b/.test(t)) return 'C-Suite'
  if (/(\bsvp\b|senior\s+vice\s+president|exec(?:utive)?\s+vp|evp\b)/.test(t)) return 'VP'
  if (/(\bvp\b|vice\s+president)/.test(t)) return 'VP'
  if (/(head\s+of|chair\b|chairperson|managing\s+director|sr\.?\s*director|senior\s+director|associate\s+director|assistant\s+director|director\b)/.test(t)) return 'Director'
  if (/(general\s+manager|sr\.?\s*manager|senior\s+manager|associate\s+manager|assistant\s+manager|manager\b|lead\b|principal\b)/.test(t)) return 'Manager'
  return 'Individual Contributor'
}

const clusterLabelForContact = (contact: Contact) => {
  const label = (contact.functionalArea || contact.therapeuticArea || contact.brand || '').trim()
  return label || 'General Leadership'
}

const slugifyClusterId = (label: string, indexHint = 0) => {
  const base = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'cluster'
  return indexHint ? `${base}-${indexHint}` : base
}

const sortContactsByName = (a?: Contact, b?: Contact) => {
  const lastA = (a?.lastName || '').toLowerCase()
  const lastB = (b?.lastName || '').toLowerCase()
  if (lastA !== lastB) return lastA.localeCompare(lastB)
  const firstA = (a?.firstName || '').toLowerCase()
  const firstB = (b?.firstName || '').toLowerCase()
  return firstA.localeCompare(firstB)
}

const alignChartByExistingStructure = (chart: OrgChart, contactsById: Map<string, Contact>) => {
  if (!chart.nodes.length) {
    return {
      nodes: chart.nodes,
      clusters: chart.clusters || [],
      canvas: chart.canvas || { width: ORG_MIN_CANVAS_WIDTH, height: ORG_MIN_CANVAS_HEIGHT },
    }
  }

  const existingClusterOrder = (chart.clusters || []).map(c => c.id)
  const clusterMetaMap = new Map((chart.clusters || []).map(cluster => [cluster.id, cluster]))
  const slugCounts = new Map<string, number>()

  const groups = new Map<string, { id: string; label: string; nodes: OrgChartNode[] }>()

  chart.nodes.forEach(node => {
    const contact = contactsById.get(node.contactId)
    const clusterMeta = node.clusterId ? clusterMetaMap.get(node.clusterId) : undefined
    const baseLabel = clusterMeta?.label || clusterLabelForContact(contact || ({} as Contact))
    let clusterId = node.clusterId
    if (!clusterId) {
      const slugBase = slugifyClusterId(baseLabel)
      const count = slugCounts.get(slugBase) ?? 0
      slugCounts.set(slugBase, count + 1)
      clusterId = count === 0 ? slugBase : `${slugBase}-${count}`
    }
    if (!groups.has(clusterId)) {
      groups.set(clusterId, { id: clusterId, label: baseLabel, nodes: [] })
    }
    groups.get(clusterId)!.nodes.push({ ...node, clusterId })
  })

  const sortedGroups = Array.from(groups.values()).sort((a, b) => {
    const idxA = existingClusterOrder.indexOf(a.id)
    const idxB = existingClusterOrder.indexOf(b.id)
    if (idxA !== -1 || idxB !== -1) {
      if (idxA === -1) return 1
      if (idxB === -1) return -1
      return idxA - idxB
    }
    return a.label.localeCompare(b.label)
  })

  const nextNodes: OrgChartNode[] = []
  const nextClusters: OrgChartCluster[] = []
  let cursorX = ORG_CANVAS_MARGIN
  let canvasWidth = ORG_MIN_CANVAS_WIDTH
  let canvasHeight = ORG_MIN_CANVAS_HEIGHT

  sortedGroups.forEach(group => {
    const clusterNodes = group.nodes
    const nodeMap = new Map(clusterNodes.map(n => [n.contactId, { ...n, clusterId: group.id }]))
    const childMap = new Map<string, string[]>()
    clusterNodes.forEach(node => {
      if (node.parentId && nodeMap.has(node.parentId)) {
        const list = childMap.get(node.parentId) ?? []
        if (!list.includes(node.contactId)) list.push(node.contactId)
        childMap.set(node.parentId, list)
      }
    })

    const rootsSet = new Set<string>()
    clusterNodes.forEach(node => {
      if (!node.parentId || !nodeMap.has(node.parentId)) {
        rootsSet.add(node.contactId)
      }
    })
    if (rootsSet.size === 0) {
      clusterNodes.forEach(node => rootsSet.add(node.contactId))
    }

    const rootIds = Array.from(rootsSet)
    rootIds.sort((aId, bId) => {
      const nodeA = nodeMap.get(aId)
      const nodeB = nodeMap.get(bId)
      const contactA = nodeA ? contactsById.get(nodeA.contactId) : undefined
      const contactB = nodeB ? contactsById.get(nodeB.contactId) : undefined
      const roleA = orgRoleIndex(inferRoleFromTitle(contactA?.title || ''))
      const roleB = orgRoleIndex(inferRoleFromTitle(contactB?.title || ''))
      if (roleA !== roleB) return roleA - roleB
      return sortContactsByName(contactA, contactB)
    })

    const subtreeWidthCache = new Map<string, number>()
    const computeSubtreeWidth = (contactId: string, path: Set<string> = new Set()): number => {
      if (path.has(contactId)) return ORG_CARD_WIDTH
      if (subtreeWidthCache.has(contactId)) return subtreeWidthCache.get(contactId) as number
      const node = nodeMap.get(contactId)
      if (!node) {
        subtreeWidthCache.set(contactId, ORG_CARD_WIDTH)
        return ORG_CARD_WIDTH
      }
      const nodeWidth = node.width ?? ORG_CARD_WIDTH
      const children = (childMap.get(contactId) || []).filter(child => child !== contactId && nodeMap.has(child))
      if (children.length === 0) {
        subtreeWidthCache.set(contactId, nodeWidth)
        return nodeWidth
      }
      const nextPath = new Set(path)
      nextPath.add(contactId)
      const totalChildrenWidth = children.reduce((acc, childId) => acc + computeSubtreeWidth(childId, nextPath), 0)
      const totalGap = (children.length - 1) * ORG_LEVEL_GAP_X
      const width = Math.max(nodeWidth, totalChildrenWidth + totalGap)
      subtreeWidthCache.set(contactId, width)
      return width
    }

    const levelHeights = new Map<number, number>()
    const collectLevelHeights = (contactId: string, depth: number, path: Set<string>) => {
      if (path.has(contactId)) return
      const node = nodeMap.get(contactId)
      if (!node) return
      const nodeHeight = node.height ?? ORG_CARD_HEIGHT
      const current = levelHeights.get(depth) ?? 0
      if (nodeHeight > current) levelHeights.set(depth, nodeHeight)
      const nextPath = new Set(path)
      nextPath.add(contactId)
      ;(childMap.get(contactId) || [])
        .filter(child => child !== contactId && nodeMap.has(child))
        .forEach(child => collectLevelHeights(child, depth + 1, nextPath))
    }
    rootsSet.forEach(rootId => collectLevelHeights(rootId, 0, new Set()))
    if (levelHeights.size === 0) levelHeights.set(0, ORG_CARD_HEIGHT)

    const depthOffsets = new Map<number, number>()
    let cumulative = 0
    const depthLevels = Array.from(levelHeights.keys()).sort((a, b) => a - b)
    depthLevels.forEach(depth => {
      depthOffsets.set(depth, cumulative)
      cumulative += (levelHeights.get(depth) ?? ORG_CARD_HEIGHT) + ORG_ROW_GAP_Y
    })

    const clusterX = cursorX
    const clusterY = ORG_CANVAS_MARGIN
    const baseX = clusterX + ORG_CLUSTER_PADDING_X
    const baseY = clusterY + ORG_CLUSTER_PADDING_Y + ORG_LABEL_HEIGHT

    const rootWidths = rootIds.map(id => computeSubtreeWidth(id))
    const totalRootWidth = rootWidths.reduce((sum, w) => sum + w, 0)
    const rootGap = rootIds.length > 1 ? ORG_LEVEL_GAP_X * 2 : 0
    const totalRootGap = rootIds.length > 1 ? (rootIds.length - 1) * rootGap : 0
    const contentWidth = Math.max(totalRootWidth + totalRootGap, ORG_CARD_WIDTH)

    let nextRootLeft = baseX + (contentWidth - (totalRootWidth + totalRootGap)) / 2
    if (!isFinite(nextRootLeft)) nextRootLeft = baseX

    const placedSet = new Set<string>()
    const placedNodes: OrgChartNode[] = []
    let maxRight = baseX
    let maxBottom = baseY

    const placeNode = (contactId: string, left: number, depth: number, path: Set<string>) => {
      if (path.has(contactId) || placedSet.has(contactId)) return
      const node = nodeMap.get(contactId)
      if (!node) return
      const nodeWidth = node.width ?? ORG_CARD_WIDTH
      const nodeHeight = node.height ?? ORG_CARD_HEIGHT
      const subtreeWidth = computeSubtreeWidth(contactId)
      const nodeX = left + (subtreeWidth - nodeWidth) / 2
      const depthOffset = depthOffsets.get(depth) ?? (depth * (nodeHeight + ORG_ROW_GAP_Y))
      const nodeY = baseY + depthOffset
      const placed = { ...node, x: nodeX, y: nodeY, width: nodeWidth, height: nodeHeight, clusterId: group.id }
      placedNodes.push(placed)
      placedSet.add(contactId)
      maxRight = Math.max(maxRight, nodeX + nodeWidth)
      maxBottom = Math.max(maxBottom, nodeY + nodeHeight)

      const children = (childMap.get(contactId) || []).filter(child => child !== contactId && nodeMap.has(child))
      if (children.length === 0) return
      const childrenWidths = children.map(childId => computeSubtreeWidth(childId))
      const totalChildrenWidth = childrenWidths.reduce((sum, width) => sum + width, 0)
      const totalGap = (children.length - 1) * ORG_LEVEL_GAP_X
      let childLeft = left + (subtreeWidth - (totalChildrenWidth + totalGap)) / 2
      if (!isFinite(childLeft)) childLeft = left
      const nextPath = new Set(path)
      nextPath.add(contactId)
      children.forEach((childId, index) => {
        placeNode(childId, childLeft, depth + 1, nextPath)
        childLeft += childrenWidths[index] + ORG_LEVEL_GAP_X
      })
    }

    rootIds.forEach(rootId => {
      const width = computeSubtreeWidth(rootId)
      placeNode(rootId, nextRootLeft, 0, new Set())
      nextRootLeft += width + (rootIds.length > 1 ? ORG_LEVEL_GAP_X * 2 : 0)
    })

    clusterNodes.forEach(node => {
      if (!placedSet.has(node.contactId)) {
        const width = computeSubtreeWidth(node.contactId)
        placeNode(node.contactId, nextRootLeft, 0, new Set())
        nextRootLeft += width + ORG_LEVEL_GAP_X
      }
    })

    const clusterContentWidth = Math.max(maxRight - baseX, ORG_CARD_WIDTH)
    const clusterWidth = ORG_CLUSTER_PADDING_X * 2 + clusterContentWidth
    const clusterHeight = ORG_CLUSTER_PADDING_Y * 2 + ORG_LABEL_HEIGHT + Math.max(ORG_CARD_HEIGHT, maxBottom - baseY)

    cursorX += clusterWidth + ORG_CLUSTER_GAP_X
    canvasWidth = Math.max(canvasWidth, clusterX + clusterWidth + ORG_CANVAS_MARGIN)
    canvasHeight = Math.max(canvasHeight, clusterY + clusterHeight + ORG_CANVAS_MARGIN)

    nextClusters.push({
      id: group.id,
      label: group.label,
      x: clusterX + ORG_CLUSTER_PADDING_X,
      y: clusterY + ORG_CLUSTER_PADDING_Y - 12,
      width: clusterContentWidth,
    })

    placedNodes.forEach(node => {
      nextNodes.push(node)
    })
  })

  return {
    nodes: nextNodes,
    clusters: nextClusters,
    canvas: {
      width: Math.max(canvasWidth, ORG_MIN_CANVAS_WIDTH),
      height: Math.max(canvasHeight, ORG_MIN_CANVAS_HEIGHT),
    },
  }
}

const createInitialCompanyState = (name: string, slug: string): CompanyState => ({
  id: `company-${Date.now()}`,
  name,
  slug,
  brands: [],
  contacts: [],
  revenueRows: [],
  filters: initialFilters,
  orgCharts: [],
  currentOrgChartId: null,
  targets: [],
  tier: 'UNCLASSIFIED',
  createdAt: new Date(),
  updatedAt: new Date(),
})

const ensureContactClassification = (contact: Contact): Contact => {
  const disposition = contact.dispositionToKlick ?? DEFAULT_DISPOSITION
  const influenceLevel = contact.influenceLevel ?? DEFAULT_INFLUENCE_LEVEL
  const isNegative = disposition === 'Negative'
  const agencyAlignment = isNegative ? (contact.agencyAlignment ?? 'Unknown') : undefined
  const derivedLabel = deriveContactLabel(disposition, influenceLevel)

  return {
    ...contact,
    dispositionToKlick: disposition,
    influenceLevel,
    agencyAlignment,
    derivedLabel,
    isIrrelevant: contact.isIrrelevant ?? false,
  }
}

const slugifyCompany = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

const normalizeCompanyName = (value?: string) =>
  (value ? value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim() : '')

const companySimilarity = (a: string, b: string): number => {
  if (!a || !b) return 0
  if (a === b) return 1
  const tokensA = a.split(' ').filter(Boolean)
  const tokensB = b.split(' ').filter(Boolean)
  if (!tokensA.length || !tokensB.length) return 0
  let matches = 0
  const setB = new Set(tokensB)
  for (const token of tokensA) {
    if (setB.has(token)) {
      matches += 1
    } else {
      const partial = tokensB.find(t => t.startsWith(token) || token.startsWith(t))
      if (partial) matches += 0.5
    }
  }
  const tokenScore = matches / Math.max(tokensA.length, tokensB.length)
  const substringScore = a.includes(b) || b.includes(a) ? Math.min(a.length, b.length) / Math.max(a.length, b.length) : 0
  return Math.max(tokenScore, substringScore)
}


const getCompanyMatchCandidates = (nameHint: string | undefined, companies: Record<string, CompanyState>, limit = 6) => {
  const normalizedHint = normalizeCompanyName(nameHint)
  if (!normalizedHint) return [] as Array<{ slug: string; name: string; score: number }>
  return Object.values(companies)
    .map(c => ({
      slug: c.slug,
      name: c.name,
      score: Math.max(
        companySimilarity(normalizedHint, normalizeCompanyName(c.name)),
        companySimilarity(normalizedHint, normalizeCompanyName(c.slug))
      ),
    }))
    .filter(candidate => candidate.score > 0)
    .sort((a, b) => (b.score - a.score) || a.name.localeCompare(b.name))
    .slice(0, limit)
}

type ContactImportAssignment =
  | { action: 'assign'; slug: string }
  | { action: 'create'; slug: string; name?: string }
  | { action: 'skip' }

interface ContactImportPreviewGroup {
  key: string
  originalName?: string
  inferredSlug: string
  count: number
  sampleContacts: Array<{ name: string; title?: string; email?: string }>
  suggestions: Array<{ slug: string; name: string; score: number }>
  defaultAssignment: ContactImportAssignment
  needsReview: boolean
}

interface PendingContactImportState {
  id: string
  groups: ContactImportPreviewGroup[]
  recordsByGroup: Record<string, ContactImportRecord[]>
  options: { overwrite: boolean; preserveEdits: boolean }
  fallbackSlug?: string
}

const buildContactImportPreview = (
  records: ContactImportRecord[],
  companies: Record<string, CompanyState>,
  fallbackSlug?: string
) => {
  const recordsByGroup: Record<string, ContactImportRecord[]> = {}
  records.forEach(record => {
    if (!recordsByGroup[record.groupKey]) {
      recordsByGroup[record.groupKey] = []
    }
    recordsByGroup[record.groupKey].push(record)
  })

  const groups: ContactImportPreviewGroup[] = []
  const defaultAssignments: Record<string, ContactImportAssignment> = {}

  Object.entries(recordsByGroup).forEach(([groupKey, groupRecords]) => {
    const originalName = groupRecords.find(r => r.companyName)?.companyName || groupRecords[0].contact.currCompany || groupKey
    const inferredSlug = groupRecords[0].companySlug || slugifyCompany(originalName || groupKey)
    const suggestions = getCompanyMatchCandidates(originalName, companies)
    const sampleContacts = groupRecords.slice(0, 3).map(record => ({
      name: `${record.contact.firstName || ''} ${record.contact.lastName || ''}`.trim(),
      title: record.contact.title,
      email: record.contact.email,
    }))

    let defaultAssignment: ContactImportAssignment = { action: 'skip' }
    let needsReview = true

    if (suggestions.length > 0 && suggestions[0].score >= 0.8) {
      defaultAssignment = { action: 'assign', slug: suggestions[0].slug }
      needsReview = false
    } else if (fallbackSlug) {
      defaultAssignment = { action: 'assign', slug: fallbackSlug }
      needsReview = true
    } else if (originalName) {
      defaultAssignment = { action: 'create', slug: inferredSlug, name: originalName }
      needsReview = true
    }

    defaultAssignments[groupKey] = defaultAssignment

    groups.push({
      key: groupKey,
      originalName,
      inferredSlug,
      count: groupRecords.length,
      sampleContacts,
      suggestions,
      defaultAssignment,
      needsReview,
    })
  })

  groups.sort((a, b) => b.count - a.count || (a.originalName || '').localeCompare(b.originalName || ''))

  return { groups, recordsByGroup, defaultAssignments }
}

const applyContactAssignmentsToCompanies = (
  companies: Record<string, CompanyState>,
  groupedRecords: Record<string, ContactImportRecord[]>,
  assignments: Record<string, ContactImportAssignment>,
  options: { overwrite: boolean; preserveEdits: boolean },
  fallbackSlug?: string
) => {
  const nextCompanies = { ...companies }
  const now = new Date()
  const touchedSlugs = new Set<string>()

  const mergePreserving = (existing: Contact, incoming: Contact): Contact => {
    const merged: Contact = { ...existing }
    for (const key of Object.keys(incoming) as (keyof Contact)[]) {
      if (['id', 'createdAt'].includes(key as string)) continue
      const newVal = incoming[key]
      const oldVal = existing[key]
      const isEmpty = (v: any) => v === null || v === undefined || (typeof v === 'string' && v.trim() === '')
      if (isEmpty(oldVal) && !isEmpty(newVal)) {
        ;(merged as any)[key] = newVal
      }
    }
    merged.updatedAt = new Date()
    return ensureContactClassification(merged)
  }

  const mergeOverwrite = (existing: Contact, incoming: Contact): Contact => {
    const merged: Contact = { ...existing }
    for (const key of Object.keys(incoming) as (keyof Contact)[]) {
      if (['id', 'createdAt'].includes(key as string)) continue
      const newVal = incoming[key]
      const isEmpty = (v: any) => v === null || v === undefined || (typeof v === 'string' && v.trim() === '')
      if (!isEmpty(newVal)) {
        ;(merged as any)[key] = newVal
      }
    }
    merged.updatedAt = new Date()
    return ensureContactClassification(merged)
  }

  Object.entries(groupedRecords).forEach(([groupKey, records]) => {
    const assignment = assignments[groupKey]
    if (!assignment || assignment.action === 'skip') {
      return
    }

    let targetSlug = assignment.slug
    let targetName = assignment.action === 'create' ? assignment.name : undefined

    if (!targetSlug && fallbackSlug) {
      targetSlug = fallbackSlug
    }

    if (!targetSlug) {
      return
    }

    let company = nextCompanies[targetSlug]
    if (!company) {
      const name = targetName || records.find(r => r.companyName)?.companyName || targetSlug
      company = createInitialCompanyState(name, targetSlug)
      touchedSlugs.add(targetSlug)
    }

    const byEmail = new Map<string, Contact>()
    const byContactId = new Map<string, Contact>()
    company.contacts.forEach(c => {
      if (c.email) byEmail.set(c.email.toLowerCase(), c)
      if (c.contactId) byContactId.set(c.contactId, c)
    })

    const updatedContacts: Contact[] = [...company.contacts]
    let contactsChanged = false

    records.forEach(record => {
      const incoming = ensureContactClassification(record.contact)
      const existingById = incoming.contactId ? byContactId.get(incoming.contactId) : undefined
      const existingByEmail = incoming.email ? byEmail.get(incoming.email.toLowerCase()) : undefined
      const existing = existingById || existingByEmail

      if (existing) {
        if (!options.overwrite) return
        const idx = updatedContacts.findIndex(c => c.id === existing.id)
        if (idx === -1) return
        const merged = options.preserveEdits ? mergePreserving(updatedContacts[idx], incoming) : mergeOverwrite(updatedContacts[idx], incoming)
        if (merged !== updatedContacts[idx]) {
          updatedContacts[idx] = merged
          contactsChanged = true
        }
        if (merged.email) byEmail.set(merged.email.toLowerCase(), merged)
        if (merged.contactId) byContactId.set(merged.contactId, merged)
      } else {
        updatedContacts.push(incoming)
        contactsChanged = true
        if (incoming.email) byEmail.set(incoming.email.toLowerCase(), incoming)
        if (incoming.contactId) byContactId.set(incoming.contactId, incoming)
      }
    })

    if (contactsChanged || targetName) {
      nextCompanies[targetSlug] = {
        ...company,
        name: company.name || targetName || company.name,
        contacts: updatedContacts,
        updatedAt: now,
      }
      touchedSlugs.add(targetSlug)
    }
  })

  return { companies: nextCompanies, touchedSlugs: Array.from(touchedSlugs) }
}

// Store interface
interface PharmaVisualPivotStore extends AppState, AppActions {
  // Storage
  storage: ReturnType<typeof createStorageAdapter>
  // Agencies directory (global)
  agencies: AgencyMeta[]
  companyTiers: string[]
  addCompanyTier: (tier: string) => void
  setCompanyTier: (slug: string, tier: string) => void
  setAgencyStatus: (agency: string, service: string, status: string) => void
  setAgencyMode: (agency: string, mode: string) => void
  addAgency: (name: string, website?: string) => void
  removeAgency: (name: string) => void
  // Competitive contract management
  competitiveContracts: CompetitiveContract[]
  addCompetitiveContract: (contract: Omit<CompetitiveContract, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateCompetitiveContract: (id: string, updates: Partial<CompetitiveContract>) => void
  removeCompetitiveContract: (id: string) => void
  getActiveContracts: (companySlug: string) => CompetitiveContract[]
  isBlockedByContract: (companySlug: string, serviceCategory?: string, therapeuticArea?: string, brandId?: string) => boolean
  // Fee-to-revenue ratio management
  feeToRevenueRatios: FeeToRevenueRatio[]
  serviceFeeAnalyses: ServiceFeeAnalysis[]
  addFeeToRevenueRatio: (ratio: Omit<FeeToRevenueRatio, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateFeeToRevenueRatio: (id: string, updates: Partial<FeeToRevenueRatio>) => void
  removeFeeToRevenueRatio: (id: string) => void
  calculateServiceFeeAnalysis: (brandId: string, serviceCategory: ServiceCategory, currentRevenue: number) => ServiceFeeAnalysis
  getFeeToRevenueRatio: (serviceCategory: ServiceCategory, stage: ProductStage) => number
  determineProductStage: (brand: Brand) => ProductStage
  // Auto import sources (persisted in localStorage)
  autoSources: {
    id: string
    type: 'master' | 'contacts'
    name: string
    size: number
    content: string
    autoRun: 'off' | 'whenEmpty' | 'always'
    contactsOptions?: { overwrite: boolean; preserveEdits: boolean }
    lastRunAt?: string
    createdAt: string
  }[]
  addAutoSource: (args: { type: 'master' | 'contacts'; file: File; autoRun: 'off' | 'whenEmpty' | 'always'; contactsOptions?: { overwrite: boolean; preserveEdits: boolean } }) => Promise<void>
  updateAutoSource: (id: string, patch: Partial<PharmaVisualPivotStore['autoSources'][number]>) => Promise<void>
  deleteAutoSource: (id: string) => Promise<void>
  runAutoSourceNow: (id: string) => Promise<void>
  clearAutoSources: () => void
  clearAllData: () => void
  autoRunIfEnabled: () => Promise<void>
  addCompanyInsight: (slug: string, text: string) => void
  addCompanyAttachment: (slug: string, attachment: { id: string; name: string; type: string; size: number; dataUrl: string }) => void
  removeCompanyAttachment: (slug: string, id: string) => void
  addCompanyLink: (slug: string, label: string, url: string) => void
  pendingContactImport: PendingContactImportState | null
  clearPendingContactImport: () => void
  applyPendingContactImport: (id: string, assignments: Record<string, ContactImportAssignment>) => Promise<void>
  importContactsFromUrl: (url: string, options?: { overwrite?: boolean; preserveEdits?: boolean; preview?: boolean }) => Promise<void>
  hydrateFromStorage: () => Promise<void>
  isHydrated: boolean
  
  // Company management
  loadCompany: (slug: string) => Promise<void>
  saveCompany: (slug: string) => Promise<void>
  
  // Data import
  importBrandsCsv: (csvData: string) => Promise<CsvImportResult<{ brand: Brand; revenueRows: RevenueRow[] }>>
  importContactsCsv: (csvData: string, options?: { overwrite?: boolean; preserveEdits?: boolean; preview?: boolean }) => Promise<CsvImportResult<ContactImportRecord> & { previewId?: string; previewGroups?: ContactImportPreviewGroup[] }>
  importRevenueCsv: (csvData: string) => Promise<CsvImportResult<RevenueRow>>
  // Master import (streaming, large CSV)
  importMasterCsv: (
    file: File,
    onProgress?: (info: { processed: number; companies: number; brands: number; upserts: number }) => void
  ) => Promise<{
    total: number
    processed: number
    companiesAffected: number
    brandsCreated: number
    upserts: number
    affectedCompanies: { slug: string; name: string }[]
  }>
  
  // Data management
  addBrand: (brand: Brand) => void
  updateBrand: (id: string, updates: Partial<Brand>) => void
  deleteBrand: (id: string) => void
  
  addContact: (contact: Contact) => void
  updateContact: (id: string, updates: Partial<Contact>) => void
  deleteContact: (id: string) => void
  toggleContactKnown: (id: string) => void
  
  addRevenueRow: (revenueRow: RevenueRow) => void
  updateRevenueRow: (id: string, updates: Partial<RevenueRow>) => void
  deleteRevenueRow: (id: string) => void
  
  // Filter management
  updateFilters: (filters: Partial<Filters>) => void
  resetFilters: () => void
  
  // Export
  exportState: () => CompanyState | null
  importState: (state: CompanyState) => void

  // Org charts
  createOrgChart: (name: string) => string | null
  renameOrgChart: (id: string, name: string) => void
  deleteOrgChart: (id: string) => void
  setCurrentOrgChart: (id: string | null) => void
  addNodeToCurrentChart: (node: OrgChartNode) => void
  updateNodeInCurrentChart: (contactId: string, pos: { x: number; y: number }) => void
  removeNodeFromCurrentChart: (contactId: string) => void
  setNodeTags: (contactId: string, tags: FollowUpTag[]) => void
  setNodeParent: (contactId: string, parentId: string | null) => void
  breakNodeRelationships: (contactId: string, mode: 'boss' | 'reports' | 'all') => void
  resizeCurrentChartNodes: (variant: OrgCardVariant) => void
  moveNodeTreeInCurrentChart: (contactId: string, delta: { dx: number; dy: number }) => void
  reflowCurrentChartLayout: () => void
  autoClusterFilteredContacts: () => void
  // Targets
  toggleBrandTarget: (brandId: string) => void
}

// Create the store
export const usePharmaVisualPivotStore = create<PharmaVisualPivotStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentCompanySlug: null,
    companies: {},
    isLoading: false,
    error: null,
    storage: createStorageAdapter(),
    agencies: AGENCIES.map(a => ({ name: a, serviceStatus: {} })),
    companyTiers: loadStoredCompanyTiers(),
    competitiveContracts: [],
    feeToRevenueRatios: [
      // Default AOR ratios by stage
      { id: 'aor-pre-2y', serviceCategory: 'AOR', stage: 'PRE_LAUNCH_2Y', ratio: 0.03, description: 'Early development phase', createdAt: new Date(), updatedAt: new Date() },
      { id: 'aor-pre-1y', serviceCategory: 'AOR', stage: 'PRE_LAUNCH_1Y', ratio: 0.05, description: 'Pre-launch preparation', createdAt: new Date(), updatedAt: new Date() },
      { id: 'aor-launch', serviceCategory: 'AOR', stage: 'LAUNCH', ratio: 0.08, description: 'Launch year peak activity', createdAt: new Date(), updatedAt: new Date() },
      { id: 'aor-post', serviceCategory: 'AOR', stage: 'POST_LAUNCH', ratio: 0.06, description: 'Established brand maintenance', createdAt: new Date(), updatedAt: new Date() },
      { id: 'aor-pre-loe', serviceCategory: 'AOR', stage: 'PRE_LOE', ratio: 0.04, description: 'Pre-generic competition', createdAt: new Date(), updatedAt: new Date() },
      { id: 'aor-loe', serviceCategory: 'AOR', stage: 'LOE', ratio: 0.02, description: 'Post-generic minimal support', createdAt: new Date(), updatedAt: new Date() },
      
      // Default DAOR ratios by stage
      { id: 'daor-pre-2y', serviceCategory: 'DAOR', stage: 'PRE_LAUNCH_2Y', ratio: 0.02, description: 'Early digital strategy', createdAt: new Date(), updatedAt: new Date() },
      { id: 'daor-pre-1y', serviceCategory: 'DAOR', stage: 'PRE_LAUNCH_1Y', ratio: 0.04, description: 'Digital launch preparation', createdAt: new Date(), updatedAt: new Date() },
      { id: 'daor-launch', serviceCategory: 'DAOR', stage: 'LAUNCH', ratio: 0.06, description: 'Digital launch campaign', createdAt: new Date(), updatedAt: new Date() },
      { id: 'daor-post', serviceCategory: 'DAOR', stage: 'POST_LAUNCH', ratio: 0.05, description: 'Ongoing digital engagement', createdAt: new Date(), updatedAt: new Date() },
      { id: 'daor-pre-loe', serviceCategory: 'DAOR', stage: 'PRE_LOE', ratio: 0.03, description: 'Digital retention focus', createdAt: new Date(), updatedAt: new Date() },
      { id: 'daor-loe', serviceCategory: 'DAOR', stage: 'LOE', ratio: 0.01, description: 'Minimal digital presence', createdAt: new Date(), updatedAt: new Date() },
      
      // Default MedComms ratios by stage
      { id: 'medcomms-pre-2y', serviceCategory: 'MedComms', stage: 'PRE_LAUNCH_2Y', ratio: 0.04, description: 'Clinical trial support', createdAt: new Date(), updatedAt: new Date() },
      { id: 'medcomms-pre-1y', serviceCategory: 'MedComms', stage: 'PRE_LAUNCH_1Y', ratio: 0.06, description: 'Regulatory preparation', createdAt: new Date(), updatedAt: new Date() },
      { id: 'medcomms-launch', serviceCategory: 'MedComms', stage: 'LAUNCH', ratio: 0.08, description: 'Launch medical education', createdAt: new Date(), updatedAt: new Date() },
      { id: 'medcomms-post', serviceCategory: 'MedComms', stage: 'POST_LAUNCH', ratio: 0.07, description: 'Ongoing medical affairs', createdAt: new Date(), updatedAt: new Date() },
      { id: 'medcomms-pre-loe', serviceCategory: 'MedComms', stage: 'PRE_LOE', ratio: 0.05, description: 'Medical retention', createdAt: new Date(), updatedAt: new Date() },
      { id: 'medcomms-loe', serviceCategory: 'MedComms', stage: 'LOE', ratio: 0.03, description: 'Post-generic medical support', createdAt: new Date(), updatedAt: new Date() },
    ],
    serviceFeeAnalyses: [],
    autoSources: [],
    pendingContactImport: null,
    isHydrated: false,

    // Company management
    setCurrentCompany: (slug: string) => {
      set({ currentCompanySlug: slug })
    },

    createCompany: (name: string, slug: string) => {
      const state = get()
      const newCompany = createInitialCompanyState(name, slug)
      
      set({
        companies: {
          ...state.companies,
          [slug]: newCompany,
        },
        currentCompanySlug: slug,
      })
    },

    updateCompanyState: (slug: string, updates: Partial<CompanyState>) => {
      const state = get()
      const company = state.companies[slug]
      if (!company) return

      const updatedCompany = {
        ...company,
        ...updates,
        updatedAt: new Date(),
      }

      set({
        companies: {
          ...state.companies,
          [slug]: updatedCompany,
        },
      })
    },

    setLoading: (loading: boolean) => {
      set({ isLoading: loading })
    },

    setError: (error: string | null) => {
      set({ error })
    },

    clearError: () => {
      set({ error: null })
    },

    backfillCompanyTiers: (enrichmentDataMap: Record<string, CompanyEnrichmentData> = {}) => {
      const state = get()
      const updatedCompanies = backfillCompanyTiers(state.companies, enrichmentDataMap)
      set({ companies: updatedCompanies })
    },

    // Agency directory actions
    setAgencyStatus: (agency: string, service: string, status: string) => {
      set(state => ({
        agencies: state.agencies.map(a => a.name === agency ? ({ ...a, serviceStatus: { ...a.serviceStatus, [service]: status } }) : a)
      }))
    },
    setAgencyMode: (agency: string, mode: string) => {
      set(state => ({ agencies: state.agencies.map(a => a.name === agency ? ({ ...a, mode }) : a) }))
    },
    addAgency: (name: string, website?: string) => {
      const normalizedWebsite = normalizeWebsite(website)
      const logoUrl = deriveLogoUrl(normalizedWebsite)
      set(state => {
        if (state.agencies.some(a => a.name === name)) {
          return {
            agencies: state.agencies.map(a => a.name === name ? { ...a, website: normalizedWebsite, logoUrl: logoUrl || a.logoUrl } : a),
          }
        }
        return {
          agencies: [
            ...state.agencies,
            { name, serviceStatus: {}, website: normalizedWebsite, logoUrl },
          ],
        }
      })
    },
    removeAgency: (name: string) => {
      set(state => ({ agencies: state.agencies.filter(a => a.name !== name) }))
    },

    // Competitive contract management
    addCompetitiveContract: (contractData) => {
      const contract: CompetitiveContract = {
        ...contractData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      set(state => ({ 
        competitiveContracts: [...state.competitiveContracts, contract] 
      }))
      
      // Override agency assignments in heatmap based on contract scope
      const { companies, updateBrand } = get()
      const company = companies[contractData.companySlug]
      if (company) {
        company.brands.forEach(brand => {
          let shouldUpdate = false
          let updatedServices = { ...brand.services }
          
          if (contractData.scope === 'SERVICE_LINE' && contractData.serviceCategory) {
            // Override specific service category
            updatedServices[contractData.serviceCategory] = contractData.agencyName
            shouldUpdate = true
          } else if (contractData.scope === 'THERAPEUTIC_AREA' && contractData.therapeuticArea) {
            // Override all services for brands in this therapeutic area
            if (brand.therapeuticArea === contractData.therapeuticArea) {
              SERVICE_CATEGORIES.forEach(service => {
                updatedServices[service] = contractData.agencyName
              })
              shouldUpdate = true
            }
          } else if (contractData.scope === 'BRAND_SPECIFIC' && contractData.brandId) {
            // Override all services for specific brand
            if (brand.id === contractData.brandId) {
              SERVICE_CATEGORIES.forEach(service => {
                updatedServices[service] = contractData.agencyName
              })
              shouldUpdate = true
            }
          }
          
          if (shouldUpdate) {
            updateBrand(brand.id, { services: updatedServices })
          }
        })
      }
    },
    updateCompetitiveContract: (id: string, updates: Partial<CompetitiveContract>) => {
      set(state => ({
        competitiveContracts: state.competitiveContracts.map(contract =>
          contract.id === id 
            ? { ...contract, ...updates, updatedAt: new Date() }
            : contract
        )
      }))
    },
    removeCompetitiveContract: (id: string) => {
      set(state => ({
        competitiveContracts: state.competitiveContracts.filter(contract => contract.id !== id)
      }))
    },
    getActiveContracts: (companySlug: string) => {
      const { competitiveContracts } = get()
      const now = new Date()
      return competitiveContracts.filter(contract => 
        contract.companySlug === companySlug &&
        contract.status === 'ACTIVE' &&
        contract.expirationDate > now
      )
    },
    isBlockedByContract: (companySlug: string, serviceCategory?: string, therapeuticArea?: string, brandId?: string) => {
      const activeContracts = get().getActiveContracts(companySlug)
      return activeContracts.some(contract => {
        if (contract.scope === 'SERVICE_LINE' && serviceCategory) {
          return contract.serviceCategory === serviceCategory
        }
        if (contract.scope === 'THERAPEUTIC_AREA' && therapeuticArea) {
          return contract.therapeuticArea === therapeuticArea
        }
        if (contract.scope === 'BRAND_SPECIFIC' && brandId) {
          return contract.brandId === brandId
        }
        return false
      })
    },

    // Fee-to-revenue ratio management
    addFeeToRevenueRatio: (ratioData) => {
      const ratio: FeeToRevenueRatio = {
        ...ratioData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      set(state => ({ 
        feeToRevenueRatios: [...state.feeToRevenueRatios, ratio] 
      }))
    },
    updateFeeToRevenueRatio: (id: string, updates: Partial<FeeToRevenueRatio>) => {
      set(state => ({
        feeToRevenueRatios: state.feeToRevenueRatios.map(ratio =>
          ratio.id === id 
            ? { ...ratio, ...updates, updatedAt: new Date() }
            : ratio
        )
      }))
    },
    removeFeeToRevenueRatio: (id: string) => {
      set(state => ({
        feeToRevenueRatios: state.feeToRevenueRatios.filter(ratio => ratio.id !== id)
      }))
    },
    getFeeToRevenueRatio: (serviceCategory: ServiceCategory, stage: ProductStage) => {
      const { feeToRevenueRatios } = get()
      const ratio = feeToRevenueRatios.find(r => 
        r.serviceCategory === serviceCategory && r.stage === stage
      )
      return ratio?.ratio || 0.05 // Default 5% if not found
    },
    determineProductStage: (brand: Brand) => {
      // Simple stage determination based on brand phase and status
      // This could be enhanced with more sophisticated logic
      if (brand.status === 'Discontinued') return 'LOE'
      if (brand.phase === 'Preclinical' || brand.phase === 'Phase I') return 'PRE_LAUNCH_2Y'
      if (brand.phase === 'Phase II') return 'PRE_LAUNCH_1Y'
      if (brand.phase === 'Phase III') return 'LAUNCH'
      if (brand.phase === 'Approved' && brand.status === 'Active') return 'POST_LAUNCH'
      return 'POST_LAUNCH' // Default
    },
    calculateServiceFeeAnalysis: (brandId: string, serviceCategory: ServiceCategory, currentRevenue: number) => {
      const { companies, getFeeToRevenueRatio, determineProductStage } = get()
      
      // Find the brand
      let brand: Brand | null = null
      for (const company of Object.values(companies)) {
        const foundBrand = company.brands.find(b => b.id === brandId)
        if (foundBrand) {
          brand = foundBrand
          break
        }
      }
      
      if (!brand) {
        throw new Error(`Brand with ID ${brandId} not found`)
      }
      
      const stage = determineProductStage(brand)
      const ratio = getFeeToRevenueRatio(serviceCategory, stage)
      const estimatedFee = currentRevenue * ratio
      
      // Determine confidence based on data availability
      const confidence = currentRevenue > 0 ? 'HIGH' : 'LOW'
      
      const analysis: ServiceFeeAnalysis = {
        brandId,
        serviceCategory,
        currentRevenue,
        estimatedFee,
        feeToRevenueRatio: ratio,
        stage,
        confidence,
        lastCalculated: new Date(),
      }
      
      // Store the analysis
      set(state => ({
        serviceFeeAnalyses: [
          ...state.serviceFeeAnalyses.filter(a => 
            !(a.brandId === brandId && a.serviceCategory === serviceCategory)
          ),
          analysis
        ]
      }))
      
      return analysis
    },
    addCompanyTier: (tier: string) => {
      const trimmed = tier.trim()
      if (!trimmed) return
      set(state => {
        if (state.companyTiers.includes(trimmed)) return {}
        const next = [...state.companyTiers, trimmed]
        persistCompanyTiers(next)
        return { companyTiers: next }
      })
    },
    setCompanyTier: (slug: string, tier: string) => {
      const trimmed = (tier.trim() || 'UNCLASSIFIED') as CompanyTier
      set(state => {
        const company = state.companies[slug]
        if (!company) return {}
        const nextTiers = state.companyTiers.includes(trimmed)
          ? state.companyTiers
          : [...state.companyTiers, trimmed]
        persistCompanyTiers(nextTiers)
        return {
          companyTiers: nextTiers,
          companies: {
            ...state.companies,
            [slug]: { ...company, tier: trimmed, updatedAt: new Date() },
          },
        }
      })
      const { saveCompany } = get()
      saveCompany(slug).catch(() => {})
    },
    // Auto import sources helpers
    addAutoSource: async ({ type, file, autoRun, contactsOptions }) => {
      const content = await file.text()
      const src = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type,
        name: file.name,
        size: file.size,
        content,
        autoRun,
        contactsOptions,
        createdAt: new Date().toISOString(),
      }
      await putAutoSource(src)
      const list = await listAutoSources()
      set({ autoSources: list })
    },
    updateAutoSource: async (id, patch) => {
      const current = get().autoSources.find(s => s.id === id)
      if (!current) return
      const merged = { ...current, ...patch }
      await putAutoSource(merged as any)
      const list = await listAutoSources()
      set({ autoSources: list })
    },
    deleteAutoSource: async (id) => {
      await deleteAutoSource(id)
      const list = await listAutoSources()
      set({ autoSources: list })
    },
    runAutoSourceNow: async (id) => {
      const s = get().autoSources.find(x => x.id === id)
      if (!s) return
      if (s.type === 'master') {
        const f = new File([s.content], s.name || 'master.csv', { type: 'text/csv' })
        await get().importMasterCsv(f)
      } else {
        const opts = s.contactsOptions || { overwrite: true, preserveEdits: true }
        await get().importContactsCsv(s.content, { ...opts, preview: false })
      }
      get().updateAutoSource(id, { lastRunAt: new Date().toISOString() })
    },
    clearAutoSources: () => {
      if (typeof window === 'undefined') return
      try {
        localStorage.removeItem('pharma-auto-sources')
        set({ autoSources: [] })
        console.log('🧹 Cleared all auto-sources')
      } catch (error) {
        console.warn('⚠️ Failed to clear auto-sources:', error)
      }
    },
    clearAllData: () => {
      set({ 
        companies: {}, 
        currentCompanySlug: null,
        error: null
      })
      console.log('🧹 Cleared all data')
    },
    autoRunIfEnabled: async () => {
      // Always load default data as if it's an API that's always available
      if (typeof window !== 'undefined' && DEFAULT_MASTER_CSV_URL) {
        // Check if we already have data loaded
        const { companies } = get()
        const hasData = Object.keys(companies).length > 0
        
        // Force reload if we have less than 700 companies (indicating incomplete data)
        const shouldReload = !hasData || Object.keys(companies).length < 700
        
        if (shouldReload) {
          console.log('🚀 Starting auto-import for:', DEFAULT_MASTER_CSV_URL)
          
          // Clear existing data if we're reloading
          if (hasData) {
            console.log('🧹 Clearing existing data before reload...')
            set({ companies: {}, currentCompanySlug: null })
          }
          
          // Load both company file and contacts file for complete data
          const companyFileUrl = getDataUrl(DATA_FILES.companies)
          const contactsFileUrl = getDataUrl(DATA_FILES.contacts)
          
          try {
            // Load company/brand/revenue data first
            console.log('📊 Loading company data from:', companyFileUrl)
            const companyRes = await fetch(companyFileUrl)
            if (companyRes.ok) {
              const companyBlob = await companyRes.blob()
              const companyFile = new File([companyBlob], 'master-company-file.csv', { type: 'text/csv' })
              await get().importMasterCsv(companyFile)
              console.log('✅ Company data loaded successfully')
            }
            
            // Then load contacts data
            console.log('👥 Loading contacts data from:', contactsFileUrl)
            const contactsRes = await fetch(contactsFileUrl)
            if (contactsRes.ok) {
              const contactsBlob = await contactsRes.blob()
              const contactsFile = new File([contactsBlob], 'master-contacts.csv', { type: 'text/csv' })
              await get().importMasterCsv(contactsFile)
              console.log('✅ Contacts data loaded successfully')
            }
            
            console.log('🎉 All data loaded successfully!')
            return
            
          } catch (error) {
            console.warn('⚠️ Multi-file import failed, falling back to single file:', error)
            // Fall back to the original single file approach
          }
        } else {
          console.log('📊 Data already loaded, skipping auto-import')
          return
        }
        try {
          // More aggressive retry logic for auto-loading
          let res = await fetch(DEFAULT_MASTER_CSV_URL)
          let retries = 0
          const maxRetries = 5 // Increased retries
          
          while (!res.ok && retries < maxRetries) {
            console.log(`🔄 Auto-import attempt ${retries + 1}/${maxRetries + 1} - Status: ${res.status}`)
            await new Promise(resolve => setTimeout(resolve, 500 * (retries + 1))) // Faster retry
            res = await fetch(DEFAULT_MASTER_CSV_URL)
            retries++
          }
          
          if (res.ok) {
            const blob = await res.blob()
            console.log(`📁 File size: ${blob.size} bytes`)
            if (blob.size > 0) {
              const name = DEFAULT_MASTER_CSV_URL.split('/').pop() || 'master.csv'
              const file = new File([blob], name, { type: blob.type || 'text/csv' })
              console.log('📤 Importing master CSV file:', name)
              await get().importMasterCsv(file)
              console.log('✅ Auto-import successful: Master data loaded')
            } else {
              console.warn('⚠️ Auto-import: Empty file received')
            }
          } else {
            console.warn(`⚠️ Auto-import failed after ${maxRetries} retries. Status: ${res.status}`)
            // Try to load anyway with a fallback approach
            console.log('🔄 Attempting fallback load...')
            try {
              const fallbackRes = await fetch(DEFAULT_MASTER_CSV_URL, { cache: 'no-cache' })
              if (fallbackRes.ok) {
                const blob = await fallbackRes.blob()
                if (blob.size > 0) {
                  const name = DEFAULT_MASTER_CSV_URL.split('/').pop() || 'master.csv'
                  const file = new File([blob], name, { type: blob.type || 'text/csv' })
                  await get().importMasterCsv(file)
                  console.log('✅ Fallback auto-import successful')
                }
              }
            } catch (fallbackError) {
              console.warn('⚠️ Fallback also failed:', fallbackError)
            }
          }
        } catch (error) {
          console.warn('⚠️ Auto-import error:', error)
          // Try one more time with a different approach
          try {
            console.log('🔄 Final attempt with different fetch options...')
            const finalRes = await fetch(DEFAULT_MASTER_CSV_URL, { 
              cache: 'reload',
              headers: { 'Cache-Control': 'no-cache' }
            })
            if (finalRes.ok) {
              const blob = await finalRes.blob()
              if (blob.size > 0) {
                const name = DEFAULT_MASTER_CSV_URL.split('/').pop() || 'master.csv'
                const file = new File([blob], name, { type: blob.type || 'text/csv' })
                await get().importMasterCsv(file)
                console.log('✅ Final attempt successful')
              }
            }
          } catch (finalError) {
            console.warn('⚠️ All auto-import attempts failed:', finalError)
          }
        }
      }

      if (get().autoSources.length === 0) {
        const list = await listAutoSources()
        set({ autoSources: list })
      }
      const sources = get().autoSources
      if (sources.length === 0) return

      const totalBytes = sources.reduce((sum, source) => sum + (source.size ?? 0), 0)
      const largest = sources.reduce((max, source) => Math.max(max, source.size ?? 0), 0)
      if (totalBytes > AUTO_RUN_SIZE_LIMIT || largest > AUTO_RUN_SIZE_LIMIT) {
        console.log(`⚠️ Auto-sources too large (${totalBytes} bytes, largest: ${largest} bytes), but continuing with default master CSV import`)
        // Don't return here - let the default master CSV import continue
        // set({
        //   error: 'Auto-import skipped: saved data source exceeds safe boot size. Run it manually from Auto Sources.',
        // })
        // return
      }

      const companiesEmpty = Object.keys(get().companies).length === 0
      
      // Treat auto-sources as if they're API endpoints that are always available
      // run masters first, then contacts
      const masters = sources.filter(s => s.type === 'master' && (s.autoRun === 'always' || (s.autoRun === 'whenEmpty' && companiesEmpty)))
      for (const m of masters) {
        try {
          await get().runAutoSourceNow(m.id)
          console.log(`✅ Auto-source successful: ${m.name} (${m.type})`)
        } catch (error) {
          console.warn(`⚠️ Auto-source temporarily unavailable: ${m.name} (${m.type})`, error)
          // In a real API scenario, this would be retried or use cached data
        }
      }
      
      const contacts = sources.filter(s => s.type === 'contacts' && (s.autoRun === 'always' || (s.autoRun === 'whenEmpty' && companiesEmpty)))
      for (const c of contacts) {
        try {
          await get().runAutoSourceNow(c.id)
          console.log(`✅ Auto-source successful: ${c.name} (${c.type})`)
        } catch (error) {
          console.warn(`⚠️ Auto-source temporarily unavailable: ${c.name} (${c.type})`, error)
          // In a real API scenario, this would be retried or use cached data
        }
      }
    },
    addCompanyInsight: (slug: string, text: string) => {
      set(state => {
        const company = state.companies[slug]
        if (!company) return {}
        const insights = [...(company.insights || []), { timestamp: new Date().toISOString(), text }]
        return { companies: { ...state.companies, [slug]: { ...company, insights, updatedAt: new Date() } } }
      })
    },
    addCompanyAttachment: (slug, attachment) => {
      set(state => {
        const company = state.companies[slug]
        if (!company) return {}
        const attachments = [...(company.attachments || []), { ...attachment, uploadedAt: new Date().toISOString() }]
        return { companies: { ...state.companies, [slug]: { ...company, attachments, updatedAt: new Date() } } }
      })
    },
    removeCompanyAttachment: (slug, id) => {
      set(state => {
        const company = state.companies[slug]
        if (!company) return {}
        const attachments = (company.attachments || []).filter(a => a.id !== id)
        return { companies: { ...state.companies, [slug]: { ...company, attachments, updatedAt: new Date() } } }
      })
    },
    addCompanyLink: (slug, label, url) => {
      set(state => {
        const company = state.companies[slug]
        if (!company) return {}
        const links = [...(company.links || []), { label, url }]
        return { companies: { ...state.companies, [slug]: { ...company, links, updatedAt: new Date() } } }
      })
    },

    // Load company from storage
    loadCompany: async (slug: string) => {
      const { storage, setLoading, setError } = get()
      
      try {
        setLoading(true)
        setError(null)
        
        const companyState = await storage.load(slug)
        
        if (companyState) {
          const normalized = {
            ...companyState,
            contacts: (companyState.contacts || []).map(contact => ensureContactClassification(contact)),
          }
          set(state => ({
            companies: {
              ...state.companies,
              [slug]: normalized,
            },
            currentCompanySlug: slug,
          }))
        } else {
          setError(`Company "${slug}" not found`)
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load company')
      } finally {
        setLoading(false)
      }
    },

    // Save company to storage
    saveCompany: async (slug: string) => {
      const { storage, companies, setError } = get()
      const company = companies[slug]
      
      if (!company) {
        setError(`Company "${slug}" not found`)
        return
      }

      try {
        await storage.save(slug, company)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to save company')
      }
    },

    // CSV Import methods
    importBrandsCsv: async (csvData: string) => {
      const { currentCompanySlug, companies, updateCompanyState } = get()
      
      if (!currentCompanySlug) {
        throw new Error('No company selected')
      }

      // Parse CSV data
      const Papa = await import('papaparse')
      const parseResult = Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        delimiter: ',',
        transformHeader: (header) => header.toLowerCase().replace(/\s+/g, '_'),
      })

      if (parseResult.errors.length > 0) {
        console.warn('CSV parsing warnings:', parseResult.errors)
        // Only throw error for critical parsing issues, not warnings
        const criticalErrors = parseResult.errors.filter(e => e.type === 'Delimiter' || e.type === 'FieldMismatch')
        if (criticalErrors.length > 0) {
          throw new Error(`CSV parsing errors: ${criticalErrors.map(e => e.message).join(', ')}`)
        }
      }

      // Transform data
      const result = transformBrandsCsv(parseResult.data as any[])
      
      if (result.data.length > 0) {
        const company = companies[currentCompanySlug]
        const newBrands = result.data.map(item => item.brand)
        const newRevenueRows = result.data.flatMap(item => item.revenueRows)
        
        updateCompanyState(currentCompanySlug, {
          brands: [...company.brands, ...newBrands],
          revenueRows: [...company.revenueRows, ...newRevenueRows],
        })
      }

      return result
    },

    importContactsCsv: async (
      csvData: string,
      options?: { overwrite?: boolean; preserveEdits?: boolean; preview?: boolean }
    ) => {
      const { currentCompanySlug } = get()

      const Papa = await import('papaparse')
      const parseResult = Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        delimiter: ',',
        transformHeader: (header) => header.toLowerCase().replace(/\s+/g, '_'),
      })

      if (parseResult.errors.length > 0) {
        console.warn('CSV parsing warnings:', parseResult.errors)
        // Only throw error for critical parsing issues, not warnings
        const criticalErrors = parseResult.errors.filter(e => e.type === 'Delimiter' || e.type === 'FieldMismatch')
        if (criticalErrors.length > 0) {
          throw new Error(`CSV parsing errors: ${criticalErrors.map(e => e.message).join(', ')}`)
        }
      }

      const result = transformContactsCsv(parseResult.data as any[])

      if (result.data.length > 0) {
        const overwrite = options?.overwrite === true
        const preserveEdits = options?.preserveEdits !== false
        const fallbackSlug = currentCompanySlug || undefined

        const preview = buildContactImportPreview(result.data, get().companies, fallbackSlug)

        if (options?.preview !== false) {
          const previewId = `contact-preview-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
          set({
            pendingContactImport: {
              id: previewId,
              groups: preview.groups,
              recordsByGroup: preview.recordsByGroup,
              options: { overwrite, preserveEdits },
              fallbackSlug,
            },
          })
          return { ...result, previewId, previewGroups: preview.groups }
        }

        const defaultAssignments: Record<string, ContactImportAssignment> = {}
        preview.groups.forEach(group => {
          defaultAssignments[group.key] = group.defaultAssignment
        })

        const { storage } = get()
        const committed = applyContactAssignmentsToCompanies(
          get().companies,
          preview.recordsByGroup,
          defaultAssignments,
          { overwrite, preserveEdits },
          fallbackSlug
        )

        set({ companies: committed.companies, isHydrated: true })
        committed.touchedSlugs.forEach(slug => {
          storage.save(slug, committed.companies[slug]).catch(() => {})
        })
      }

      return result
    },

    importContactsFromUrl: async (url, options) => {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch contacts CSV (${response.status})`)
      }
      const text = await response.text()
      await get().importContactsCsv(text, options)
    },

    hydrateFromStorage: async () => {
      if (get().isHydrated) return
      const { storage } = get()
      try {
        set({ isLoading: true })
        const list = await storage.listCompanies()
        if (!list.length) {
          set({ isHydrated: true, isLoading: false })
          return
        }
        const entries = await Promise.all(
          list.map(async ({ slug }) => {
            const company = await storage.load(slug)
            if (!company) return null
            return [slug, {
              ...company,
              contacts: company.contacts.map(contact => ensureContactClassification(contact)),
            }] as const
          })
        )
        const hydrated = Object.fromEntries(entries.filter(Boolean) as Array<[string, CompanyState]>)
        set(state => ({
          companies: { ...hydrated, ...state.companies },
          currentCompanySlug: state.currentCompanySlug || Object.keys(hydrated)[0] || state.currentCompanySlug,
          isHydrated: true,
          isLoading: false,
        }))
      } catch (error) {
        set({
          isHydrated: true,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load saved companies',
        })
      }
    },

    clearPendingContactImport: () => {
      set({ pendingContactImport: null })
    },

    applyPendingContactImport: async (id, assignments) => {
      const state = get()
      const pending = state.pendingContactImport
      if (!pending || pending.id !== id) {
        throw new Error('No pending contact import to apply')
      }

      const finalAssignments: Record<string, ContactImportAssignment> = {}
      pending.groups.forEach(group => {
        const provided = assignments[group.key]
        if (provided) {
          finalAssignments[group.key] = provided
        } else {
          finalAssignments[group.key] = group.defaultAssignment
        }
      })

      const committed = applyContactAssignmentsToCompanies(
        state.companies,
        pending.recordsByGroup,
        finalAssignments,
        pending.options,
        pending.fallbackSlug
      )

      const { storage } = get()

      set({
        companies: committed.companies,
        pendingContactImport: null,
        isHydrated: true,
      })

      committed.touchedSlugs.forEach(slug => {
        storage.save(slug, committed.companies[slug]).catch(() => {})
      })
    },

    importRevenueCsv: async (csvData: string) => {
      const { currentCompanySlug, companies, updateCompanyState } = get()
      
      if (!currentCompanySlug) {
        throw new Error('No company selected')
      }

      // Parse CSV data
      const Papa = await import('papaparse')
      const parseResult = Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        delimiter: ',',
        transformHeader: (header) => header.toLowerCase().replace(/\s+/g, '_'),
      })

      if (parseResult.errors.length > 0) {
        console.warn('CSV parsing warnings:', parseResult.errors)
        // Only throw error for critical parsing issues, not warnings
        const criticalErrors = parseResult.errors.filter(e => e.type === 'Delimiter' || e.type === 'FieldMismatch')
        if (criticalErrors.length > 0) {
          throw new Error(`CSV parsing errors: ${criticalErrors.map(e => e.message).join(', ')}`)
        }
      }

      // Decide if this is a multi-company import (has 'company' column with values)
      const rawRows = parseResult.data as any[]
      const hasCompany = rawRows.some(r => (r['company'] || '').toString().trim())

      if (hasCompany) {
        // Multi-company path (supports millions scaling like Master import)
        const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
        const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
        type WorkingCompany = CompanyState & { _brandByName: Map<string, Brand>; _revByBrandYear: Map<string, Map<number, RevenueRow>> }
        const working = new Map<string, WorkingCompany>()

        const parseMillions = (v: any): number | null => {
          if (v === undefined || v === null || `${v}`.toString().trim() === '') return null
          const n = parseFloat(`${v}`.replace(/[,$]/g, ''))
          if (isNaN(n)) return null
          return n * 1_000_000
        }

        for (const row of rawRows) {
          const companyName = (row['company'] || '').toString().trim()
          if (!companyName) continue
          const brandName = (row['brand'] || row['product'] || '').toString().trim()
          if (!brandName) continue
          const slug = slugify(companyName)

          let wc = working.get(slug)
          if (!wc) {
            const existing = companies[slug]
            const base: CompanyState = existing
              ? existing
              : {
                  id: `company-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  name: companyName,
                  slug,
                  brands: [],
                  contacts: [],
                  revenueRows: [],
                  filters: { brands: [], therapeuticAreas: [], functionalAreas: [], levels: [], titleSearch: '', knownOnly: false },
                  orgCharts: [],
                  currentOrgChartId: null,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }
            wc = Object.assign({}, base, {
              _brandByName: new Map<string, Brand>(),
              _revByBrandYear: new Map<string, Map<number, RevenueRow>>()
            })
            base.brands.forEach(b => wc!._brandByName.set(b.name.toLowerCase(), b))
            base.revenueRows.forEach(r => {
              const byYear = wc!._revByBrandYear.get(r.brandId) || new Map<number, RevenueRow>()
              byYear.set(r.year, r)
              wc!._revByBrandYear.set(r.brandId, byYear)
            })
            working.set(slug, wc)
          }

          const brandKey = brandName.toLowerCase()
          let brand = wc._brandByName.get(brandKey)
          if (!brand) {
            brand = {
              id: genId(),
              name: brandName,
              status: 'In Pipeline',
              phase: 'Unknown',
              therapeuticArea: (row['therapeutic_area'] || '').toString().trim() || 'Unknown',
              molecule: (row['molecular_name'] || row['product'] || '').toString().trim() || undefined,
              indication: (row['indication'] || '').toString().trim() || undefined,
              createdAt: new Date(),
              updatedAt: new Date(),
            }
            wc._brandByName.set(brandKey, brand)
          }

          const year = parseInt((row['year'] || '').toString(), 10)
          if (!isNaN(year)) {
            const ww = parseMillions(row['ww_sales'])
            const us = parseMillions(row['us_sales'])
            const byYear = wc._revByBrandYear.get(brand.id) || new Map<number, RevenueRow>()
            const existing = byYear.get(year)
            const now = new Date()
            const rev: RevenueRow = existing
              ? { ...existing, wwSales: ww ?? existing.wwSales, usSales: us ?? existing.usSales, updatedAt: now }
              : { id: genId(), brandId: brand.id, year, wwSales: ww, usSales: us, createdAt: now, updatedAt: now }
            byYear.set(year, rev)
            wc._revByBrandYear.set(brand.id, byYear)
          }
        }

        // Commit updates
        set(state => {
          const newCompanies = { ...state.companies }
          working.forEach((wc, slug) => {
            const brands = Array.from(wc._brandByName.values())
            const revenueRows: RevenueRow[] = []
            wc._revByBrandYear.forEach(byYear => byYear.forEach(r => revenueRows.push(r)))
            const existing = state.companies[slug]
            newCompanies[slug] = {
              id: existing?.id || wc.id,
              name: wc.name,
              slug,
              brands,
              contacts: existing?.contacts || wc.contacts,
              revenueRows,
              filters: existing?.filters || wc.filters,
              orgCharts: existing?.orgCharts ?? wc.orgCharts ?? [],
              currentOrgChartId: existing?.currentOrgChartId ?? wc.currentOrgChartId ?? null,
              createdAt: existing?.createdAt || wc.createdAt,
              updatedAt: new Date(),
            }
          })
          return { companies: newCompanies }
        })

        // Build a generic result for UI error display (reuse transformer)
        const result = transformRevenueCsv(rawRows)
        return result
      }

      // Single-company path (original): uses currentCompanySlug
      const result = transformRevenueCsv(rawRows)

      // Build brand info map from CSV rows to enrich new brands
      const brandInfoMap = new Map<string, { name: string; therapeuticArea?: string; molecule?: string; indication?: string }>()
      for (const row of rawRows) {
        const brandName = (row['brand'] || '').toString().trim()
        if (!brandName) continue
        const key = brandName.toLowerCase()
        if (!brandInfoMap.has(key)) {
          const molecule = (row['molecular_name'] || row['product'] || '').toString().trim() || undefined
          const indication = (row['indication'] || '').toString().trim() || undefined
          const therapeuticArea = (row['therapeutic_area'] || '').toString().trim() || undefined
          brandInfoMap.set(key, {
            name: brandName,
            molecule,
            indication,
            therapeuticArea,
          })
        }
      }

      if (result.data.length > 0) {
        const company = companies[currentCompanySlug]

        // Map revenue to existing brands and create brand shells for unmapped
        const { mappedRevenue, unmappedBrands } = mapRevenueToBrands(result.data, company.brands)
        const brandShellInfos = unmappedBrands.map(name => brandInfoMap.get(name.toLowerCase()) || { name })
        const brandShells = createBrandShellsWithInfo(brandShellInfos)

        updateCompanyState(currentCompanySlug, {
          brands: [...company.brands, ...brandShells],
          revenueRows: [...company.revenueRows, ...mappedRevenue],
        })
      }

      return result
    },

    // Brand management
    addBrand: (brand: Brand) => {
      const { currentCompanySlug, companies, updateCompanyState } = get()
      if (!currentCompanySlug) return

      const company = companies[currentCompanySlug]
      updateCompanyState(currentCompanySlug, {
        brands: [...company.brands, brand],
      })
    },

    updateBrand: (id: string, updates: Partial<Brand>) => {
      const { currentCompanySlug, companies, updateCompanyState } = get()
      if (!currentCompanySlug) return

      const company = companies[currentCompanySlug]
      const updatedBrands = company.brands.map(brand =>
        brand.id === id ? { ...brand, ...updates, updatedAt: new Date() } : brand
      )

      updateCompanyState(currentCompanySlug, { brands: updatedBrands })
    },

    deleteBrand: (id: string) => {
      const { currentCompanySlug, companies, updateCompanyState } = get()
      if (!currentCompanySlug) return

      const company = companies[currentCompanySlug]
      const updatedBrands = company.brands.filter(brand => brand.id !== id)
      const updatedRevenueRows = company.revenueRows.filter(revenue => revenue.brandId !== id)

      updateCompanyState(currentCompanySlug, {
        brands: updatedBrands,
        revenueRows: updatedRevenueRows,
      })
    },

    // Contact management
    addContact: (contact: Contact) => {
      const { currentCompanySlug, companies, updateCompanyState } = get()
      if (!currentCompanySlug) return

      const company = companies[currentCompanySlug]
      updateCompanyState(currentCompanySlug, {
        contacts: [...company.contacts, ensureContactClassification(contact)],
      })
    },

    updateContact: (id: string, updates: Partial<Contact>) => {
      const { currentCompanySlug, companies, updateCompanyState } = get()
      if (!currentCompanySlug) return

      const company = companies[currentCompanySlug]
      const updatedContacts = company.contacts.map(contact =>
        contact.id === id
          ? ensureContactClassification({ ...contact, ...updates, updatedAt: new Date() })
          : contact
      )

      updateCompanyState(currentCompanySlug, { contacts: updatedContacts })
    },

    deleteContact: (id: string) => {
      const { currentCompanySlug, companies, updateCompanyState } = get()
      if (!currentCompanySlug) return

      const company = companies[currentCompanySlug]
      const updatedContacts = company.contacts.filter(contact => contact.id !== id)

      updateCompanyState(currentCompanySlug, { contacts: updatedContacts })
    },

    toggleContactKnown: (id: string) => {
      const { currentCompanySlug, companies, updateCompanyState } = get()
      if (!currentCompanySlug) return

      const company = companies[currentCompanySlug]
      const updatedContacts = company.contacts.map(contact =>
        contact.id === id ? { ...contact, known: !contact.known, updatedAt: new Date() } : contact
      )

      updateCompanyState(currentCompanySlug, { contacts: updatedContacts })
    },

    // Revenue management
    addRevenueRow: (revenueRow: RevenueRow) => {
      const { currentCompanySlug, companies, updateCompanyState } = get()
      if (!currentCompanySlug) return

      const company = companies[currentCompanySlug]
      updateCompanyState(currentCompanySlug, {
        revenueRows: [...company.revenueRows, revenueRow],
      })
    },

    updateRevenueRow: (id: string, updates: Partial<RevenueRow>) => {
      const { currentCompanySlug, companies, updateCompanyState } = get()
      if (!currentCompanySlug) return

      const company = companies[currentCompanySlug]
      const updatedRevenueRows = company.revenueRows.map(revenue =>
        revenue.id === id ? { ...revenue, ...updates, updatedAt: new Date() } : revenue
      )

      updateCompanyState(currentCompanySlug, { revenueRows: updatedRevenueRows })
    },

    deleteRevenueRow: (id: string) => {
      const { currentCompanySlug, companies, updateCompanyState } = get()
      if (!currentCompanySlug) return

      const company = companies[currentCompanySlug]
      const updatedRevenueRows = company.revenueRows.filter(revenue => revenue.id !== id)

      updateCompanyState(currentCompanySlug, { revenueRows: updatedRevenueRows })
    },

    // Filter management
    updateFilters: (filters: Partial<Filters>) => {
      const { currentCompanySlug, companies, updateCompanyState } = get()
      if (!currentCompanySlug) return

      const company = companies[currentCompanySlug]
      updateCompanyState(currentCompanySlug, {
        filters: { ...company.filters, ...filters },
      })
    },

    resetFilters: () => {
      const { currentCompanySlug, updateCompanyState } = get()
      if (!currentCompanySlug) return

      updateCompanyState(currentCompanySlug, {
        filters: initialFilters,
      })
    },

    // Export/Import
    exportState: () => {
      const { currentCompanySlug, companies } = get()
      if (!currentCompanySlug) return null

      return companies[currentCompanySlug] || null
    },

    importState: (state: CompanyState) => {
      set(currentState => ({
        companies: {
          ...currentState.companies,
          [state.slug]: state,
        },
        currentCompanySlug: state.slug,
      }))
    },

    // Master CSV import (streamed, supports 50k+ rows)
    importMasterCsv: async (file: File, onProgress) => {
      const { companies } = get()

      const slugify = (s: string) =>
        s
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')
      const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

      type WorkingCompany = CompanyState & {
        _brandByName: Map<string, Brand>
        _revByBrandYear: Map<string, Map<number, RevenueRow>>
      }

      const working = new Map<string, WorkingCompany>()
      let processed = 0
      let brandsCreated = 0
      let upserts = 0

      const Papa = await import('papaparse')
      await new Promise<void>((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          delimiter: ',',
          worker: true,
          step: (results) => {
            const raw = results.data as any
            // Normalize header keys here since worker cannot clone transformHeader
            const row: any = {}
            for (const key in raw) {
              const nk = key.toString().toLowerCase().replace(/\s+/g, '_')
              row[nk] = (raw as any)[key]
            }
            processed++

            const companyName = (row['company'] || '').toString().trim()
            if (!companyName) return
            const brandName = (row['brand'] || row['product'] || '').toString().trim()
            if (!brandName) return

            const slug = slugify(companyName)
            let wc = working.get(slug)
            if (!wc) {
              const existing = companies[slug]
              const base: CompanyState = existing
                ? existing
                : {
                    id: `company-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    name: companyName,
                    slug,
                    brands: [],
                    contacts: [],
                    revenueRows: [],
                    filters: { brands: [], therapeuticAreas: [], functionalAreas: [], levels: [], titleSearch: '', knownOnly: false },
                    orgCharts: [],
                    currentOrgChartId: null,
                    targets: [],
                    insights: [],
                    attachments: [],
                    links: [],
                    tier: 'UNCLASSIFIED',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  }
              wc = Object.assign({}, base, {
                _brandByName: new Map<string, Brand>(),
                _revByBrandYear: new Map<string, Map<number, RevenueRow>>()
              })
              base.brands.forEach(b => wc!._brandByName.set(b.name.toLowerCase(), b))
              base.revenueRows.forEach(r => {
                const byYear = wc!._revByBrandYear.get(r.brandId) || new Map<number, RevenueRow>()
                byYear.set(r.year, r)
                wc!._revByBrandYear.set(r.brandId, byYear)
              })
              working.set(slug, wc)
            }

            const brandKey = brandName.toLowerCase()
            let brand = wc._brandByName.get(brandKey)
            if (!brand) {
              brand = {
                id: genId(),
                name: brandName,
                status: 'In Pipeline',
                phase: 'Unknown',
                therapeuticArea: (row['therapeutic_area'] || '').toString().trim() || 'Unknown',
                molecule: (row['molecular_name'] || row['product'] || '').toString().trim() || undefined,
                indication: (row['indication'] || '').toString().trim() || undefined,
                mechanismOfAction: (row['mechanism_of_action'] || '').toString().trim() || undefined,
                technology: (row['technology'] || '').toString().trim() || undefined,
                technologySubtypeClassifications: (row['technology_subtype_classifications'] || '').toString().trim() || undefined,
                indicationMarketStatus: (row['indication_market_status'] || '').toString().trim() || undefined,
                indicationBreakdown: (row['indication_breakdown'] || '').toString().trim() || undefined,
                createdAt: new Date(),
                updatedAt: new Date(),
              }
              wc._brandByName.set(brandKey, brand)
              brandsCreated++
            }

            // numbers in MILLIONS USD -> convert to absolute dollars
            const year = parseInt((row['year'] || '').toString(), 10)
            if (!isNaN(year)) {
              const parseMillions = (v: any): number | null => {
                if (v === undefined || v === null || `${v}`.toString().trim() === '') return null
                const n = parseFloat(`${v}`.replace(/[,$]/g, ''))
                if (isNaN(n)) return null
                return n * 1_000_000
              }
              const ww = parseMillions(row['ww_sales'])
              const us = parseMillions(row['us_sales'])
              const byYear = wc._revByBrandYear.get(brand.id) || new Map<number, RevenueRow>()
              const existing = byYear.get(year)
              const now = new Date()
              const rev: RevenueRow = existing
                ? { ...existing, wwSales: ww ?? existing.wwSales, usSales: us ?? existing.usSales, updatedAt: now }
                : { id: genId(), brandId: brand.id, year, wwSales: ww, usSales: us, createdAt: now, updatedAt: now }
              byYear.set(year, rev)
              wc._revByBrandYear.set(brand.id, byYear)
              upserts++
            }

            if (onProgress && processed % 1000 === 0) {
              onProgress({ processed, companies: working.size, brands: brandsCreated, upserts })
            }
          },
          complete: () => resolve(),
          error: (err) => reject(err),
        })
      })

      // Commit to store in one update
      set(state => {
        const newCompanies = { ...state.companies }
        working.forEach((wc, slug) => {
          const brands = Array.from(wc._brandByName.values())
          const revenueRows: RevenueRow[] = []
          wc._revByBrandYear.forEach(byYear => byYear.forEach(r => revenueRows.push(r)))
          const existing = state.companies[slug]
          newCompanies[slug] = {
            id: existing?.id || wc.id,
            name: wc.name,
            slug,
            brands,
            contacts: existing?.contacts || wc.contacts,
            revenueRows,
            filters: existing?.filters || wc.filters,
            orgCharts: existing?.orgCharts ?? wc.orgCharts ?? [],
            currentOrgChartId: existing?.currentOrgChartId ?? wc.currentOrgChartId ?? null,
            targets: existing?.targets ?? wc.targets ?? [],
            insights: existing?.insights ?? wc.insights ?? [],
            attachments: existing?.attachments ?? wc.attachments ?? [],
            links: existing?.links ?? wc.links ?? [],
            tier: (existing?.tier ?? wc.tier ?? 'UNCLASSIFIED') as CompanyTier,
            createdAt: existing?.createdAt || wc.createdAt,
            updatedAt: new Date(),
          }
        })
        return { companies: newCompanies }
      })

      return {
        total: processed,
        processed,
        companiesAffected: working.size,
        brandsCreated,
        upserts,
        affectedCompanies: Array.from(working.values()).map(wc => ({ slug: wc.slug, name: wc.name })),
      }
    },

    // Org charts
    createOrgChart: (name: string) => {
      const { currentCompanySlug, companies, updateCompanyState } = get()
      if (!currentCompanySlug) return null
      const now = new Date()
      const id = `org-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      const newChart: OrgChart = {
        id,
        name: name.trim() || 'Untitled',
        nodes: [],
        cardVariant: ORG_DEFAULT_CARD_VARIANT,
        createdAt: now,
        updatedAt: now,
      }
      const company = companies[currentCompanySlug]
      updateCompanyState(currentCompanySlug, {
        orgCharts: [...(company.orgCharts || []), newChart],
        currentOrgChartId: id,
      })
      return id
    },

    renameOrgChart: (id: string, name: string) => {
      const { currentCompanySlug, companies, updateCompanyState } = get()
      if (!currentCompanySlug) return
      const company = companies[currentCompanySlug]
      const updated = (company.orgCharts || []).map(c =>
        c.id === id ? { ...c, name: name.trim() || c.name, updatedAt: new Date() } : c
      )
      updateCompanyState(currentCompanySlug, { orgCharts: updated })
    },

    deleteOrgChart: (id: string) => {
      const { currentCompanySlug, companies, updateCompanyState } = get()
      if (!currentCompanySlug) return
      const company = companies[currentCompanySlug]
      const updated = (company.orgCharts || []).filter(c => c.id !== id)
      const nextId = company.currentOrgChartId === id ? null : company.currentOrgChartId
      updateCompanyState(currentCompanySlug, { orgCharts: updated, currentOrgChartId: nextId })
    },

    setCurrentOrgChart: (id: string | null) => {
      const { currentCompanySlug, updateCompanyState } = get()
      if (!currentCompanySlug) return
      updateCompanyState(currentCompanySlug, { currentOrgChartId: id })
    },

    addNodeToCurrentChart: (node: OrgChartNode) => {
      const { currentCompanySlug, companies, updateCompanyState } = get()
      if (!currentCompanySlug) return
      const company = companies[currentCompanySlug]
      const chartId = company.currentOrgChartId
      if (!chartId) return
      const charts = (company.orgCharts || []).map(chart => {
        if (chart.id !== chartId) return chart
        const existing = chart.nodes.find(n => n.contactId === node.contactId)
        const nodes = existing
          ? chart.nodes.map(n => (n.contactId === node.contactId ? { ...n, ...node } : n))
          : [...chart.nodes, node]
        return { ...chart, nodes, updatedAt: new Date() }
      })
      updateCompanyState(currentCompanySlug, { orgCharts: charts })
    },

    updateNodeInCurrentChart: (contactId: string, pos: { x: number; y: number }) => {
      const { currentCompanySlug, companies, updateCompanyState } = get()
      if (!currentCompanySlug) return
      const company = companies[currentCompanySlug]
      const chartId = company.currentOrgChartId
      if (!chartId) return
      const charts = (company.orgCharts || []).map(chart => {
        if (chart.id !== chartId) return chart
        const nodes = chart.nodes.map(n => (n.contactId === contactId ? { ...n, ...pos } : n))
        return { ...chart, nodes, updatedAt: new Date() }
      })
      updateCompanyState(currentCompanySlug, { orgCharts: charts })
    },

    removeNodeFromCurrentChart: (contactId: string) => {
      const { currentCompanySlug, companies, updateCompanyState } = get()
      if (!currentCompanySlug) return
      const company = companies[currentCompanySlug]
      const chartId = company.currentOrgChartId
      if (!chartId) return
      const charts = (company.orgCharts || []).map(chart => {
        if (chart.id !== chartId) return chart
        const nodes = chart.nodes.filter(n => n.contactId !== contactId)
        return { ...chart, nodes, updatedAt: new Date() }
      })
      updateCompanyState(currentCompanySlug, { orgCharts: charts })
    },

    setNodeTags: (contactId: string, tags: FollowUpTag[]) => {
      const { currentCompanySlug, companies, updateCompanyState } = get()
      if (!currentCompanySlug) return
      const company = companies[currentCompanySlug]
      const chartId = company.currentOrgChartId
      if (!chartId) return
      const charts = (company.orgCharts || []).map(chart => {
        if (chart.id !== chartId) return chart
        const nodes = chart.nodes.map(n => (n.contactId === contactId ? { ...n, tags } : n))
        return { ...chart, nodes, updatedAt: new Date() }
      })
      updateCompanyState(currentCompanySlug, { orgCharts: charts })
    },

    setNodeParent: (contactId: string, parentId: string | null) => {
      const { currentCompanySlug, companies, updateCompanyState } = get()
      if (!currentCompanySlug) return
      const company = companies[currentCompanySlug]
      const chartId = company.currentOrgChartId
      if (!chartId) return
      const charts = (company.orgCharts || []).map(chart => {
        if (chart.id !== chartId) return chart
        const nodesById = new Map(chart.nodes.map(n => [n.contactId, n]))
        if (!nodesById.has(contactId)) return chart
        let nextParentId = parentId
        if (nextParentId === contactId) nextParentId = null
        if (nextParentId && !nodesById.has(nextParentId)) nextParentId = null
        if (nextParentId) {
          const visited = new Set<string>()
          let cursor: string | null | undefined = nextParentId
          while (cursor) {
            if (cursor === contactId) {
              nextParentId = null
              break
            }
            if (visited.has(cursor)) break
            visited.add(cursor)
            cursor = nodesById.get(cursor)?.parentId ?? null
          }
        }
        const parentCluster = nextParentId ? nodesById.get(nextParentId)?.clusterId ?? null : null
        const nodes = chart.nodes.map(n => {
          if (n.contactId !== contactId) return n
          const clusterId = parentCluster ?? n.clusterId ?? null
          return { ...n, parentId: nextParentId ?? null, clusterId }
        })
        return { ...chart, nodes, updatedAt: new Date() }
      })
      updateCompanyState(currentCompanySlug, { orgCharts: charts })
    },

    breakNodeRelationships: (contactId: string, mode: 'boss' | 'reports' | 'all') => {
      const { currentCompanySlug, companies, updateCompanyState } = get()
      if (!currentCompanySlug) return
      const company = companies[currentCompanySlug]
      const chartId = company.currentOrgChartId
      if (!chartId) return
      const charts = (company.orgCharts || []).map(chart => {
        if (chart.id !== chartId) return chart
        const nodes = chart.nodes.map(node => {
          if (node.contactId === contactId && (mode === 'boss' || mode === 'all')) {
            return { ...node, parentId: null }
          }
          if (node.parentId === contactId && (mode === 'reports' || mode === 'all')) {
            return { ...node, parentId: null }
          }
          return node
        })
        return { ...chart, nodes, updatedAt: new Date() }
      })
      updateCompanyState(currentCompanySlug, { orgCharts: charts })
    },

    resizeCurrentChartNodes: (variant: OrgCardVariant) => {
      const { currentCompanySlug, companies, updateCompanyState } = get()
      if (!currentCompanySlug) return
      const company = companies[currentCompanySlug]
      const chartId = company.currentOrgChartId
      if (!chartId) return
      const metrics = ORG_CARD_METRICS[variant] || ORG_CARD_METRICS[ORG_DEFAULT_CARD_VARIANT]
      const charts = (company.orgCharts || []).map(chart => {
        if (chart.id !== chartId) return chart
        const nodes = chart.nodes.map(node => ({
          ...node,
          width: metrics.width,
          height: metrics.height,
        }))
        return {
          ...chart,
          nodes,
          cardVariant: variant,
          updatedAt: new Date(),
        }
      })
      updateCompanyState(currentCompanySlug, { orgCharts: charts })
      // Reflow after resizing so everything snaps to the new dimensions
      if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => {
          get().reflowCurrentChartLayout()
        })
      } else {
        get().reflowCurrentChartLayout()
      }
    },

    moveNodeTreeInCurrentChart: (contactId: string, delta: { dx: number; dy: number }) => {
      if (!delta.dx && !delta.dy) return
      const { currentCompanySlug, companies, updateCompanyState } = get()
      if (!currentCompanySlug) return
      const company = companies[currentCompanySlug]
      const chartId = company.currentOrgChartId
      if (!chartId) return
      const charts = (company.orgCharts || []).map(chart => {
        if (chart.id !== chartId) return chart
        const childMap = new Map<string, string[]>()
        chart.nodes.forEach(node => {
          if (!node.parentId) return
          const list = childMap.get(node.parentId) ?? []
          list.push(node.contactId)
          childMap.set(node.parentId, list)
        })
        const subtree = new Set<string>()
        const collect = (id: string) => {
          if (subtree.has(id)) return
          subtree.add(id)
          const children = childMap.get(id) || []
          children.forEach(childId => collect(childId))
        }
        collect(contactId)
        if (!subtree.size) return chart
        const nodes = chart.nodes.map(node => {
          if (!subtree.has(node.contactId)) return node
          const width = node.width ?? ORG_CARD_WIDTH
          const height = node.height ?? ORG_CARD_HEIGHT
          return {
            ...node,
            x: Math.max(0, node.x + delta.dx),
            y: Math.max(0, node.y + delta.dy),
            width,
            height,
          }
        })
        let canvasWidth = chart.canvas?.width ?? ORG_MIN_CANVAS_WIDTH
        let canvasHeight = chart.canvas?.height ?? ORG_MIN_CANVAS_HEIGHT
        nodes.forEach(node => {
          const width = node.width ?? ORG_CARD_WIDTH
          const height = node.height ?? ORG_CARD_HEIGHT
          canvasWidth = Math.max(canvasWidth, node.x + width + ORG_CANVAS_MARGIN)
          canvasHeight = Math.max(canvasHeight, node.y + height + ORG_CANVAS_MARGIN)
        })
        return {
          ...chart,
          nodes,
          canvas: {
            width: Math.max(canvasWidth, ORG_MIN_CANVAS_WIDTH),
            height: Math.max(canvasHeight, ORG_MIN_CANVAS_HEIGHT),
          },
          updatedAt: new Date(),
        }
      })
      updateCompanyState(currentCompanySlug, { orgCharts: charts })
    },

    reflowCurrentChartLayout: () => {
      const { currentCompanySlug, companies, updateCompanyState } = get()
      if (!currentCompanySlug) return
      const company = companies[currentCompanySlug]
      const chartId = company.currentOrgChartId
      if (!chartId) return
      const contactMap = new Map(company.contacts.map(contact => [contact.id, contact]))
      const charts = (company.orgCharts || []).map(chart => {
        if (chart.id !== chartId) return chart
        const layout = alignChartByExistingStructure(chart, contactMap)
        return {
          ...chart,
          nodes: layout.nodes,
          clusters: layout.clusters,
          canvas: layout.canvas,
          updatedAt: new Date(),
        }
      })
      updateCompanyState(currentCompanySlug, { orgCharts: charts })
    },

    autoClusterFilteredContacts: () => {
      const { currentCompanySlug, companies, updateCompanyState } = get()
      if (!currentCompanySlug) return
      const company = companies[currentCompanySlug]
      const chartId = company.currentOrgChartId
      if (!chartId) return
      const filtered = selectors.selectFilteredContacts(company)
      if (filtered.length === 0) {
        const charts = (company.orgCharts || []).map(chart =>
          chart.id === chartId
            ? { ...chart, nodes: [], clusters: [], canvas: { width: ORG_MIN_CANVAS_WIDTH, height: ORG_MIN_CANVAS_HEIGHT }, updatedAt: new Date() }
            : chart
        )
        updateCompanyState(currentCompanySlug, { orgCharts: charts })
        return
      }

      const clusterBuckets = new Map<string, { label: string; contacts: Contact[] }>()
      filtered.forEach(contact => {
        const label = clusterLabelForContact(contact)
        if (!clusterBuckets.has(label)) {
          clusterBuckets.set(label, { label, contacts: [] })
        }
        clusterBuckets.get(label)!.contacts.push(contact)
      })

      const orderedClusters = Array.from(clusterBuckets.values()).sort((a, b) => a.label.localeCompare(b.label))

      const contactMap = new Map(company.contacts.map(contact => [contact.id, contact]))
      const currentChart = (company.orgCharts || []).find(chart => chart.id === chartId) || null
      const activeVariant: OrgCardVariant = currentChart?.cardVariant ?? ORG_DEFAULT_CARD_VARIANT
      const activeMetrics = ORG_CARD_METRICS[activeVariant]
      const existingNodeMap = new Map((currentChart?.nodes || []).map(node => [node.contactId, node]))

      const nodes: OrgChartNode[] = []
      const clustersMeta: OrgChartCluster[] = []
      const assignedContactIds = new Set<string>()

      orderedClusters.forEach((bucket, index) => {
        const clusterId = slugifyClusterId(bucket.label, index)
        clustersMeta.push({ id: clusterId, label: bucket.label, x: 0, y: 0, width: 0 })

        const decorated = bucket.contacts.map(contact => ({
          contact,
          levelIndex: orgRoleIndex(inferRoleFromTitle(contact.title)),
        }))

        if (decorated.length === 0) return

        decorated.sort((a, b) => {
          if (a.levelIndex !== b.levelIndex) return a.levelIndex - b.levelIndex
          return sortContactsByName(a.contact, b.contact)
        })

        type ClusterNodeRecord = { levelIndex: number; contact: Contact; node: OrgChartNode }
        const clusterNodes: ClusterNodeRecord[] = decorated.map(entry => {
          const existing = existingNodeMap.get(entry.contact.id)
          const node: OrgChartNode = {
            contactId: entry.contact.id,
            x: 0,
            y: 0,
            clusterId,
            parentId: null,
            width: existing?.width ?? activeMetrics.width,
            height: existing?.height ?? activeMetrics.height,
            ...(existing?.tags ? { tags: existing.tags } : {}),
          }
          return { levelIndex: entry.levelIndex, contact: entry.contact, node }
        })

        if (!clusterNodes.length) return

        const minLevelIndex = Math.min(...clusterNodes.map(record => record.levelIndex))
        const childCounts = new Map<string, number>()

        clusterNodes
          .slice()
          .sort((a, b) => {
            if (a.levelIndex !== b.levelIndex) return a.levelIndex - b.levelIndex
            return sortContactsByName(a.contact, b.contact)
          })
          .forEach(record => {
            if (record.levelIndex === minLevelIndex) {
              record.node.parentId = null
              return
            }
            const candidates = clusterNodes
              .filter(candidate => candidate.levelIndex < record.levelIndex)
              .sort((a, b) => {
                const diffA = record.levelIndex - a.levelIndex
                const diffB = record.levelIndex - b.levelIndex
                if (diffA !== diffB) return diffA - diffB
                const countA = childCounts.get(a.node.contactId) ?? 0
                const countB = childCounts.get(b.node.contactId) ?? 0
                if (countA !== countB) return countA - countB
                return sortContactsByName(a.contact, b.contact)
              })
            const best = candidates[0]
            if (best) {
              record.node.parentId = best.node.contactId
              childCounts.set(best.node.contactId, (childCounts.get(best.node.contactId) ?? 0) + 1)
            } else {
              record.node.parentId = null
            }
          })

        clusterNodes.forEach(record => {
          nodes.push(record.node)
          assignedContactIds.add(record.node.contactId)
        })
      })

      const unclusteredContacts = filtered.filter(contact => !assignedContactIds.has(contact.id))
      if (unclusteredContacts.length > 0) {
        const fallbackClusterId = slugifyClusterId('Unclustered')
        clustersMeta.push({ id: fallbackClusterId, label: 'Unclustered', x: 0, y: 0, width: 0 })
        unclusteredContacts.forEach(contact => {
          const existing = existingNodeMap.get(contact.id)
          nodes.push({
            contactId: contact.id,
            x: 0,
            y: 0,
            clusterId: fallbackClusterId,
            parentId: null,
            width: existing?.width ?? activeMetrics.width,
            height: existing?.height ?? activeMetrics.height,
            ...(existing?.tags ? { tags: existing.tags } : {}),
          })
        })
      }

      const layoutInput: OrgChart = currentChart
        ? { ...currentChart, nodes, clusters: clustersMeta, canvas: currentChart.canvas }
        : {
            id: chartId,
            name: company.name,
            nodes,
            clusters: clustersMeta,
            canvas: { width: ORG_MIN_CANVAS_WIDTH, height: ORG_MIN_CANVAS_HEIGHT },
            cardVariant: activeVariant,
            createdAt: new Date(),
            updatedAt: new Date(),
          }

      const layout = alignChartByExistingStructure(layoutInput, contactMap)

      const charts = (company.orgCharts || []).map(chart =>
        chart.id === chartId
          ? {
              ...chart,
              nodes: layout.nodes,
              clusters: layout.clusters,
              canvas: layout.canvas,
              cardVariant: activeVariant,
              updatedAt: new Date(),
            }
          : chart
      )
      updateCompanyState(currentCompanySlug, { orgCharts: charts })
    },

    toggleBrandTarget: (brandId: string) => {
      const { currentCompanySlug, companies, updateCompanyState } = get()
      if (!currentCompanySlug) return
      const company = companies[currentCompanySlug]
      const set = new Set(company.targets || [])
      set.has(brandId) ? set.delete(brandId) : set.add(brandId)
      updateCompanyState(currentCompanySlug, { targets: Array.from(set) })
    },
  }))
)

export type { PendingContactImportState, ContactImportAssignment }

// Auto-save subscription
usePharmaVisualPivotStore.subscribe(
  (state) => state.companies,
  (companies, previousCompanies) => {
    // Auto-save when companies change
    const { currentCompanySlug, saveCompany } = usePharmaVisualPivotStore.getState()
    
    if (currentCompanySlug && companies[currentCompanySlug] !== previousCompanies?.[currentCompanySlug]) {
      saveCompany(currentCompanySlug)
    }
  }
)
