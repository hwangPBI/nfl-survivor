import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    // Get current week
    const { data: weekData } = await supabaseServer
      .from('game_state')
      .select('current_week')
      .single()

    const currentWeek = weekData?.current_week || 1

    // Fetch games for current week
    const { data: games, error } = await supabaseServer
      .from('games')
      .select('*')
      .eq('week', currentWeek)
      .order('start_timestamp', { ascending: true })

    if (error) throw error

    return NextResponse.json(
      { games: games || [], current_week: currentWeek },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Games fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch games' },
      { status: 500 }
    )
  }
}
