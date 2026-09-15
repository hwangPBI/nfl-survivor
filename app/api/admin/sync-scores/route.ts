import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(req: NextRequest) {
  try {
    const espnResponse = await axios.get(
      'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
      { timeout: 5000 }
    )

    const espnEvents = espnResponse.data?.events || []

    if (espnEvents.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'ESPN returned 0 events',
        totalEvents: 0,
      })
    }

    const firstEvent = espnEvents[0]
    const comp = firstEvent.competitions?.[0]

    return NextResponse.json({
      success: true,
      espnConnected: true,
      totalEvents: espnEvents.length,
      firstGameExample: {
        away: comp?.competitors?.[0]?.team?.displayName,
        home: comp?.competitors?.[1]?.team?.displayName,
        status: comp?.status?.type,
        awayScore: comp?.competitors?.[0]?.score,
        homeScore: comp?.competitors?.[1]?.score,
      },
      allUniqueStatuses: [...new Set(espnEvents.map((e: any) => e.competitions?.[0]?.status?.type))],
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      errorCode: error.code,
    })
  }
}
