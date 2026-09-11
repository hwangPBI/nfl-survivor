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

    // Get all players with their picks
    const { data: players, error: playersError } = await supabaseServer
      .from('players')
      .select('*, picks(*)')
      .order('created_at', { ascending: false })

    if (playersError) throw playersError

    // Process players data
    const playersData = (players || []).map((player: any) => {
      const allPicks = player.picks || []
      const currentPick = allPicks.find((p: any) => p.week === currentWeek)
      const hasPicked = !!currentPick

      return {
        id: player.id,
        name: player.name,
        email: player.email,
        status: player.status,
        buyback_count: player.buyback_count,
        total_paid: player.total_paid,
        current_pick: currentPick || null,
        has_picked: hasPicked,
        all_picks: allPicks.sort((a: any, b: any) => b.week - a.week),
      }
    })

    return NextResponse.json(
      {
        current_week: currentWeek,
        players: playersData,
        total_players: playersData.length,
        picked_count: playersData.filter((p: any) => p.has_picked).length,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Players status error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch players status' },
      { status: 500 }
    )
  }
}
