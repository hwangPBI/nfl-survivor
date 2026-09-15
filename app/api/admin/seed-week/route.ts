import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import axios from 'axios'

export async function POST(req: NextRequest) {
  try {
    const { week } = await req.json()

    if (!week || week < 1 || week > 17) {
      return NextResponse.json(
        { error: 'Invalid week number. Must be 1-17.' },
        { status: 400 }
      )
    }

    // Fetch all NFL games from ESPN
    const espnResponse = await axios.get(
      'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
      { timeout: 5000 }
    )

    const espnEvents = espnResponse.data?.events || []

    if (espnEvents.length === 0) {
      return NextResponse.json(
        { error: 'No games found from ESPN' },
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
          error: `Week ${week} games already seeded. Delete existing games first if you need to reseed.`,
          gamesCount: 0,
        },
        { status: 400 }
      )
    }

    // Insert games into database
    const gamesToInsert: any[] = []

    espnEvents.forEach((event: any) => {
      const comp = event.competitions?.[0]
      const away = comp?.competitors?.[0]?.team?.displayName
      const home = comp?.competitors?.[1]?.team?.displayName
      const startTime = event.date

      if (away && home && startTime) {
        const startTimestamp = new Date(startTime).getTime()

        gamesToInsert.push({
          week,
          team1: away,
          team2: home,
          start_time: startTime,
          start_timestamp: startTimestamp,
        })
      }
    })

    if (gamesToInsert.length === 0) {
      return NextResponse.json(
        { error: 'Could not parse any games from ESPN' },
        { status: 400 }
      )
    }

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
    console.error('Seed week error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to seed week' },
      { status: 500 }
    )
  }
}
