import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { week } = await req.json()

    if (!week || week < 1 || week > 17) {
      return NextResponse.json(
        { error: 'Invalid week number. Must be 1-17.' },
        { status: 400 }
      )
    }

    // Update current week in game_state
    const { data, error } = await supabaseServer
      .from('game_state')
      .update({ current_week: week })
      .eq('id', 1)
      .select()

    if (error) throw error

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Game state not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: `Current week updated to ${week}`,
        currentWeek: data[0].current_week,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Update current week error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update current week' },
      { status: 500 }
    )
  }
}
