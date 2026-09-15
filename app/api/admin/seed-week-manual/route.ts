import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { week, games } = await req.json()

    if (!week || week < 1 || week > 17) {
      return NextResponse.json(
        { error: 'Invalid week number. Must be 1-17.' },
        { status: 400 }
      )
    }

    if (!games || !Array.isArray(games) || games.length === 0) {
      return NextResponse.json(
        { error: 'games must be a non-empty array with {team1, team2, start_time}' },
        { status: 400 }
      )
    }

    // Check if games for this week already exist
    const { data: existingGames } = await supabaseServer
      .from('games')
      .select('id')
      .eq('week', week)
      .limit(1)

    if (existingGames && existingGames.length > 0) {
      return NextResponse.json(
        {
          error: `Week ${week} games already exist. Delete them first.`,
          gamesCount: 0,
        },
        { status: 400 }
      )
    }

    // Prepare games for insertion
    const gamesToInsert = games.map((game: any) => {
      const startTime = new Date(game.start_time)
      return {
        week,
        team1: game.team1,
        team2: game.team2,
        start_time: startTime.toISOString(),
        start_timestamp: startTime.getTime(),
      }
    })

    // Insert all games
    const { data: insertedGames, error: insertError } = await supabaseServer
      .from('games')
      .insert(gamesToInsert)
      .select()

    if (insertError) throw insertError

    return NextResponse.json(
      {
        success: true,
        message: `Successfully seeded ${insertedGames?.length || 0} games for week ${week}`,
        gamesCount: insertedGames?.length || 0,
        games: (insertedGames || []).slice(0, 3).map((g: any) => ({
          team1: g.team1,
          team2: g.team2,
          startTime: g.start_time,
        })),
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Seed week manual error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to seed week' },
      { status: 500 }
    )
  }
}
