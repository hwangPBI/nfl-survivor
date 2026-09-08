import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import axios from 'axios'

async function fetchNFLSchedule(week: number, year: number = 2026) {
  try {
    // Try multiple API sources

    // Option 1: Try TheSportsDB
    console.log(`Attempting to fetch from TheSportsDB for week ${week}, year ${year}`)
    try {
      const sportsdbUrl = `https://www.thesportsdb.com/api/v1/eventslast.php?id=133602`
      const sportsdbResponse = await axios.get(sportsdbUrl, { timeout: 10000 })

      if (sportsdbResponse.data.results) {
        const games: any[] = []
        sportsdbResponse.data.results.forEach((event: any) => {
          // Parse TheSportsDB format
          const eventWeek = parseInt(event.intRound) || 0
          if (eventWeek === week) {
            const team1 = event.strHomeTeam || ''
            const team2 = event.strAwayTeam || ''
            const startTime = event.dateEvent || new Date().toISOString()

            if (team1 && team2) {
              games.push({
                week,
                team1: team2, // Away team
                team2: team1, // Home team
                start_time: startTime,
                start_timestamp: new Date(startTime).getTime(),
              })
              console.log(`✓ Added from TheSportsDB: ${team2} vs ${team1}`)
            }
          }
        })

        if (games.length > 0) {
          console.log(`Successfully fetched ${games.length} games from TheSportsDB`)
          return games
        }
      }
    } catch (e) {
      console.log('TheSportsDB fetch failed, trying alternative...')
    }

    // Option 2: Try ESPN as fallback
    console.log(`Attempting ESPN API as fallback...`)
    const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/schedule?week=${week}&year=${year}`
    const espnResponse = await axios.get(espnUrl, { timeout: 10000 })

    const events = espnResponse.data.events || []
    const games: any[] = []

    console.log(`ESPN returned ${events.length} events for week ${week}`)

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
          console.log(`✓ Added from ESPN: ${away} vs ${home}`)
        }
      } catch (e) {
        console.error('Error parsing ESPN event:', e)
      }
    })

    if (games.length > 0) {
      console.log(`Successfully fetched ${games.length} games from ESPN`)
    }

    return games
  } catch (error: any) {
    console.error('Error fetching schedule from all sources:', error.message)
    if (error.response) {
      console.error('Response status:', error.response.status)
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
