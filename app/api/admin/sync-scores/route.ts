import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import axios from 'axios'

async function fetchNFLScores(week: number) {
  try {
    const response = await axios.get(
      'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard'
    )

    const events = response.data.events || []
    const scores: any[] = []

    events.forEach((event: any) => {
      const status = event.competitions[0]?.status
      const away = event.competitions[0]?.competitors[0]?.team?.displayName || ''
      const home = event.competitions[0]?.competitors[1]?.team?.displayName || ''
      const awayScore = event.competitions[0]?.competitors[0]?.score || 0
      const homeScore = event.competitions[0]?.competitors[1]?.score || 0

      const isCompleted =
        status?.name === 'STATUS_FINAL' ||
        status?.completed === true ||
        (awayScore > 0 && homeScore > 0)

      if (!isCompleted) {
        return
      }

      const winner = awayScore > homeScore ? away : home

      if (away && home) {
        scores.push({
          espnTeam1: away,
          espnTeam2: home,
          winner,
          awayScore,
          homeScore,
        })
      }
    })

    return scores
  } catch (error) {
    console.error('Error fetching scores:', error)
    return []
  }
}

function normalizeTeamName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

async function matchTeamToDatabase(espnTeam: string, week: number) {
  const normalized = normalizeTeamName(espnTeam)

  const { data: games } = await supabaseServer
    .from('games')
    .select('team1, team2')
    .eq('week', week)

  for (const game of games || []) {
    if (normalizeTeamName(game.team1) === normalized) return game.team1
    if (normalizeTeamName(game.team2) === normalized) return game.team2
  }

  return null
}

export async function POST(req: NextRequest) {
  try {
    const { data: weekData } = await supabaseServer
      .from('game_state')
      .select('current_week')
      .single()

    const currentWeek = weekData?.current_week || 1

    const scores = await fetchNFLScores(currentWeek)

    if (scores.length === 0) {
      return NextResponse.json(
        { message: 'No scores found or scores not ready yet' },
        { status: 200 }
      )
    }

    const matchedScores: any[] = []
    for (const score of scores) {
      const dbTeam1 = await matchTeamToDatabase(score.espnTeam1, currentWeek)
      const dbTeam2 = await matchTeamToDatabase(score.espnTeam2, currentWeek)

      if (!dbTeam1 || !dbTeam2) {
        console.warn(
          `Could not match teams: ${score.espnTeam1} vs ${score.espnTeam2}`
        )
        continue
      }

      const normalizedWinner = normalizeTeamName(score.winner)
      const winner =
        normalizeTeamName(dbTeam1) === normalizedWinner ? dbTeam1 : dbTeam2

      matchedScores.push({
        dbTeam1,
        dbTeam2,
        winner,
      })

      await supabaseServer
        .from('games')
        .update({ winner })
        .eq('week', currentWeek)
        .eq('team1', dbTeam1)
        .eq('team2', dbTeam2)
    }

    const { data: picks } = await supabaseServer
      .from('picks')
      .select('*, players(email, status, current_week, buyback_count)')
      .eq('week', currentWeek)
      .eq('result', 'pending')

    for (const pick of picks || []) {
      const gameResult = matchedScores.find((s) =>
        normalizeTeamName(pick.team_picked) === normalizeTeamName(s.winner)
      )

      if (gameResult) {
        const won = normalizeTeamName(pick.team_picked) === normalizeTeamName(gameResult.winner)
        const result = won ? 'win' : 'loss'

        await supabaseServer
          .from('picks')
          .update({ result })
          .eq('id', pick.id)

        if (!won) {
          const player = pick.players

          if (currentWeek < 9 && player.buyback_count < 3) {
            await supabaseServer
              .from('players')
              .update({ status: 'eligible_for_buyback' })
              .eq('id', pick.player_id)
          } else {
            await supabaseServer
              .from('players')
              .update({ status: 'eliminated' })
              .eq('id', pick.player_id)
          }
        }
      }
    }

    return NextResponse.json(
      { message: `Scores synced for week ${currentWeek}`, scoresProcessed: matchedScores.length },
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
