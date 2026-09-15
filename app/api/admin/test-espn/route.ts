import { NextResponse } from 'next/server'
import axios from 'axios'

export async function GET() {
  try {
    console.log('Testing ESPN API...')
    const response = await axios.get(
      'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard'
    )

    const events = response.data.events || []
    console.log(`ESPN returned ${events.length} events`)

    if (events.length > 0) {
      const firstGame = events[0]
      const status = firstGame.competitions[0]?.status?.type
      const away = firstGame.competitions[0]?.competitors[0]?.team?.displayName
      const home = firstGame.competitions[0]?.competitors[1]?.team?.displayName
      const awayScore = firstGame.competitions[0]?.competitors[0]?.score
      const homeScore = firstGame.competitions[0]?.competitors[1]?.score

      return NextResponse.json({
        success: true,
        totalEvents: events.length,
        firstGameExample: {
          away,
          home,
          status,
          awayScore,
          homeScore,
        },
        allStatuses: events.map((e: any) => e.competitions[0]?.status?.type),
      })
    }

    return NextResponse.json({
      success: true,
      totalEvents: 0,
      message: 'ESPN API returned 0 events',
    })
  } catch (error: any) {
    console.error('ESPN API test error:', error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        errorType: error.code || error.constructor.name,
      },
      { status: 500 }
    )
  }
}
