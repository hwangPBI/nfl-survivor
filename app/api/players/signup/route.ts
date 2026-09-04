import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { name, email } = await req.json()

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Check if player already exists
    const { data: existing } = await supabaseServer
      .from('players')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Create new player
    const { data, error } = await supabaseServer
      .from('players')
      .insert({
        name,
        email,
        status: 'alive',
        current_week: 1,
        buyback_count: 0,
        total_paid: 0,
      })
      .select()

    if (error) throw error

    return NextResponse.json(
      { message: 'Player created successfully', player: data[0] },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: error.message || 'Signup failed' },
      { status: 500 }
    )
  }
}
