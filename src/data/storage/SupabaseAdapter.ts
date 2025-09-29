// Supabase implementation of StorageAdapter (stubbed for future implementation)
import type { StorageAdapter, CompanyState } from '@/types/domain'

export class SupabaseAdapter implements StorageAdapter {
  private _supabaseUrl: string
  private _supabaseKey: string

  constructor(supabaseUrl: string, supabaseKey: string) {
    this._supabaseUrl = supabaseUrl
    this._supabaseKey = supabaseKey
  }

  async load(_companySlug: string): Promise<CompanyState | null> {
    // TODO: Implement Supabase client and data loading
    // Example implementation:
    // const { data, error } = await supabase
    //   .from('companies')
    //   .select('*')
    //   .eq('slug', companySlug)
    //   .single()
    
    console.warn(`SupabaseAdapter.load not implemented yet (URL: ${this._supabaseUrl})`)
    return null
  }

  async save(_companySlug: string, _state: CompanyState): Promise<void> {
    // TODO: Implement Supabase client and data saving
    // Example implementation:
    // const { error } = await supabase
    //   .from('companies')
    //   .upsert({
    //     slug: companySlug,
    //     name: state.name,
    //     data: JSON.stringify(state),
    //     updated_at: new Date().toISOString(),
    //   })
    
    console.warn(`SupabaseAdapter.save not implemented yet (Key: ${this._supabaseKey.substring(0, 10)}...)`)
  }

  async delete(_companySlug: string): Promise<void> {
    // TODO: Implement Supabase client and data deletion
    // Example implementation:
    // const { error } = await supabase
    //   .from('companies')
    //   .delete()
    //   .eq('slug', companySlug)
    
    console.warn('SupabaseAdapter.delete not implemented yet')
  }

  async listCompanies(): Promise<{ slug: string; name: string; updatedAt: Date }[]> {
    // TODO: Implement Supabase client and company listing
    // Example implementation:
    // const { data, error } = await supabase
    //   .from('companies')
    //   .select('slug, name, updated_at')
    //   .order('updated_at', { ascending: false })
    
    console.warn('SupabaseAdapter.listCompanies not implemented yet')
    return []
  }
}

// Factory function to create Supabase adapter with environment variables
export function createSupabaseAdapter(): SupabaseAdapter | null {
  const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL
  const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase environment variables not configured')
    return null
  }

  return new SupabaseAdapter(supabaseUrl, supabaseKey)
}
