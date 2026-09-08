import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Get player
    const { data: player } = await supabaseServer
      .from('players')
      .select('id')
      .eq('email', email)
      .single()

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      )
    }

    // Get all picks for this player
    const { data: picks, error } = await supabaseServer
      .from('picks')
      .select('*')
      .eq('player_id', player.id)
      .order('week', { ascending: true })

    if (error) throw error

    return NextResponse.json(
      { picks: picks || [] },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Pick history error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch history' },
      { status: 500 }
    )
  }
}
