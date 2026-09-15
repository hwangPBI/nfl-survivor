import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

function parsePacificTime(dateTimeStr: string): Date {
  // Parse "2026-09-20 10:00 AM" as Pacific Time and return UTC Date
  const cleanStr = dateTimeStr.replace(/\s*(AM|PM)/i, '')
  const match = cleanStr.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})/)
  if (!match) throw new Error(`Invalid date format: ${dateTimeStr}`)

  const [, year, month, day, hour, min] = match
  let hour24 = parseInt(hour)
  if (/PM/i.test(dateTimeStr) && hour24 !== 12) hour24 += 12
  if (/AM/i.test(dateTimeStr) && hour24 === 12) hour24 = 0

  // Create initial UTC date from parsed input
  const inputUTC = new Date(`${year}-${month}-${day}T${String(hour24).padStart(2, '0')}:${min}:00Z`)

  // Format this UTC time as it appears in PT timezone using formatToParts
  const ptFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  const ptParts = ptFormatter.formatToParts(inputUTC)
  const ptHourPart = ptParts.find(p => p.type === 'hour')
  if (!ptHourPart) throw new Error('Failed to parse PT time')

  const ptHour = parseInt(ptHourPart.value)
  const userHour = hour24

  // Calculate offset: how many hours to add to make the UTC time display correctly in PT
  let offsetHours = userHour - ptHour
  if (offsetHours > 12) offsetHours -= 24
  if (offsetHours < -12) offsetHours += 24

  const resultUTC = new Date(inputUTC.getTime() + offsetHours * 3600000)
  console.log(`[parsePacificTime] input="${dateTimeStr}" userHour=${userHour} ptHour=${ptHour} offsetHours=${offsetHours} result=${resultUTC.toISOString()}`)
  return resultUTC
}

export async function POST(req: NextRequest) {
  try {
    console.log('[seed-week-manual] POST called')
    const { week, games } = await req.json()
    console.log('[seed-week-manual] Received week:', week, 'games count:', games?.length)

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
      const startTime = parsePacificTime(game.start_time)
      const isoString = startTime.toISOString()
      console.log(`[seed] Storing game: input="${game.start_time}" -> iso="${isoString}" -> timestamp=${startTime.getTime()}`)
      return {
        week,
        team1: game.team1,
        team2: game.team2,
        start_time: isoString,
        start_timestamp: startTime.getTime(),
      }
    })

    // Debug: show what we're about to insert
    const debugInfo = gamesToInsert.slice(0, 2).map(g => ({
      team1: g.team1,
      team2: g.team2,
      start_time: g.start_time,
      start_timestamp: g.start_timestamp,
    }))

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
        debug: {
          prepared: debugInfo,
          stored: (insertedGames || []).slice(0, 2).map((g: any) => ({
            team1: g.team1,
            team2: g.team2,
            start_time: g.start_time,
            start_timestamp: g.start_timestamp,
          })),
        },
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
