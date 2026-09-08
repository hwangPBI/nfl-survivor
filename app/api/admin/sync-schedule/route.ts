import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import axios from 'axios'

async function fetchNFLSchedule(week: number, year: number = 2026) {
  try {
    // Try fetching from ESPN schedule API
    const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/schedule?week=${week}&year=${year}`
    console.log(`Fetching from: ${url}`)

    const response = await axios.get(url, { timeout: 10000 })

    const events = response.data.events || []
    const games: any[] = []

    console.log(`ESPN returned ${events.length} events for week ${week}`)
    console.log('Response data keys:', Object.keys(response.data))

    if (events.length === 0) {
      console.log('No events found. Full response:', JSON.stringify(response.data).substring(0, 500))
    }

    events.forEach((event: any) => {
      try {
        const away = event.competitions?.[0]?.competitors?.[0]?.team?.displayName || ''
        const home = event.competitions?.[0]?.competitors?.[1]?.team?.displayName || ''
        const startTime = event.date || new Date().toISOString()

        if (away && home) {
          games.push({
            week,
            team1: away,
            team2: home,
            start_time: startTime,
            start_timestamp: new Date(startTime).getTime(),
          })
          console.log(`✓ Added: ${away} vs ${home}`)
        }
      } catch (e) {
        console.error('Error parsing event:', e)
      }
    })

    console.log(`Successfully parsed ${games.length} games for week ${week}`)
    return games
  } catch (error: any) {
    console.error('Error fetching schedule:', error.message)
    if (error.response) {
      console.error('Response status:', error.response.status)
      console.error('Response data:', error.response.data)
    }
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
