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

    // Get player counts
    const { data: allPlayers } = await supabaseServer
      .from('players')
      .select('status')

    const survivors = (allPlayers || []).filter((p: any) => p.status === 'alive').length
    const eliminated = (allPlayers || []).filter((p: any) => p.status === 'eliminated').length
    const totalPlayers = allPlayers?.length || 0

    // Get pool total
    const { data: playerData } = await supabaseServer
      .from('players')
      .select('total_paid')

    const poolTotal = (playerData || []).reduce((sum: number, p: any) => sum + (p.total_paid || 0), 0)

    return NextResponse.json(
      {
        current_week: currentWeek,
        total_players: totalPlayers,
        survivors,
        eliminated,
        pool_total: poolTotal,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Admin data error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch admin data' },
      { status: 500 }
    )
  }
}
