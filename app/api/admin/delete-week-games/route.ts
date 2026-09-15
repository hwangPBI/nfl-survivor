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

    const { data, error } = await supabaseServer
      .from('games')
      .delete()
      .eq('week', week)
      .select('id')

    if (error) throw error

    return NextResponse.json(
      {
        success: true,
        message: `Deleted ${data?.length || 0} games from week ${week}`,
        deletedCount: data?.length || 0,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Delete week games error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete games' },
      { status: 500 }
    )
  }
}
