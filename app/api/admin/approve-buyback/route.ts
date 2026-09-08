import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { admin_password, player_id, buyback_number } = await req.json()

    // Verify admin password
    if (admin_password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!player_id || !buyback_number) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get player
    const { data: player, error: playerError } = await supabaseServer
      .from('players')
      .select('*')
      .eq('id', player_id)
      .single()

    if (playerError || !player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      )
    }

    // Check if player is eligible for buyback
    if (player.status !== 'eligible_for_buyback') {
      return NextResponse.json(
        { error: 'Player is not eligible for buyback' },
        { status: 400 }
      )
    }

    // Get current week
    const { data: weekData } = await supabaseServer
      .from('game_state')
      .select('current_week')
      .single()

    const currentWeek = weekData?.current_week || 1

    // Update player status to alive
    const { error: updateError } = await supabaseServer
      .from('players')
      .update({
        status: 'alive',
        buyback_count: player.buyback_count + 1,
        current_week: currentWeek,
        total_paid: player.total_paid + (buyback_number * 10),
      })
      .eq('id', player_id)

    if (updateError) throw updateError

    // Record buyback transaction
    const { error: buybackError } = await supabaseServer
      .from('buybacks')
      .insert({
        player_id,
        week: currentWeek,
        cost: buyback_number * 10,
      })

    if (buybackError) throw buybackError

    return NextResponse.json(
      {
        message: `Buyback approved for ${player.name}. Cost: $${buyback_number * 10}. Total paid: $${player.total_paid + (buyback_number * 10)}`,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Buyback approval error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to approve buyback' },
      { status: 500 }
    )
  }
}
