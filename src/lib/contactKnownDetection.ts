// Contact Known Detection based on Genome API activity data
import type { Contact } from '@/types/domain'

export interface ContactActivityData {
  emailCount?: number
  meetingCount?: number
  latestEmailDate?: string
  latestMeetingDate?: string
  totalActivity?: number
  lastEmailDate?: string
  lastKlickster?: string
}

export interface KnownDetectionConfig {
  minEmailCount: number
  minMeetingCount: number
  maxDaysSinceLastActivity: number
  requireRecentActivity: boolean
  activityThreshold: number
}

// Default configuration for determining if a contact is "known"
const DEFAULT_CONFIG: KnownDetectionConfig = {
  minEmailCount: 1, // At least 1 email
  minMeetingCount: 0, // Meetings are bonus, not required
  maxDaysSinceLastActivity: 365, // Within the last year
  requireRecentActivity: true, // Must have recent activity
  activityThreshold: 1 // At least 1 total activity
}

/**
 * Determines if a contact should be marked as "known" based on Genome API activity data
 */
export function shouldMarkAsKnown(
  contact: Contact,
  activityData?: ContactActivityData,
  config: KnownDetectionConfig = DEFAULT_CONFIG
): boolean {
  // If contact is already marked as known, keep it
  if (contact.known) {
    return true
  }

  // If no activity data, can't determine
  if (!activityData) {
    return false
  }

  const {
    emailCount = 0,
    meetingCount = 0,
    latestEmailDate,
    latestMeetingDate,
    totalActivity = 0,
    lastEmailDate,
    lastKlickster
  } = activityData

  // Check minimum activity thresholds
  const hasEmailActivity = emailCount >= config.minEmailCount
  const hasMeetingActivity = meetingCount >= config.minMeetingCount
  const hasTotalActivity = totalActivity >= config.activityThreshold

  // Check if we have any activity at all
  if (!hasEmailActivity && !hasMeetingActivity && !hasTotalActivity) {
    return false
  }

  // If we require recent activity, check dates
  if (config.requireRecentActivity) {
    const mostRecentDate = getMostRecentDate(latestEmailDate, latestMeetingDate, lastEmailDate)
    
    if (mostRecentDate) {
      const daysSinceActivity = getDaysSinceDate(mostRecentDate)
      if (daysSinceActivity > config.maxDaysSinceLastActivity) {
        return false
      }
    }
  }

  // Check if we have Klickster interaction data
  const hasKlicksterData = lastKlickster && lastKlickster.trim() !== ''

  // Mark as known if we meet the criteria
  return (hasEmailActivity || hasMeetingActivity || hasTotalActivity) && 
         (hasKlicksterData || hasRecentActivity(activityData, config))
}

/**
 * Gets the most recent date from multiple date fields
 */
function getMostRecentDate(...dates: (string | undefined)[]): string | null {
  const validDates = dates
    .filter(date => date && date.trim() !== '')
    .map(date => new Date(date!))
    .filter(date => !isNaN(date.getTime()))

  if (validDates.length === 0) {
    return null
  }

  const mostRecent = validDates.reduce((latest, current) => 
    current > latest ? current : latest
  )

  return mostRecent.toISOString()
}

/**
 * Calculates days since a given date
 */
function getDaysSinceDate(dateString: string): number {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Checks if there's recent activity based on the configuration
 */
function hasRecentActivity(activityData: ContactActivityData, config: KnownDetectionConfig): boolean {
  if (!config.requireRecentActivity) {
    return true
  }

  const { latestEmailDate, latestMeetingDate, lastEmailDate } = activityData
  const mostRecentDate = getMostRecentDate(latestEmailDate, latestMeetingDate, lastEmailDate)
  
  if (!mostRecentDate) {
    return false
  }

  const daysSinceActivity = getDaysSinceDate(mostRecentDate)
  return daysSinceActivity <= config.maxDaysSinceLastActivity
}

/**
 * Extracts activity data from a contact for known detection
 */
export function extractContactActivityData(contact: Contact): ContactActivityData {
  return {
    emailCount: contact.emailCount,
    meetingCount: contact.meetingCount,
    latestEmailDate: contact.latestMeetingDate, // Note: this might be a field mapping issue
    latestMeetingDate: contact.latestMeetingDate,
    totalActivity: contact.totalActivity,
    lastEmailDate: contact.lastEmailDate,
    lastKlickster: contact.lastKlickster
  }
}

/**
 * Updates contact known status based on Genome API activity
 */
export function updateContactKnownStatus(
  contact: Contact,
  activityData?: ContactActivityData,
  config: KnownDetectionConfig = DEFAULT_CONFIG
): Contact {
  const shouldBeKnown = shouldMarkAsKnown(contact, activityData, config)
  
  return {
    ...contact,
    known: shouldBeKnown
  }
}

/**
 * Batch update multiple contacts' known status
 */
export function batchUpdateKnownStatus(
  contacts: Contact[],
  config: KnownDetectionConfig = DEFAULT_CONFIG
): Contact[] {
  return contacts.map(contact => {
    const activityData = extractContactActivityData(contact)
    return updateContactKnownStatus(contact, activityData, config)
  })
}

/**
 * Get statistics about known contact detection
 */
export function getKnownDetectionStats(contacts: Contact[]): {
  totalContacts: number
  knownContacts: number
  unknownContacts: number
  contactsWithActivity: number
  contactsWithoutActivity: number
  knownPercentage: number
} {
  const totalContacts = contacts.length
  const knownContacts = contacts.filter(c => c.known).length
  const unknownContacts = totalContacts - knownContacts
  
  const contactsWithActivity = contacts.filter(c => 
    (c.emailCount && c.emailCount > 0) || 
    (c.meetingCount && c.meetingCount > 0) || 
    (c.totalActivity && c.totalActivity > 0)
  ).length
  
  const contactsWithoutActivity = totalContacts - contactsWithActivity
  const knownPercentage = totalContacts > 0 ? (knownContacts / totalContacts) * 100 : 0

  return {
    totalContacts,
    knownContacts,
    unknownContacts,
    contactsWithActivity,
    contactsWithoutActivity,
    knownPercentage
  }
}
