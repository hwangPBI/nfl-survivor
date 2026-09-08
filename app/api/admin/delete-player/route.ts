import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { admin_password, player_id } = await req.json()

    // Verify admin password
    if (admin_password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!player_id) {
      return NextResponse.json(
        { error: 'Missing player_id' },
        { status: 400 }
      )
    }

    // Get player info before deletion (for response message)
    const { data: player } = await supabaseServer
      .from('players')
      .select('name, email')
      .eq('id', player_id)
      .single()

    // Delete player (picks will cascade delete due to foreign key)
    const { error } = await supabaseServer
      .from('players')
      .delete()
      .eq('id', player_id)

    if (error) throw error

    return NextResponse.json(
      {
        message: `Player "${player?.name}" (${player?.email}) has been deleted from the pool.`,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Delete player error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete player' },
      { status: 500 }
    )
  }
}
