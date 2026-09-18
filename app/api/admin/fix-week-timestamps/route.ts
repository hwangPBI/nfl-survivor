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

    console.log('[fix-timestamps] Fetched games:', JSON.stringify(games.slice(0, 1)))

    // Update timestamps one by one to avoid constraint issues
    let fixedCount = 0
    for (const game of games) {
      const startTime = new Date(game.start_time)
      const newTimestamp = startTime.getTime()

      console.log(`[fix-timestamps] Updating game ${game.id}: start_time=${game.start_time} -> timestamp=${newTimestamp}`)

      const { error: updateError } = await supabaseServer
        .from('games')
        .update({ start_timestamp: newTimestamp })
        .eq('id', game.id)

      if (updateError) {
        console.error(`[fix-timestamps] Error updating game ${game.id}:`, updateError)
        throw updateError
      }
      fixedCount++
    }

    return NextResponse.json(
      {
        success: true,
        message: `Fixed timestamps for ${fixedCount} games in week ${week}`,
        gamesCount: fixedCount,
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
