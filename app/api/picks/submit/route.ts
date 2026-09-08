import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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
      .select('start_timestamp, start_time')
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

    // Send confirmation email
    if (process.env.RESEND_API_KEY) {
      try {
        let gameTime = 'TBD'
        if (game?.start_time) {
          // Convert ISO timestamp to PT format: "2026-09-13 1:25 PM PT"
          const date = new Date(game.start_time)
          const ptFormatter = new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'America/Los_Angeles',
          })
          const parts = ptFormatter.formatToParts(date)
          const year = parts.find(p => p.type === 'year')?.value
          const month = parts.find(p => p.type === 'month')?.value
          const day = parts.find(p => p.type === 'day')?.value
          const hour = parts.find(p => p.type === 'hour')?.value
          const minute = parts.find(p => p.type === 'minute')?.value
          const period = parts.find(p => p.type === 'dayPeriod')?.value
          gameTime = `${year}-${month}-${day} ${hour}:${minute} ${period} PT`
        }
        console.log('Sending email to:', player_email)
        const result = await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: player_email,
          subject: `NFL Survivor - Week ${week} Pick Confirmed`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Pick Confirmed! 🏈</h2>
              <p>Your pick for Week ${week} has been recorded:</p>
              <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Team:</strong> ${team_picked}</p>
                <p><strong>Week:</strong> ${week}</p>
                <p><strong>Game Time (PT):</strong> ${gameTime}</p>
              </div>
              <p>You can change your pick anytime before the game starts.</p>
              <p>Good luck!</p>
            </div>
          `,
        })
        console.log('Email sent successfully:', result)
      } catch (emailError) {
        console.error('Email send error:', emailError)
        // Don't fail the pick if email fails
      }
    } else {
      console.log('RESEND_API_KEY not set, skipping email')
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
