import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { admin_password, player_id, total_paid } = await req.json()

    // Verify admin password
    if (admin_password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!player_id || total_paid === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Update player's total_paid
    const { error } = await supabaseServer
      .from('players')
      .update({ total_paid })
      .eq('id', player_id)

    if (error) throw error

    return NextResponse.json(
      { message: `Updated player total paid to $${total_paid}` },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Update player error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update player' },
      { status: 500 }
    )
  }
}
