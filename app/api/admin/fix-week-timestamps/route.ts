import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { week } = await req.json()

    if (!week || week < 1 || week > 17) {
      return NextResponse.json(
        { error: 'Invalid week number. Must be 1-17.' },
        { status: 400 }
      )
    }

    // Fetch all games for this week
    const { data: games, error: fetchError } = await supabaseServer
      .from('games')
      .select('*')
      .eq('week', week)

    if (fetchError) throw fetchError
    if (!games || games.length === 0) {
      return NextResponse.json(
        { error: `No games found for week ${week}` },
        { status: 400 }
      )
    }

    // Prepare batch updates
    const updates = games.map((game: any) => {
      const startTime = new Date(game.start_time)
      return {
        id: game.id,
        week: game.week,
        team1: game.team1,
        team2: game.team2,
        start_time: game.start_time,
        start_timestamp: startTime.getTime(),
        winner: game.winner,
      }
    })

    // Batch update all games at once
    const { error: updateError } = await supabaseServer
      .from('games')
      .upsert(updates)

    if (updateError) throw updateError

    return NextResponse.json(
      {
        success: true,
        message: `Fixed timestamps for ${updates.length} games in week ${week}`,
        gamesCount: updates.length,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Fix timestamps error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fix timestamps' },
      { status: 500 }
    )
  }
}
