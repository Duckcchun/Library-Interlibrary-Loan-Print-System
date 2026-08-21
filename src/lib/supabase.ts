import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface LibraryRow {
  id: string
  name: string
  display_name: string
  color: string
  type: 'general' | 'smart'
  sort_order: number
  created_at: string
}
