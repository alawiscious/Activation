// Data hosting configuration for production deployment
// This allows the app to load data from external sources instead of local files

export interface DataSource {
  name: string
  url: string
  description: string
  fallback?: string
}

export const DATA_SOURCES: Record<string, DataSource> = {
  // Option 1: AWS S3 (Recommended for production)
  s3: {
    name: 'AWS S3',
    url: 'https://activation-data.s3.amazonaws.com',
    description: 'Secure cloud storage with CDN',
    fallback: 'https://backup-activation-data.s3.amazonaws.com'
  },
  
  // Option 2: GitHub Raw (Free, good for public data)
  github: {
    name: 'GitHub Raw',
    url: 'https://raw.githubusercontent.com/alawiscious/Activation/main',
    description: 'Free hosting via GitHub repository',
    fallback: 'https://raw.githubusercontent.com/alawiscious/Activation/main'
  },
  
  // Option 3: Google Drive (Easy to update)
  googleDrive: {
    name: 'Google Drive',
    url: 'https://drive.google.com/uc?export=download&id=',
    description: 'Easy file sharing and updates',
    fallback: 'https://docs.google.com/spreadsheets/d/'
  },
  
  // Option 4: Custom CDN
  cdn: {
    name: 'Custom CDN',
    url: 'https://cdn.klickcloud.net/activation-data',
    description: 'Custom CDN for optimal performance',
    fallback: 'https://backup-cdn.klickcloud.net/activation-data'
  }
}

// Get the current data source based on environment
export function getDataSource(): DataSource {
  const source = (import.meta as any)?.env?.VITE_DATA_SOURCE || 'github'
  return DATA_SOURCES[source] || DATA_SOURCES.github
}

// Build full URL for a data file
export function getDataUrl(filename: string): string {
  const source = getDataSource()
  const baseUrl = source.url
  
  // Handle different URL patterns
  if (source.name === 'Google Drive') {
    // For Google Drive, you'll need to get the file ID
    const fileIds: Record<string, string> = {
      'master-contacts.csv': 'YOUR_GOOGLE_DRIVE_FILE_ID_1',
      'master-revenue.csv': 'YOUR_GOOGLE_DRIVE_FILE_ID_2',
      'master-company-file.csv': 'YOUR_GOOGLE_DRIVE_FILE_ID_3'
    }
    const fileId = fileIds[filename]
    return fileId ? `${baseUrl}${fileId}` : `${baseUrl}${filename}`
  }
  
  return `${baseUrl}/${filename}`
}

// Get fallback URL if primary fails
export function getFallbackUrl(filename: string): string | null {
  const source = getDataSource()
  if (!source.fallback) return null
  
  if (source.name === 'Google Drive') {
    const fileIds: Record<string, string> = {
      'master-contacts.csv': 'YOUR_BACKUP_GOOGLE_DRIVE_FILE_ID_1',
      'master-revenue.csv': 'YOUR_BACKUP_GOOGLE_DRIVE_FILE_ID_2',
      'master-company-file.csv': 'YOUR_BACKUP_GOOGLE_DRIVE_FILE_ID_3'
    }
    const fileId = fileIds[filename]
    return fileId ? `${source.fallback}${fileId}` : `${source.fallback}${filename}`
  }
  
  return `${source.fallback}/${filename}`
}

// File mapping for different environments
export const DATA_FILES = {
  contacts: 'Public/master-contacts.csv',
  revenue: 'Public/Master Import file.csv', 
  companies: 'Public/Master Import file.csv'  // Use Master Import file for company data since it contains company/brand info
} as const

// Helper to load data with fallback
export async function loadDataFile(filename: string): Promise<string> {
  const primaryUrl = getDataUrl(filename)
  const fallbackUrl = getFallbackUrl(filename)
  
  try {
    console.log(`📥 Loading data from: ${primaryUrl}`)
    const response = await fetch(primaryUrl)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.text()
    console.log(`✅ Successfully loaded ${filename} (${data.length} characters)`)
    return data
    
  } catch (error) {
    console.warn(`⚠️ Failed to load from primary source: ${error}`)
    
    if (fallbackUrl) {
      try {
        console.log(`📥 Trying fallback: ${fallbackUrl}`)
        const response = await fetch(fallbackUrl)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.text()
        console.log(`✅ Successfully loaded ${filename} from fallback (${data.length} characters)`)
        return data
        
      } catch (fallbackError) {
        console.error(`❌ Both primary and fallback failed for ${filename}:`, fallbackError)
        throw new Error(`Unable to load ${filename} from any source`)
      }
    }
    
    throw error
  }
}
