import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Client for browser
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client for server
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey)

export interface Player {
  id: string
  name: string
  email: string
  status: 'alive' | 'eliminated' | 'eligible_for_buyback'
  current_week: number
  buyback_count: number
  total_paid: number
  created_at: string
}

export interface Pick {
  id: string
  player_id: string
  week: number
  team_picked: string
  result: 'pending' | 'win' | 'loss'
  created_at: string
}

export interface Game {
  id: string
  week: number
  team1: string
  team2: string
  start_time: string
  start_timestamp: number
  winner: string | null
  created_at: string
}
