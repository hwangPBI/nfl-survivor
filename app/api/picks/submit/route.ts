import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { player_email, week, team_picked } = await req.json()

    if (!player_email || !week || !team_picked) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get player
    const { data: player, error: playerError } = await supabaseServer
      .from('players')
      .select('id, status')
      .eq('email', player_email)
      .single()

    if (playerError || !player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      )
    }

    // Check if player is still alive
    if (player.status === 'eliminated') {
      return NextResponse.json(
        { error: 'You have been eliminated' },
        { status: 400 }
      )
    }

    // Get game info to check deadline
    const { data: game } = await supabaseServer
      .from('games')
      .select('start_timestamp')
      .eq('week', week)
      .limit(1)
      .single()

    if (game && game.start_timestamp < Date.now()) {
      return NextResponse.json(
        { error: 'Deadline has passed' },
        { status: 400 }
      )
    }

    // Check for existing pick
    const { data: existing } = await supabaseServer
      .from('picks')
      .select('id')
      .eq('player_id', player.id)
      .eq('week', week)
      .single()

    if (existing) {
      // Update existing pick
      const { error: updateError } = await supabaseServer
        .from('picks')
        .update({ team_picked })
        .eq('id', existing.id)

      if (updateError) throw updateError
    } else {
      // Create new pick
      const { error: insertError } = await supabaseServer
        .from('picks')
        .insert({
          player_id: player.id,
          week,
          team_picked,
          result: 'pending',
        })

      if (insertError) throw insertError
    }

    return NextResponse.json(
      { message: 'Pick submitted successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Pick submission error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to submit pick' },
      { status: 500 }
    )
  }
}
