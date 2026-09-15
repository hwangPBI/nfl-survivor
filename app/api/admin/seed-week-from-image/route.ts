import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const week = parseInt(formData.get('week') as string)
    const imageFile = formData.get('image') as File

    if (!week || week < 1 || week > 17) {
      return NextResponse.json(
        { error: 'Invalid week number. Must be 1-17.' },
        { status: 400 }
      )
    }

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      )
    }

    // Read image file
    const imageBuffer = await imageFile.arrayBuffer()
    const base64Image = Buffer.from(imageBuffer).toString('base64')
    const mimeType = imageFile.type || 'image/png'

    // Use Claude vision to extract games from schedule image
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: `Extract all NFL games from this schedule image. For each game, provide:
Team1, Team2, YYYY-MM-DD HH:MM

Format each line exactly as: "Team Name, Team Name, 2026-MM-DD HH:MM"
Use 24-hour time format.
Include only the games, one per line, no headers or extra text.
Preserve the full team names (e.g., "Detroit Lions" not "Detroit").`,
            },
          ],
        },
      ],
    })

    // Extract text from Claude's response
    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : ''

    if (!responseText) {
      return NextResponse.json(
        { error: 'Could not extract games from image' },
        { status: 400 }
      )
    }

    // Parse extracted games
    const games = responseText
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        const parts = line.split(',').map((p) => p.trim())
        if (parts.length !== 3) {
          throw new Error(`Invalid format: "${line}"`)
        }
        return {
          team1: parts[0],
          team2: parts[1],
          start_time: parts[2],
        }
      })

    if (games.length === 0) {
      return NextResponse.json(
        { error: 'No games found in image' },
        { status: 400 }
      )
    }

    // Check if games for this week already exist
    const { data: existingGames } = await supabaseServer
      .from('games')
      .select('id')
      .eq('week', week)
      .limit(1)

    if (existingGames && existingGames.length > 0) {
      return NextResponse.json(
        {
          error: `Week ${week} games already exist. Delete them first.`,
          gamesCount: 0,
        },
        { status: 400 }
      )
    }

    // Prepare games for insertion
    const gamesToInsert = games.map((game) => {
      const startTime = new Date(game.start_time)
      return {
        week,
        team1: game.team1,
        team2: game.team2,
        start_time: startTime.toISOString(),
        start_timestamp: startTime.getTime(),
      }
    })

    // Insert all games
    const { data: insertedGames, error: insertError } = await supabaseServer
      .from('games')
      .insert(gamesToInsert)
      .select()

    if (insertError) throw insertError

    return NextResponse.json(
      {
        success: true,
        message: `Successfully seeded ${insertedGames?.length || 0} games for week ${week} from image`,
        gamesCount: insertedGames?.length || 0,
        games: (insertedGames || []).slice(0, 3).map((g) => ({
          team1: g.team1,
          team2: g.team2,
          startTime: g.start_time,
        })),
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Seed week from image error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to seed week from image' },
      { status: 500 }
    )
  }
}
