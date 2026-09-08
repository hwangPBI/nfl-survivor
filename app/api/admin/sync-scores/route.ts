import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import axios from 'axios'

async function fetchNFLScores(week: number) {
  try {
    // Fetch from ESPN API (simplified - in production use a proper sports API)
    // This is a placeholder - you'll need to implement actual score fetching
    const response = await axios.get(
      `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`
    )

    // Filter scores for the current week
    const events = response.data.events || []
    const scores: any[] = []

    events.forEach((event: any) => {
      // Only process completed games
      const status = event.competitions[0]?.status?.type || ''
      if (status !== 'final' && status !== 'completed') {
        return // Skip games that haven't finished
      }

      const away = event.competitions[0]?.competitors[0]?.team?.displayName || ''
      const home = event.competitions[0]?.competitors[1]?.team?.displayName || ''
      const awayScore = event.competitions[0]?.competitors[0]?.score || 0
      const homeScore = event.competitions[0]?.competitors[1]?.score || 0
      const winner = awayScore > homeScore ? away : home

      if (away && home) {
        scores.push({
          week,
          team1: away,
          team2: home,
          winner,
          timestamp: new Date(event.date).getTime(),
        })
      }
    })

    return scores
  } catch (error) {
    console.error('Error fetching scores:', error)
    return []
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get current week
    const { data: weekData } = await supabaseServer
      .from('game_state')
      .select('current_week')
      .single()

    const currentWeek = weekData?.current_week || 1

    // Fetch scores from ESPN
    const scores = await fetchNFLScores(currentWeek)

    if (scores.length === 0) {
      return NextResponse.json(
        { message: 'No scores found or scores not ready yet' },
        { status: 200 }
      )
    }

    // Update games with results
    for (const score of scores) {
      await supabaseServer
        .from('games')
        .update({ winner: score.winner })
        .eq('week', score.week)
        .eq('team1', score.team1)
        .eq('team2', score.team2)
    }

    // Get all picks for current week
    const { data: picks } = await supabaseServer
      .from('picks')
      .select('*, players(email, status, current_week, buyback_count)')
      .eq('week', currentWeek)
      .eq('result', 'pending')

    // Process each pick
    for (const pick of picks || []) {
      const gameResult = scores.find(
        (s) =>
          (s.team1 === pick.team_picked || s.team2 === pick.team_picked) &&
          s.week === currentWeek
      )

      if (gameResult) {
        const won = gameResult.winner === pick.team_picked
        const result = won ? 'win' : 'loss'

        // Update pick
        await supabaseServer
          .from('picks')
          .update({ result })
          .eq('id', pick.id)

        // If lost, check buyback eligibility
        if (!won) {
          const player = pick.players

          if (currentWeek < 9 && player.buyback_count < 3) {
            // Eligible for buyback
            await supabaseServer
              .from('players')
              .update({ status: 'eligible_for_buyback' })
              .eq('id', pick.player_id)
          } else {
            // Eliminated
            await supabaseServer
              .from('players')
              .update({ status: 'eliminated' })
              .eq('id', pick.player_id)
          }
        }
      }
    }

    return NextResponse.json(
      { message: `Scores synced for week ${currentWeek}` },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Sync scores error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync scores' },
      { status: 500 }
    )
  }
}
