import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import axios from 'axios'

async function fetchNFLSchedule(week: number, year: number = 2026) {
  try {
    // Fetch from ESPN schedule API
    const response = await axios.get(
      `https://site.api.espn.com/apis/site/v2/sports/football/nfl/schedule`
    )

    const events = response.data.events || []
    const games: any[] = []

    events.forEach((event: any) => {
      // Extract game info
      const eventWeek = event.week || 0
      if (eventWeek !== week) return

      const away = event.competitions[0]?.competitors[0]?.team?.displayName || ''
      const home = event.competitions[0]?.competitors[1]?.team?.displayName || ''
      const startTime = event.date || new Date().toISOString()

      if (away && home) {
        games.push({
          week,
          team1: away,
          team2: home,
          start_time: startTime,
          start_timestamp: new Date(startTime).getTime(),
        })
      }
    })

    return games
  } catch (error) {
    console.error('Error fetching schedule:', error)
    return []
  }
}

export async function POST(req: NextRequest) {
  try {
    const { week } = await req.json()

    if (!week) {
      return NextResponse.json(
        { error: 'Week parameter is required' },
        { status: 400 }
      )
    }

    // Fetch schedule from ESPN
    const games = await fetchNFLSchedule(week)

    if (games.length === 0) {
      return NextResponse.json(
        { message: 'No games found for this week' },
        { status: 200 }
      )
    }

    // Insert games into database (skip if already exist)
    let addedCount = 0
    for (const game of games) {
      const { data: existing } = await supabaseServer
        .from('games')
        .select('id')
        .eq('week', game.week)
        .eq('team1', game.team1)
        .eq('team2', game.team2)
        .single()

      if (!existing) {
        const { error } = await supabaseServer
          .from('games')
          .insert({
            week: game.week,
            team1: game.team1,
            team2: game.team2,
            start_time: game.start_time,
            start_timestamp: game.start_timestamp,
          })

        if (!error) {
          addedCount++
          console.log(`✓ Added: Week ${game.week} - ${game.team1} vs ${game.team2}`)
        }
      }
    }

    return NextResponse.json(
      {
        message: `Schedule synced for week ${week}. Added ${addedCount} new games.`,
        games_added: addedCount,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Sync schedule error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync schedule' },
      { status: 500 }
    )
  }
}
