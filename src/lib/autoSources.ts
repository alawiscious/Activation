import { openDB, DBSchema } from 'idb'

export type AutoRunMode = 'off' | 'whenEmpty' | 'always'
export interface AutoImportSource {
  id: string
  type: 'master' | 'contacts'
  name: string
  size: number
  content: string
  autoRun: AutoRunMode
  contactsOptions?: { overwrite: boolean; preserveEdits: boolean }
  lastRunAt?: string
  createdAt: string
}

interface AutoSourcesDB extends DBSchema {
  sources: {
    key: string
    value: AutoImportSource
  }
}

async function getDB() {
  return openDB<AutoSourcesDB>('pvp-auto-sources', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('sources')) {
        db.createObjectStore('sources', { keyPath: 'id' })
      }
    },
  })
}

export async function listAutoSources(): Promise<AutoImportSource[]> {
  const db = await getDB()
  return await db.getAll('sources')
}

export async function putAutoSource(source: AutoImportSource): Promise<void> {
  const db = await getDB()
  await db.put('sources', source)
}

export async function deleteAutoSource(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('sources', id)
}

