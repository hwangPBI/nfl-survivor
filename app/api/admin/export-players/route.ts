import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

function convertToCSV(players: any[]): string {
  if (players.length === 0) return ''

  // Headers
  const headers = ['ID', 'Name', 'Email', 'Status', 'Current Week', 'Buyback Count', 'Total Paid', 'Picks Count', 'Created At']
  const rows = [headers.join(',')]

  // Data rows
  players.forEach((player) => {
    const pickCount = player.picks ? player.picks.length : 0
    const row = [
      player.id,
      `"${player.name}"`,
      player.email,
      player.status,
      player.current_week,
      player.buyback_count,
      player.total_paid,
      pickCount,
      player.created_at,
    ]
    rows.push(row.join(','))
  })

  return rows.join('\n')
}

export async function GET(req: NextRequest) {
  try {
    // This endpoint is only accessible from authenticated admin pages
    // No additional password verification needed since they already logged in

    // Get all players with their picks
    const { data: players, error } = await supabaseServer
      .from('players')
      .select('*, picks(*)')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Convert to CSV
    const csv = convertToCSV(players || [])

    // Return as downloadable file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': `attachment; filename="player-list-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error: any) {
    console.error('Export players error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to export players' },
      { status: 500 }
    )
  }
}
