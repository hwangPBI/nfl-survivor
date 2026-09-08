import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    // Get current week
    const { data: weekData } = await supabaseServer
      .from('game_state')
      .select('current_week')
      .single()

    const currentWeek = weekData?.current_week || 1

    // Get survivors with their picks
    const { data: survivors, error: survivorsError } = await supabaseServer
      .from('players')
      .select('*, picks(*)')
      .eq('status', 'alive')

    if (survivorsError) throw survivorsError

    // Get eliminated and eligible for buyback with their picks
    const { data: eliminated, error: eliminatedError } = await supabaseServer
      .from('players')
      .select('*, picks(*)')
      .in('status', ['eliminated', 'eligible_for_buyback'])

    if (eliminatedError) throw eliminatedError

    // Calculate pool total
    const { data: allPlayers } = await supabaseServer
      .from('players')
      .select('total_paid')

    const poolTotal = (allPlayers || []).reduce((sum: number, p: any) => sum + (p.total_paid || 0), 0)

    // Get current week pending picks with timestamps
    const { data: pendingPicks } = await supabaseServer
      .from('picks')
      .select('*, players(id, name, email)')
      .eq('week', currentWeek)
      .eq('result', 'pending')
      .order('created_at', { ascending: false })

    return NextResponse.json(
      {
        week: currentWeek,
        survivors: survivors || [],
        eliminated: eliminated || [],
        pool_total: poolTotal,
        pending_picks: pendingPicks || [],
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
