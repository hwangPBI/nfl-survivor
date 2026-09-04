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

    // Get survivors
    const { data: survivors, error: survivorsError } = await supabaseServer
      .from('players')
      .select('*')
      .eq('status', 'alive')

    if (survivorsError) throw survivorsError

    // Get eliminated and eligible for buyback
    const { data: eliminated, error: eliminatedError } = await supabaseServer
      .from('players')
      .select('*')
      .in('status', ['eliminated', 'eligible_for_buyback'])

    if (eliminatedError) throw eliminatedError

    // Calculate pool total
    const { data: allPlayers } = await supabaseServer
      .from('players')
      .select('total_paid')

    const poolTotal = (allPlayers || []).reduce((sum: number, p: any) => sum + (p.total_paid || 0), 0)

    return NextResponse.json(
      {
        week: currentWeek,
        survivors: survivors || [],
        eliminated: eliminated || [],
        pool_total: poolTotal,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Scoreboard fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch scoreboard' },
      { status: 500 }
    )
  }
}
